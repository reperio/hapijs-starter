import ServerOptions from './serverOptions';
import { RouteConfiguration, ServerStartExtConfigurationObject, ServerRequestExtConfigurationObjectWithRequest } from 'hapi';
export default class Server {
    static defaults: ServerOptions;
    server: any;
    config: ServerOptions;
    app: any;
    constructor(options?: ServerOptions);
    registerAdditionalRoutes(routes: Array<RouteConfiguration>): void;
    registerAdditionalPlugin(plugin: any): Promise<any>;
    registerExtension(param1: ServerStartExtConfigurationObject | ServerStartExtConfigurationObject[] | ServerRequestExtConfigurationObjectWithRequest | ServerRequestExtConfigurationObjectWithRequest[]): void;
    startServer(): Promise<void>;
}
