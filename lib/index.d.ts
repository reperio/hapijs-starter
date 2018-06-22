/// <reference types="winston" />
import * as winston from 'winston';
import ServerOptions from './serverOptions';
import { RouteConfiguration, ServerStartExtConfigurationObject, ServerRequestExtConfigurationObjectWithRequest } from 'hapi';
import 'winston-daily-rotate-file';
export declare class Server {
    static defaults: ServerOptions;
    server: any;
    config: ServerOptions;
    app: any;
    constructor(options?: Partial<ServerOptions>);
    registerAdditionalRoutes(routes: Array<RouteConfiguration>): void;
    registerRoutesFromDirectory(directory: string): void;
    registerAdditionalPlugin(plugin: any): Promise<any>;
    registerExtension(param1: ServerStartExtConfigurationObject | ServerStartExtConfigurationObject[] | ServerRequestExtConfigurationObjectWithRequest | ServerRequestExtConfigurationObjectWithRequest[]): void;
    strategy(name: string, schema: string, options?: any): void;
    startServer(): Promise<void>;
    logger(): winston.LoggerInstance;
}
