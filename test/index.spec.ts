import Hapi, {ServerExtEventsRequestObject, ServerRoute} from 'hapi';
import path from 'path';
import winston from 'winston';

import {Server} from '../src';
import {IServerApplicationState} from "../src/models/serverApplicationState";
import {IRequestApplicationState} from "../src/models/requestApplicationState";

const defaultSecret = '6ba6161c-62e9-4cd7-9f6e-c6f6bf88557d';

describe('Server initialization', () => {
    it('should throw exception if auth.secret is not provided', async () => {
        const config = {authEnabled: true};
        const server = new Server(config);

        await expect(server.configure()).rejects.toBeDefined();
    });

    it('should initialize with additionalOptions if provided', async () => {
        const mockHapiServer = jest.spyOn(Hapi, 'Server');
        try {
            const config = {
                cors: true,
                hapiServerOptions: {
                    routes: {
                        auth: 'test'
                    }
                }
            };

            const server = new Server(config);
            await server.configure();

            // console.log(server.server);

            expect(mockHapiServer)
                .toHaveBeenCalledWith(expect.objectContaining({
                    routes: expect.objectContaining({
                        cors: true,
                        auth: 'test'
                    })
                }));
        } finally {
            mockHapiServer.mockRestore();
        }
    });

    it('should start Hapi server when startServer called', async () => {
        const server = new Server();
        await server.configure();
        const mockHapiServerStart = jest.spyOn(server.server, 'start').mockImplementation();
        await server.startServer();
        expect(mockHapiServerStart).toHaveBeenCalled();
    });
});

describe('CORS handling', () => {
    it('should respond to options requests', async () => {
        const server = new Server();
        await server.configure();

        const options = {
            method: 'OPTIONS',
            url: '/',
            headers: {
                Origin: 'https://test.com'
            }
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
    });

    it('should respond to options requests when Origin header is not present', async () => {
        const server = new Server();
        await server.configure();

        const options = {
            method: 'OPTIONS',
            url: '/'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
    });

    it('should include access-control-allow-origin header when given origin to use', async () => {
        const config = {corsOrigins: ['https://test.com']};
        const server = new Server(config);
        await server.configure();

        const options = {
            method: 'OPTIONS',
            url: '/',
            headers: {
                Origin: 'https://test.com'
            }
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe('https://test.com');
    });

    it('should include access-control-allow-origin header when given * as the origin', async () => {
        const config = {corsOrigins: ['*']};
        const server = new Server(config);
        await server.configure();

        const options = {
            method: 'OPTIONS',
            url: '/',
            headers: {
                Origin: 'https://test.com'
            }
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe('https://test.com');
    });

    it('should NOT include access-control-allow-origin header when NOT given origin to use', async () => {
        const server = new Server();
        await server.configure();

        const options = {
            method: 'OPTIONS',
            url: '/',
            headers: {
                Origin: 'https://test.com'
            }
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('Server with default settings', () => {
    let server: Server<any, any>;

    beforeAll(async () => {
        const config = {authEnabled: true, authSecret: defaultSecret};
        server = new Server(config);
        await server.configure();
    });

    it('should export server', () => {
        expect(server).toBeDefined();
    });

    it('should expose server', () => {
        expect(server.server).toBeDefined();
    });

    it('should respond to get request on the root route with "hello"', async () => {
        const options = {
            method: 'GET',
            url: '/'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('hello');
    });

    it('should trace log', async () => {
        const options = {
            method: 'GET',
            url: '/'
        };

        const temp = server.server.app.traceLogger.debug;
        const mockDebug = jest.fn();
        server.server.app.traceLogger.debug = mockDebug;

        const response = await server.server.inject(options);

        server.server.app.traceLogger.debug = temp;

        expect(mockDebug.mock.calls.length).toBe(1);
        expect(response.payload).toBe('hello');
    });

    it('should allow registering an unauthenticated route', async () => {
        const route: ServerRoute<IServerApplicationState, IRequestApplicationState> = {
            method: 'GET',
            path: '/test',
            handler: (req, h) => {
                return 'test';
            },
            options: {
                auth: false
            }
        };

        server.server.route([route]);

        const options = {
            method: 'GET',
            url: '/test'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('test');
    });

    it('should allow registering routes from a directory', async () => {
        server.registerRoutesFromDirectory(path.resolve(__dirname, './routes'));

        let response = await server.server.inject({method: 'GET', url: '/extfile/test'});
        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('This is a test.');

        response = await server.server.inject({method: 'GET', url: '/extfile/test2'});
        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('This is another test.');

        response = await server.server.inject({method: 'GET', url: '/extfile/test3'});
        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('This is a third test.');

        response = await server.server.inject({method: 'GET', url: '/extfile/test4'});
        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('This is a fourth test.');
    });

    it('should allow registering an authenticated route', async () => {
        const route: ServerRoute<IServerApplicationState, IRequestApplicationState> = {
            method: 'GET',
            path: '/test2',
            handler: (req, h) => {
                return 'test';
            }
        };

        server.server.route([route]);

        const options = {
            method: 'GET',
            url: '/test2'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(401);
    });

    it('should have working JWT authentication', async () => {
        // tslint:disable-next-line:max-line-length
        const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MTY1NzM1NjksImF1ZCI6Ind3dy5leGFtcGxlLmNvbSIsInN1YiI6InRlc3RAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2hubnkiLCJTdXJuYW1lIjoiUm9ja2V0IiwiRW1haWwiOiJqcm9ja2V0QGV4YW1wbGUuY29tIiwiUm9sZSI6WyJNYW5hZ2VyIiwiUHJvamVjdCBBZG1pbmlzdHJhdG9yIl19.lsWF4m157J-sVRsa_WYdR7pVPLolEm1hfJHQaEClesw';

        const route: ServerRoute<IServerApplicationState, IRequestApplicationState> = {
            method: 'GET',
            path: '/test3',
            handler: (req, h) => {
                return 'test';
            }
        };

        server.server.route([route]);

        const options = {
            method: 'GET',
            url: '/test3',
            headers: {
                Authorization: jwt
            }
        };

        const response = await server.server.inject(options);
        expect(response.statusCode).toBe(200);

    });

    it('should allow registering a plugin', async () => {
        const register = async (innerServer: Hapi.Server<IServerApplicationState, IRequestApplicationState>) => {
            const route: ServerRoute<IServerApplicationState, IRequestApplicationState> = {
                method: 'GET',
                path: '/test',
                handler: (req, h) => {
                    return 'test';
                },
                options: {
                    auth: false
                }
            };

            innerServer.route([route]);
        };

        const plugin = {
            register, name: 'Test'
        };

        const pluginPackage = {
            plugin,
            options: {},
            routes: {
                prefix: '/api'
            }
        };

        await server.server.register(pluginPackage);

        const options = {
            method: 'GET',
            url: '/api/test'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('test');
    });

    it('should allow registering an extension', async () => {
        const route: ServerRoute<IServerApplicationState, IRequestApplicationState> = {
            method: 'GET',
            path: '/extension-test',
            handler: (req, h) => {
                return (req.app as any).testValue;
            },
            options: {
                auth: false
            }
        };

        server.server.route([route]);

        const extension: ServerExtEventsRequestObject<IServerApplicationState, IRequestApplicationState> = {
            type: 'onRequest',
            method: (request, h) => {
                (request.app as any).testValue = 'onPostAuthTest';
                return h.continue;
            }
        };

        await server.server.ext(extension);

        const options = {
            method: 'GET',
            url: '/extension-test'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('onPostAuthTest');
    });
});

describe('Server with default route disbaled', () => {
    let server: Server;

    beforeAll(async () => {
        const config = {defaultRoute: false, authSecret: defaultSecret};

        server = new Server(config);
        await server.configure();
    });

    it('should respond to get request on the root route with HTTP 404', async () => {
        const options = {
            method: 'GET',
            url: '/'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(404);
    });
});

describe('Server with default cors disbaled', () => {
    let server: Server;

    beforeAll(async () => {
        const config = {cors: false, authSecret: defaultSecret};

        server = new Server(config);
        await server.configure();
    });

    it('should respond to default options requests with 404', async () => {
        const options = {
            method: 'OPTIONS',
            url: '/'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(404);
    });
});

describe('Server logging', () => {
    it('Default logger should have two transports', async () => {
        const config = {cors: false, authSecret: defaultSecret};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.logger.transports).length).toBe(2);
    });

    it('Default trace logger should have one transport', async () => {
        const config = {cors: false, authSecret: defaultSecret};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.traceLogger.transports).length).toBe(1);
    });

    it('Default activity logger should have one transport', async () => {
        const config = {cors: false, authSecret: defaultSecret};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.activityLogger.transports).length).toBe(1);
    });

    it('Should be able to add additional transports to default logger', async () => {
        const config = {cors: false, authSecret: defaultSecret, logAddtionalLoggerTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-log.log',
                level: 'debug'
            })]};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.logger.transports).length).toBe(3);
    });

    it('Should be able to add additional transports to default trace logger', async () => {
        const config = {cors: false, authSecret: defaultSecret, logAddtionalTraceTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-trace.log',
                level: 'debug'
            })]};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.traceLogger.transports).length).toBe(2);
    });

    it('Should be able to add additional transports to default activity logger', async () => {
        const config = {cors: false, authSecret: defaultSecret, logAddtionalActivityTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-activity.log',
                level: 'debug'
            })]};

        const server = new Server(config);
        await server.configure();
        expect(Object.keys(server.app.activityLogger.transports).length).toBe(2);
    });

    it('Should throw appropriate error if default log has no transports', async () => {
        const config = {
            cors: false,
            authSecret: defaultSecret,
            logDefaultFileTransport: false,
            logDefaultConsoleTransport: false
        };

        try {
            const server = new Server(config);
        } catch (err) {
            expect(err.message).toBe('Default logger has no transports');
        }
    });

    it('Should throw appropriate error if trace log has no transports', async () => {
        const config = {cors: false, authSecret: defaultSecret, logDefaultTraceTransport: false};

        try {
            const server = new Server(config);
        } catch (err) {
            expect(err.message).toBe('Trace logger has no transports');
        }
    });

    it('Should throw appropriate error if activity log has no transports', async () => {
        const config = {cors: false, authSecret: defaultSecret, logDefaultActivityTransport: false};

        try {
            const server = new Server(config);
        } catch (err) {
            expect(err.message).toBe('Activity logger has no transports');
        }
    });

    it('Returns default logger', async () => {
        const config = {cors: false, authSecret: defaultSecret};
        const server = new Server(config);
        await server.configure();
        const logger = server.appLogger;
        expect(logger).not.toBe(null);
    });

    it('Returns default trace logger', async () => {
        const config = {cors: false, authSecret: defaultSecret};
        const server = new Server(config);
        await server.configure();
        const logger = server.appTraceLogger;
        expect(logger).not.toBe(null);
    });

    it('Returns default activity logger', async () => {
        const config = {cors: false, authSecret: defaultSecret};
        const server = new Server(config);
        await server.configure();
        const logger = server.appActivityLogger;
        expect(logger).not.toBe(null);
    });

    it('Should use the proper default log level', async () => {
        const config = {cors: false, authSecret: defaultSecret};
        const server = new Server(config);
        await server.configure();
        const logger = server.appLogger;
        expect(logger.transports[0].level).toBe('debug');
    });

    it('Should use the proper custom log level', async () => {
        const config = {cors: false, authSecret: defaultSecret, logLevel: 'warn'};
        const server = new Server(config);
        await server.configure();
        const logger = server.appLogger;
        expect(logger.transports[0].level).toBe('warn');
    });
});

describe('cache handling', () => {
    it('Should use cache override when provided', () => {
        const config = {cache: {engine: require('catbox-memory'), name: 'test'}};
        const server = new Server(config);

        expect((server.config.cache as any).name).toEqual('test');
    });

    it('Should default to catbox-memory when no cache is provided', () => {
        const server = new Server();

        expect((server.config.cache as any).name).toBe('memory');
    });
});
