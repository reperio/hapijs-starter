import {EnginePrototype} from 'catbox';
import {Request, ResponseToolkit, ServerOptions, ServerOptionsCache} from 'hapi';
import {ValidationResult} from 'hapi-auth-jwt2';
import Transport from 'winston-transport';

export interface IHapijsStarterServerConfig {
    host: string;
    port: number;
    cors: boolean;
    corsOrigins: string[];
    corsHeaders: string;
    defaultRoute: boolean;
    statusMonitor: boolean;
    authEnabled: boolean;
    authSecret: string | null;
    logDirectory: string;
    logJson: boolean;
    logLevel: string;

    logDefaultActivityTransport: boolean;
    logDefaultConsoleTransport: boolean;
    logDefaultFileTransport: boolean;
    logDefaultTraceTransport: boolean;

    logAutoTraceLogging: boolean;

    logAddtionalActivityTransports: Transport[];
    logAddtionalLoggerTransports: Transport[];
    logAddtionalTraceTransports: Transport[];

    cache: EnginePrototype<any> | ServerOptionsCache | ServerOptionsCache[];

    hapiServerOptions?: Partial<ServerOptions>;

    authValidateFunc(decoded: any, request: Request, tk: ResponseToolkit): ValidationResult | Promise<ValidationResult>;
}
