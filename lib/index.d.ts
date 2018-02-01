import ServerOptions from './serverOptions';
import { RouteConfiguration } from 'hapi';
export default class Server {
    static defaults: ServerOptions;
    server: any;
    config: ServerOptions;
    constructor(options: ServerOptions);
    initialize(): Promise<void>;
    registerAdditionalRoutes(routes: Array<RouteConfiguration>): void;
    registerAdditionalPlugin(plugin: any): Promise<any>;
    startServer(isTestMode?: boolean): Promise<void>;
}
