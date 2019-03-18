import {IHapijsStarterServerConfig} from './models/ihapijsStarterServerConfig';

export const defaultConfig: IHapijsStarterServerConfig = {
    host: '0.0.0.0',
    port: 3000,

    cors: true,
    corsOrigins: [],
    corsHeaders: 'Content-Type, Authorization',
    defaultRoute: true,
    statusMonitor: true,

    authEnabled: false,
    authSecret: null,

    logDirectory: './logs',
    logJson: true,
    logLevel: 'debug',

    logDefaultActivityTransport: true,
    logDefaultConsoleTransport: true,
    logDefaultFileTransport: true,
    logDefaultTraceTransport: true,

    logAutoTraceLogging: true,

    logAddtionalActivityTransports: [],
    logAddtionalLoggerTransports: [],
    logAddtionalTraceTransports: [],

    cache: {
        engine: require('catbox-memory'),
        name: 'memory'
    },

    authValidateFunc: () => {
        return { isValid: true };
    }
};
