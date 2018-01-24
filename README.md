# hapijs-starter

#Configuration Options

| Property  | Type  | Default Value  | Details |
|---|---|---|---|
| host  | string  | '0.0.0.0'  |   |
| port  | number  | 3000  |   |
| cors  | boolean  | true  |   |
| statusMonitor  | boolean  | true  |   |
| defaultRoute  | boolean  | true  |   |
| logDirectory  | string  | ./logs  |   |
| logLevel  | string  | 'debug'  |   |
| logJson  | boolean  | true  |   |
| logDefaultFileTransport  | boolean  | true  |   |
| logDefaultConsoleTransport  | boolean  | true  |   |
| logDefaultTraceTransport  | boolean  | true  |   |
| logAddtionalLoggerTransports  | Array<any>  | []  |   |
| logAddtionalTraceTranceports  | Array<any>  | []  |   |
| logAutoTraceLogging  | boolean  | true  |   |
| authEnabled  | boolean  | true  |   |
| authSecret  | string  | null  |   |
| authValidateFunc  | (decoded: any, request: any, callback: any) => any;  | (decoded, request, callback) = { return { isValid: true };}  |   |
