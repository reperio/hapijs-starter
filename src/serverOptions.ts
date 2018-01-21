class LoggingOptions {
    logDirectory: string;
    logLevel: string;
    json: boolean;

    defaultFileTransport: boolean;
    defaultConsoleTransport: boolean;
    defaultTraceTransport: boolean;
    
    addtionalLoggerTransports: Array<any>;
    addtionalTraceTranceports: Array<any>;

    autoTraceLogging: boolean;
}

class AuthOptions {
    enabled: boolean;
    secret: string;
    validateFunc: (decoded: any, request: any, callback: any) => any;
}

export default class ServerOptions {
    host: string;
    port: number;
    cors: boolean;
    statusMonitor: boolean;
    defaultRoute: boolean;
    logging: LoggingOptions;
    auth: AuthOptions;
}