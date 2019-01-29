import {EnginePrototype} from 'catbox';
import {Request, ResponseToolkit, ServerOptions, ServerOptionsCache} from 'hapi';
import {ValidationResult} from 'hapi-auth-jwt2';
import Transport from 'winston-transport';
import {IRequestApplicationState} from './requestApplicationState';
import {IServerApplicationState} from './serverApplicationState';

export interface IHapijsStarterServerConfig<ServerApplicationState extends IServerApplicationState = any,
                                            RequestApplicationState extends IRequestApplicationState = any> {
    host: string;
    port: number;
    cors: boolean;
    corsOrigins: string[];
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

    hapiServerOptions?: Partial<ServerOptions<ServerApplicationState, RequestApplicationState>>;

    authValidateFunc(decoded: any,
                     request: Request<ServerApplicationState, RequestApplicationState>,
                     tk: ResponseToolkit<ServerApplicationState, RequestApplicationState>)
        : ValidationResult | Promise<ValidationResult>;
}
