import ServerOptions from './serverOptions';
import { RouteConfiguration, ServerStartExtConfigurationObject } from 'hapi';
export default class Server {
    static defaults: ServerOptions;
    server: any;
    config: ServerOptions;
    constructor(options: ServerOptions);
    initialize(): Promise<void>;
    registerAdditionalRoutes(routes: Array<RouteConfiguration>): void;
    registerAdditionalPlugin(plugin: any): Promise<any>;
    registerExtension(extension: ServerStartExtConfigurationObject): void;
    startServer(isTestMode?: boolean): Promise<void>;
}
