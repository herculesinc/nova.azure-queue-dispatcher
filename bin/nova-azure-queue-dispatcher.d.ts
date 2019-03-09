declare module "@nova/azure-queue-dispatcher" {
    
    // IMPORTS AND RE-EXPORTS
    // --------------------------------------------------------------------------------------------
    import { Logger, Exception, Task } from '@nova/core';
    export { Task, Logger, TraceSource, TraceCommand } from '@nova/core';

    // DISPATCHER
    // --------------------------------------------------------------------------------------------
    export interface DispatcherConfig {
		name?           : string;
        account         : string;
        accessKey       : string;
        retryPolicy?    : DispatcherRetryPolicy;
    }

    export interface DispatcherRetryPolicy {
        type            : 'linear',
        retryCount      : number;
        retryInterval   : number;
    }
    
    export class Dispatcher {

        constructor(config: DispatcherConfig);

        getClient(logger?: Logger | null): DispatcherClient;
    }

    export interface DispatcherClient {
        send(tasks: Task | Task[]) : Promise<any>;
    }

    export class DispatcherError extends Exception {
        constructor(cause: Error, message: string);
    }
}