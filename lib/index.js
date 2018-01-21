'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = require("hapi");
const winston = require("winston");
const hapiAuthJwt2 = require('hapi-auth-jwt2');
require('winston-daily-rotate-file');
class Server {
    constructor(options) {
        this.config = Object.assign({}, Server.defaults, options);
    }
    async initialize() {
        const logTransports = [];
        const traceTransports = [];
        if (this.config.logging.defaultFileTransport) {
            logTransports.push(new (winston.transports.DailyRotateFile)({
                filename: `${this.config.logging.logDirectory}/app.log`,
                datePattern: 'yyyy-MM-dd.',
                prepend: true,
                level: this.config.logging.logLevel,
                humanReadableUnhandledException: true,
                handleExceptions: true,
                json: true
            }));
        }
        if (this.config.logging.defaultConsoleTransport) {
            logTransports.push(new (winston.transports.Console)({
                prepend: true,
                level: this.config.logging.logLevel,
                humanReadableUnhandledException: true,
                handleExceptions: true,
                json: false,
                colorize: true
            }));
        }
        if (this.config.logging.defaultTraceTransport) {
            traceTransports.push(new (winston.transports.DailyRotateFile)({
                filename: `${this.config.logging.logDirectory}/trace.log`,
                datePattern: 'yyyy-MM-dd.',
                prepend: true,
                level: this.config.logging.logLevel,
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
        this.server = new Hapi.Server({ port: this.config.port, host: this.config.host });
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
                handler: function (req, h) {
                    const response = h.response('success');
                    response.type('text/plain');
                    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    return response;
                },
                config: {
                    cors: true,
                    auth: false
                }
            });
        }
        if (this.config.logging.autoTraceLogging) {
            this.server.ext({
                type: "onPreResponse",
                method: async (req, h) => {
                    req.server.app.traceLogger.debug(`${req.path} ${JSON.stringify(req.headers)}`);
                    return h.continue;
                }
            });
        }
        if (this.config.auth.enabled) {
            await this.server.register(hapiAuthJwt2);
            this.server.auth.strategy('jwt', 'jwt', {
                key: this.config.auth.secret,
                validate: this.config.auth.validateFunc,
                verifyOptions: { algorithms: ['HS256'] }
            });
            this.server.auth.default('jwt');
        }
        if (this.config.statusMonitor) {
            await this.server.register({ plugin: require('hapijs-status-monitor') });
        }
    }
    registerAdditionalRoutes(routes) {
        this.server.route(routes);
    }
    async registerAdditionalPlugin(plugin) {
        return await this.server.register(plugin);
    }
    async startServer(isTestMode = false) {
        if (!isTestMode) {
            await this.server.start();
            this.server.app.logger.info(`Server running at: ${this.server.info.uri}`);
        }
    }
}
Server.defaultSecret = '6ba6161c-62e9-4cd7-9f6e-c6f6bf88557d';
Server.defaults = {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    defaultRoute: true,
    statusMonitor: true,
    auth: {
        enabled: true,
        secret: Server.defaultSecret,
        validateFunc: (decoded, request, callback) => {
            return { isValid: true };
        }
    },
    logging: {
        logDirectory: './logs',
        logLevel: 'debug',
        json: true,
        defaultFileTransport: true,
        defaultConsoleTransport: true,
        defaultTraceTransport: true,
        autoTraceLogging: true,
        addtionalLoggerTransports: [],
        addtionalTraceTranceports: []
    }
};
exports.default = Server;
//# sourceMappingURL=index.js.map