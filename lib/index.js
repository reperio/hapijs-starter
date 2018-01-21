'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Hapi from 'hapi';
import * as winston from 'winston';
require('winston-daily-rotate-file');
export default class Server {
    constructor() {
        const file_transport = new (winston.transports.DailyRotateFile)({
            name: "appFile",
            filename: "./logs/app.log",
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            level: "debug",
            humanReadableUnhandledException: true,
            handleExceptions: true,
            json: true
        });
        const console_transport = new (winston.transports.Console)({
            prepend: true,
            level: "debug",
            humanReadableUnhandledException: true,
            handleExceptions: true,
            json: false,
            colorize: true
        });
        const logger = new (winston.Logger)({
            transports: [
                file_transport,
                console_transport
            ]
        });
        this.server = new Hapi.Server({ port: 3000, host: 'localhost' });
        this.server.app.logger = logger;
        this.server.route({
            method: 'GET',
            path: '/',
            handler: (req, h) => {
                return 'hello';
            }
        });
    }
    startServer(isTestMode) {
        return __awaiter(this, void 0, void 0, function* () {
            //register standard plugins
            yield this.server.register({ plugin: require('hapijs-status-monitor') });
            if (!isTestMode) {
                yield this.server.start();
                this.server.app.logger.info(`Server running at: ${this.server.info.uri}`);
            }
        });
    }
}
//# sourceMappingURL=index.js.map