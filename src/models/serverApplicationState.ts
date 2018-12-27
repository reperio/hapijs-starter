import {Logger} from 'winston';

export interface IServerApplicationState {
    logger: Logger;
    traceLogger: Logger;
    activityLogger: Logger;
}
