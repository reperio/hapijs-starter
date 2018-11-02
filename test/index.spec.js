const Hapi = require('hapi');
const Server = require('../lib/index');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const defaultSecret = '6ba6161c-62e9-4cd7-9f6e-c6f6bf88557d';

describe('Server initialization', () => {
    it('should throw exception if auth.secret is not provided', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, authEnabled:true});
        const server = new Server(config);

        await expect(server.startServer()).rejects.toBeDefined();
    });

    it('should initialize with additionalOptions if provided', async () => {
        const mockHapiServer = jest.spyOn(Hapi, 'Server')
            .mockImplementation(() => 'test server');
        try {

            const config = Object.assign({}, Server.defaults, {cors: true, additionalOptions: {routes: {additionalRouteOption1: 'testAdditionalRouteOptionValue1'}, additionalOption1: 'testAdditionalOptionValue1'}});
            const server = new Server(config);

            console.log(server.server);

            expect(mockHapiServer)
                .toHaveBeenCalledWith(expect.objectContaining({
                    additionalOption1: 'testAdditionalOptionValue1',
                    routes: expect.objectContaining({
                        cors: true,
                        additionalRouteOption1: 'testAdditionalRouteOptionValue1'
                    })
                }));
        } finally {
            mockHapiServer.mockRestore();
        }
    })
});

describe('CORS handling', () => {
    it('should respond to options requests', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true});
        let server = new Server(config);
        await server.startServer();

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
        const config = Object.assign({}, Server.defaults, {testMode: true});
        let server = new Server(config);
        await server.startServer();

        const options = {
            method: 'OPTIONS',
            url: '/'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
    });

    it('should include access-control-allow-origin header when given origin to use', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, corsOrigins: ['https://test.com']});
        let server = new Server(config);
        await server.startServer();

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
        const config = Object.assign({}, Server.defaults, {testMode: true, corsOrigins: ['*']});
        let server = new Server(config);
        await server.startServer();

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
        const config = Object.assign({}, Server.defaults, {testMode: true});
        let server = new Server(config);
        await server.startServer();

        const options = {
            method: 'OPTIONS',
            url: '/',
            headers: {
                Origin: 'https://test.com'
            }
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(undefined);
    });
})

describe('Server with default settings', () => {
    let server;

    beforeAll(async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, authEnabled: true, authSecret: defaultSecret});
        server = new Server(config);
        await server.startServer();
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
        const route = {
            method: 'GET',
            path: '/test',
            handler: (req, h) => {
                return 'test';
            },
            config: {
                auth: false
            }
        };

        server.registerAdditionalRoutes([route]);

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
        const route = {
            method: 'GET',
            path: '/test2',
            handler: (req, h) => {
                return 'test';
            }
        };

        server.registerAdditionalRoutes([route])

        const options = {
            method: 'GET',
            url: '/test2'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(401);
    });

    it('should have working JWT authentication', async () => {
        const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MTY1NzM1NjksImV4cCI6MTU0ODEwOTU2OSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoidGVzdEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.peUQ-SUbb_79fuCv_mq-9zs6jPG4577DSrGgsblwk6E'

        const route = {
            method: 'GET',
            path: '/test3',
            handler: (req, h) => {
                return 'test';
            }
        };

        server.registerAdditionalRoutes([route])

        const options = {
            method: 'GET',
            url: '/test3',
            headers: {
                Authorization: jwt
            }
        };

        const response = await server.server.inject(options);
        //console.log(response);
        expect(response.statusCode).toBe(200);
        
    });

    it('should allow registering a plugin', async() => {
        const register = async (server, options) => {
            const route = {
                method: 'GET',
                path: '/test',
                handler: (req, h) => {
                    return 'test';
                },
                config: {
                    auth: false
                }
            };

            server.route([route]);
        }

        const plugin = {
            register, name: 'Test',
        };

        const pluginPackage = {
            plugin: plugin,
            options: {},
            routes: {
                prefix: '/api'
            }
        };

        await server.registerAdditionalPlugin(pluginPackage);

        const options = {
            method: 'GET',
            url: '/api/test'
        };

        const response = await server.server.inject(options);

        expect(response.statusCode).toBe(200);
        expect(response.payload).toBe('test');
    });

    it('should allow registering an extension', async() => {
        const route = {
            method: 'GET',
            path: '/extension-test',
            handler: (req, h) => {
                return req.app.testValue;
            },
            config: {
                auth: false
            }
        };

        server.registerAdditionalRoutes([route]);

        const extension = {
            type: 'onRequest',
            method: (request, h) => {
                request.app.testValue = 'onPostAuthTest';
                return h.continue;
            }
        };

        await server.registerExtension(extension);

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
    let server;

    beforeAll(async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, defaultRoute: false, authSecret: defaultSecret});

        server = new Server(config);
        await server.startServer();
    })

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
    let server;

    beforeAll(async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});

        server = new Server(config);
        await server.startServer();
    })

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
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.logger.transports).length).toBe(2);
    });

    it('Default trace logger should have one transport', async ()=> {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.traceLogger.transports).length).toBe(1);
    });

    it('Default activity logger should have one transport', async ()=> {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.activityLogger.transports).length).toBe(1);
    });

    it('Should be able to add additional transports to default logger', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logAddtionalLoggerTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-log.log',
                level: 'debug'
            })]});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.logger.transports).length).toBe(3);
    });

    it('Should be able to add additional transports to default trace logger', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logAddtionalTraceTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-trace.log',
                level: 'debug'
            })]});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.traceLogger.transports).length).toBe(2);
    });

    it('Should be able to add additional transports to default activity logger', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logAddtionalActivityTransports: [
            new (winston.transports.File)({
                filename: './logs/extra-file-activity.log',
                level: 'debug'
            })]});

        const server = new Server(config);
        await server.startServer();
        expect(Object.keys(server.app.activityLogger.transports).length).toBe(2);
    });

    it('Should throw appropriate error if default log has no transports', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logDefaultFileTransport: false, logDefaultConsoleTransport: false});

        const server = new Server(config);
        try {
            await server.startServer();
        } catch (err) {
            expect(err.message).toBe('Default logger has no transports');
        }
    });

    it('Should throw appropriate error if trace log has no transports', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logDefaultTraceTransport: false});

        const server = new Server(config);
        try {
            await server.startServer();
        } catch (err) {
            expect(err.message).toBe('Trace logger has no transports');
        }
    });

    it('Should throw appropriate error if activity log has no transports', async () => {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret, logDefaultActivityTransport: false});

        const server = new Server(config);
        try {
            await server.startServer();
        } catch (err) {
            expect(err.message).toBe('Activity logger has no transports');
        }
    });

    it('Returns default logger', async ()=> {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});
        const server = new Server(config);
        await server.startServer();
        const logger = server.logger();
        expect(logger).not.toBe(null);
    });

    it('Returns default trace logger', async ()=> {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});
        const server = new Server(config);
        await server.startServer();
        const logger = server.traceLogger();
        expect(logger).not.toBe(null);
    });

    it('Returns default activity logger', async ()=> {
        const config = Object.assign({}, Server.defaults, {testMode: true, cors: false, authSecret: defaultSecret});
        const server = new Server(config);
        await server.startServer();
        const logger = server.activityLogger();
        expect(logger).not.toBe(null);
    });
});