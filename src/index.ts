'use strict';

import * as Hapi from 'hapi';
import * as winston from 'winston';
import ServerOptions from './serverOptions';
import { reach } from 'joi';
import * as fs from 'fs';
import * as path from 'path';

const hapiAuthJwt2 = require('hapi-auth-jwt2');
import { RouteConfiguration, Request, ServerStartExtConfigurationObject, ServerRequestExtConfigurationObjectWithRequest } from 'hapi';
import 'winston-daily-rotate-file';

export class Server {
    static defaults: ServerOptions = {
        host: '0.0.0.0',
        port: 3000,
        cors: true,
        defaultRoute: true,
        statusMonitor: true,
        authEnabled: false,
        authSecret: null,
        authValidateFunc: (decoded, request, callback) => {
            return { isValid: true };
        },
        logDirectory: './logs',
        logLevel: 'debug',
        logJson: true,

        logDefaultFileTransport: true,
        logDefaultConsoleTransport: true,
        logDefaultTraceTransport: true,

        logAutoTraceLogging: true,

        logAddtionalLoggerTransports: [],
        logAddtionalTraceTranceports: [],
        testMode: false
    }

    server: any;
    config: ServerOptions;
    app: any;

    constructor(options?: Partial<ServerOptions>) {
        this.config = Object.assign({}, Server.defaults, options);
        this.server = new Hapi.Server(<any>{ port: this.config.port, host: this.config.host, routes: {cors: this.config.cors} });
        this.app = this.server.app;
    }

    registerAdditionalRoutes(routes: Array<RouteConfiguration>) {
        this.server.route(routes);
    }

    registerRoutesFromDirectory(directory: string) {
        fs
            .readdirSync(directory)
            .filter((fileName : any) => fileName.indexOf('.') !== 0 && fileName.slice(-3) === '.js')
            .forEach((fileName : any) => {
                this.server.route(require(path.join(directory, fileName)).default);
                console.log(`Added ${fileName} to the API routes.`);
            });
    }

    async registerAdditionalPlugin(plugin: any) {
        return await this.server.register(plugin);
    }

    registerExtension(param1: ServerStartExtConfigurationObject | ServerStartExtConfigurationObject[] | ServerRequestExtConfigurationObjectWithRequest | ServerRequestExtConfigurationObjectWithRequest[]) {
        this.server.ext(param1);
    }

    async startServer() : Promise<void> {
        const logTransports = [];
        const traceTransports = [];

        if (this.config.authEnabled && !this.config.authSecret) {
            throw new Error('JWT Auth secret must be provided if auth is enabled. Set config.authEnabled = false or provide a value for config.authSecret.');
        }

        if (this.config.logDefaultFileTransport) {
            logTransports.push(new (winston.transports.DailyRotateFile)({
                filename: `${this.config.logDirectory}/app.log`,
                datePattern: 'yyyy-MM-dd.',
                createTree: true,
                prepend: true,
                level: this.config.logLevel,
                humanReadableUnhandledException: true,
                handleExceptions: true,
                json: true
            }));
        }

        if (this.config.logDefaultConsoleTransport) {
            logTransports.push(new (winston.transports.Console)({
                prepend: true,
                level: this.config.logLevel,
                humanReadableUnhandledException: true,
                handleExceptions: true,
                json: false,
                colorize: true
            }));
        }

        if (this.config.logDefaultTraceTransport) {
            traceTransports.push(new (winston.transports.DailyRotateFile)({
                filename: `${this.config.logDirectory}/trace.log`,
                datePattern: 'yyyy-MM-dd.',
                createTree: true,
                prepend: true,
                level: this.config.logLevel,
                humanReadableUnhandledException: true,
                handleExceptions: true,
                json: true
            }));
        }

        const logger = new (winston.Logger)({
            transports: logTransports
        });

        const traceLogger = new (winston.Logger)({
            transports: traceTransports
        });

        
        this.server.app.logger = logger;
        this.server.app.traceLogger = traceLogger;
        
        if (this.config.defaultRoute) {
            this.server.route({
                method: 'GET',
                path: '/',
                handler: (req: Request, h: any) => {
                    return 'hello';
                },
                config: {
                    auth: false
                }
            });
        }

        if (this.config.cors) {
            this.server.route({
                method: 'OPTIONS',
                path: '/{p*}',
                handler: function(req: Request, h: any) {
                    const response = h.response('success');
                    response.type('text/plain');
                    response.header('Access-Control-Allow-Origin', '*');
                    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    return response;
                },
                config: {
                    cors: true,
                    auth: false
                }
            });
        }

        if (this.config.logAutoTraceLogging) {
            this.server.ext({
                type: "onPreResponse",
                method: async (req: Request, h: any) => {
                    req.server.app.traceLogger.debug(`${req.path} ${JSON.stringify(req.headers)}`);

                    return h.continue;
                }
            });
        }

        if (this.config.authEnabled) {
            await this.server.register(hapiAuthJwt2);
            
            this.server.auth.strategy('jwt', 'jwt',
            {
                key: this.config.authSecret,
                validate: this.config.authValidateFunc,
                verifyOptions: { algorithms: [ 'HS256' ] }
            });
        
            this.server.auth.default('jwt');
        }

        if (this.config.statusMonitor) {
            await this.server.register({plugin: require('hapijs-status-monitor')});
        }

        if (!this.config.testMode) {
            await this.server.start();
            this.logger().info(`Server running at: ${this.server.info.uri}`);
        }
    }

    logger() : winston.LoggerInstance {
        return this.server.app.logger;
    }
}

