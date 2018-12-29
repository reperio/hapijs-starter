'use strict';

import fs from 'fs';
import Hapi, {ServerOptions} from 'hapi';
import path from 'path';
import winston, {Logger} from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';

import {IHapijsStarterServerConfig} from './models/ihapijsStarterServerConfig';
import {IServerApplicationState} from './models/serverApplicationState';

import {defaultConfig} from './defaultConfig';

export class Server {
    private _config: IHapijsStarterServerConfig;
    private _server: Hapi.Server | null = null;
    private _app: IServerApplicationState | null = null;
    private _appLogger: Logger | null = null;
    private _appTraceLogger: Logger | null = null;
    private _appActivityLogger: Logger | null = null;

    public get config() { return this._config; }
    public get server() { return this._server as Hapi.Server; }
    public get app() { return this._app as IServerApplicationState; }
    public get appLogger() { return this._appLogger as Logger; }
    public get appTraceLogger() { return this._appTraceLogger as Logger; }
    public get appActivityLogger() { return this._appActivityLogger as Logger; }

    constructor(config?: Partial<IHapijsStarterServerConfig>) {
        this._config = {...defaultConfig, ...(config || {})};
    }

    public registerRoutesFromDirectory(directory: string) {
        this.app.logger.info(`Loading routes from: ${directory}`);
        fs
            .readdirSync(directory)
            .filter(fileName => fileName.indexOf('.') !== 0 && fileName.slice(-3) === '.js')
            .forEach(fileName => {
                this.server.route(require(path.join(directory, fileName)).default);
                this.app.logger.info(`Added ${fileName} to the API routes.`);
            });
        return this;
    }

    public async configure() {
        this.configureHapiServer();
        this.configureLoggers();

        if (this.config.authEnabled && !this.config.authSecret) {
            throw new Error('JWT Auth secret must be provided if auth is enabled. ' +
                'Set config.authEnabled = false or provide a value for config.authSecret.');
        }

        if (this.config.defaultRoute) {
            this.configureDefaultRoute();
        }
        if (this.config.cors) {
            this.configureCors();
        }

        if (this.config.logAutoTraceLogging) {
            this.configureAutoTraceLogging();
        }

        if (this.config.authEnabled) {
            await this.configureAuth();
        }

        if (this.config.statusMonitor) {
            await this.configureStatusMonitor();
        }

        return this;
    }

    public async startServer() {
        await this.server.start();
        this.appLogger.info(`Server running at: ${this.server.info.uri}`);
    }

    private configureHapiServer() {
        const {routes: additionalRouteOptions, ...additionalOptionsWithoutRouteOptions} =
        this.config.hapiServerOptions || {} as Partial<ServerOptions>;

        const hapiConfig: ServerOptions = {
            cache: this.config.cache,
            host: this.config.host,
            port: this.config.port,
            routes: {
                cors: this.config.cors,
                ...additionalRouteOptions
            },
            ...additionalOptionsWithoutRouteOptions
        };

        this._server = new Hapi.Server(hapiConfig);
        this._app = this._server.app;
    }

    private configureLoggers() {
        const logTransports = [ ...(this.config.logAddtionalLoggerTransports || []) ];
        const traceTransports = [ ...(this.config.logAddtionalTraceTransports || []) ];
        const activityTransports = [ ...(this.config.logAddtionalActivityTransports || []) ];

        if (this.config.logDefaultFileTransport) {
            const logTransport = new WinstonDailyRotateFile({
                datePattern: 'YYYY-MM-DD',
                filename: `${this.config.logDirectory}/%DATE%.app.log`,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                level: this.config.logLevel
            }) as unknown as Transport; // hack to make WinstonDailyRotateFile cooperate,
                                        // there's probably a better way to do this
            logTransports.push(logTransport);
        }

        if (this.config.logDefaultConsoleTransport) {
            const logTransport = new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                ),
                level: this.config.logLevel
            });
            logTransports.push(logTransport);
        }

        if (this.config.logDefaultTraceTransport) {
            const logTransport = new WinstonDailyRotateFile({
                datePattern: 'YYYY-MM-DD',
                filename: `${this.config.logDirectory}/%DATE%.trace.log`,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                level: this.config.logLevel
            }) as unknown as Transport; // hack to make WinstonDailyRotateFile cooperate,
                                        // there's probably a better way to do this
            traceTransports.push(logTransport);
        }

        if (this.config.logDefaultActivityTransport) {
            const logTransport = new WinstonDailyRotateFile({
                datePattern: 'YYYY-MM-DD',
                filename: `${this.config.logDirectory}/%DATE%.activity.log`,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                level: this.config.logLevel
            }) as unknown as Transport; // hack to make WinstonDailyRotateFile cooperate,
                                        // there's probably a better way to do this
            activityTransports.push(logTransport);
        }

        if (logTransports.length === 0) {
            throw new Error('Default logger has no transports');
        }

        if (traceTransports.length === 0) {
            throw new Error('Trace logger has no transports');
        }

        if (activityTransports.length === 0) {
            throw new Error('Activity logger has no transports');
        }

        const appLogger = winston.createLogger({
            transports: logTransports
        });

        const appTraceLogger = winston.createLogger({
            transports: traceTransports
        });

        const appActivityLogger = winston.createLogger({
            transports: activityTransports
        });

        this.app.logger = this._appLogger = appLogger;
        this.app.traceLogger = this._appTraceLogger = appTraceLogger;
        this.app.activityLogger = this._appActivityLogger = appActivityLogger;
    }

    private configureDefaultRoute() {
        this.server.route({
            method: 'GET',
            path: '/',
            handler: () => {
                return 'hello';
            },
            options: {
                auth: false
            }
        });
    }

    private configureCors() {
        this.server.route({
            method: 'OPTIONS',
            path: '/{p*}',
            handler: (req, h) => {
                const response = h.response('success');

                const origin = req.headers.origin;
                const originMatch = this.config.corsOrigins.indexOf(origin) > -1
                    || this.config.corsOrigins.indexOf('*') > -1;

                if (origin && originMatch) {
                    response.header('Access-Control-Allow-Origin', origin);
                }

                response.type('text/plain');
                response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return response;
            },
            options: {
                auth: false,
                cors: false
            }
        });
    }

    private configureAutoTraceLogging() {
        this.server.ext({
            type: 'onPreResponse',
            method: async (req, h) => {
                req.server.app.traceLogger.debug(`${req.path} ${JSON.stringify(req.headers)}`);

                return h.continue;
            }
        });
    }

    private async configureAuth() {
        await this.server.register(require('hapi-auth-jwt2'));

        this.server.auth.strategy('jwt', 'jwt',
            {
                key: this.config.authSecret,
                validate: this.config.authValidateFunc,
                verifyOptions: { algorithms: [ 'HS256' ] }
            });

        this.server.auth.default('jwt');
    }

    private async configureStatusMonitor() {
        await this.server.register({
            plugin: require('hapijs-status-monitor'),
            options: {
                routeConfig: {
                    auth: false
                }
            }
        });
    }
}
