[![Coverage Status](https://coveralls.io/repos/github/reperio/hapijs-starter/badge.svg?branch=master)](https://coveralls.io/github/reperio/hapijs-starter?branch=master) [![Build Status](https://travis-ci.org/reperio/hapijs-starter.svg?branch=master)](https://travis-ci.org/reperio/hapijs-starter) [![npm version](https://badge.fury.io/js/hapijs-starter.svg)](https://badge.fury.io/js/hapijs-starter)
# hapijs-starter

## Configuration Options

Runs a fully-configured HAPI server with Winston logging.

## Setup

All you need to do to run the server is to call it in an async method when your application starts.

```
import {Server} from 'hapijs-starter';
import * as path from 'path';

async function startServer() : Promise<void> {
    const server = new Server({});
    await server.initialize();
    await server.registerRoutesFromDirectory(path.resolve(__dirname, './api'));
    await server.startServer(false);
}

startServer();
```

| Property  | Type  | Default Value  | Details |
|---|---|---|---|
| host  | string  | '0.0.0.0'  | HapiJS host binding  |
| port  | number  | 3000  | HapiJS port binding  |
| cors  | boolean  | true  | Adds a global route for HTTP OPTIONS requests that responds with options headers to allow CORS requests  |
| statusMonitor  | boolean  | true  | Adds the hapijs-status-monitor plugin that exposes a /status route to get basic server status information  |
| defaultRoute  | boolean  | true  | Adds a default route that responds with 'hello' to be used for heartbeat requests from reverse proxies  |
| logDirectory  | string  | ./logs  | directory to store file based logs  |
| logLevel  | string  | 'debug'  | log level for winston logging  |
| logJson  | boolean  | true  | should the logs be in JSON format?  |
| logDefaultFileTransport  | boolean  | true  | Add the default file transport to the logger  |
| logDefaultConsoleTransport  | boolean  | true  | Add the default console transport to the logger  |
| logDefaultTraceTransport  | boolean  | true  | Add the default trace transport to the logger  |
| logAddtionalLoggerTransports  | Array<any>  | []  | Additional transports to add to the app logger  |
| logAddtionalTraceTranceports  | Array<any>  | []  | Additional transports to add to the trace logger  |
| logAutoTraceLogging  | boolean  | true  | Automatically log http requests to the trace log  |
| authEnabled  | boolean  | false  | Enable JWT authentication  |
| authSecret  | string  | null  | JWT secret used to validate JWTs. Required if authEnabled === true  |
| authValidateFunc  | (decoded: any, request: any, callback: any) => any;  | (decoded, request, callback) = { return { isValid: true };}  | Additional validation function based on hapi-auth-jwt2 validation function  |
