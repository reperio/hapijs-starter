export default class ServerOptions {
    host: string;
    port: number;
    cors: boolean;
    statusMonitor: boolean;
    defaultRoute: boolean;

    logDirectory: string;
    logLevel: string;
    logJson: boolean;

    logDefaultFileTransport: boolean;
    logDefaultConsoleTransport: boolean;
    logDefaultTraceTransport: boolean;
    
    logAddtionalLoggerTransports: Array<any>;
    logAddtionalTraceTranceports: Array<any>;

    logAutoTraceLogging: boolean;

    authEnabled: boolean;
    authSecret: string;
    authValidateFunc: (decoded: any, request: any, callback: any) => any;
}