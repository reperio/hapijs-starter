'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = require("hapi");
const winston = require("winston");
const fs = require("fs");
const path = require("path");
const hapiAuthJwt2 = require('hapi-auth-jwt2');
require("winston-daily-rotate-file");
class Server {
    constructor(options) {
        this.config = Object.assign({}, Server.defaults, options);
        this.server = new Hapi.Server({ port: this.config.port, host: this.config.host, routes: { cors: this.config.cors } });
        this.app = this.server.app;
    }
    registerAdditionalRoutes(routes) {
        this.server.route(routes);
    }
    registerRoutesFromDirectory(directory) {
        fs
            .readdirSync(directory)
            .filter((fileName) => fileName.indexOf('.') !== 0 && fileName.slice(-3) === '.js')
            .forEach((fileName) => {
            this.server.route(require(path.join(directory, fileName)).default);
        });
    }
    async registerAdditionalPlugin(plugin) {
        return await this.server.register(plugin);
    }
    registerExtension(param1) {
        this.server.ext(param1);
    }
    async startServer() {
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
                handler: (req, h) => {
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
                handler: (req, h) => {
                    const response = h.response('success');
                    const origin = req.headers.origin;
                    const originIndex = this.config.corsOrigins.indexOf(origin);
                    const originMatch = this.config.corsOrigins.indexOf(origin) > -1 || this.config.corsOrigins.indexOf('*') > -1;
                    if (origin && originMatch) {
                        response.header('Access-Control-Allow-Origin', origin);
                    }
                    response.type('text/plain');
                    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                    return response;
                },
                config: {
                    cors: false,
                    auth: false
                }
            });
        }
        if (this.config.logAutoTraceLogging) {
            this.server.ext({
                type: "onPreResponse",
                method: async (req, h) => {
                    req.server.app.traceLogger.debug(`${req.path} ${JSON.stringify(req.headers)}`);
                    return h.continue;
                }
            });
        }
        if (this.config.authEnabled) {
            await this.server.register(hapiAuthJwt2);
            this.server.auth.strategy('jwt', 'jwt', {
                key: this.config.authSecret,
                validate: this.config.authValidateFunc,
                verifyOptions: { algorithms: ['HS256'] }
            });
            this.server.auth.default('jwt');
        }
        if (this.config.statusMonitor) {
            await this.server.register({ plugin: require('hapijs-status-monitor') });
        }
        if (!this.config.testMode) {
            await this.server.start();
            this.logger().info(`Server running at: ${this.server.info.uri}`);
        }
    }
    logger() {
        return this.server.app.logger;
    }
}
Server.defaults = {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    corsOrigins: [],
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
};
exports.Server = Server;
//# sourceMappingURL=index.js.map
