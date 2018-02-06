/// <reference types="winston" />
import * as winston from 'winston';
import ServerOptions from './serverOptions';
import 'ts-node/register';
import { RouteConfiguration, ServerStartExtConfigurationObject, ServerRequestExtConfigurationObjectWithRequest } from 'hapi';
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
    startServer(): Promise<void>;
    logger(): winston.LoggerInstance;
}
