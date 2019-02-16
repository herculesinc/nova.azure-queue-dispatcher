// IMPORTS
// ================================================================================================
import * as nova from '@nova/core';
import { DispatcherConfig, Logger, TraceSource } from '@nova/azure-queue-dispatcher';
import { QueueService, createQueueService, LinearRetryPolicyFilter } from 'azure-storage';
import { DispatcherClient } from './lib/Client';

// RE-EXPORTS
// ================================================================================================
export { DispatcherError } from './lib/Error';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_REQUEST_TIMEOUT = 3000;   // 3 seconds

// DISPATCHER CLASS
// ================================================================================================
export class Dispatcher {

    private readonly source : TraceSource;
    private readonly client : QueueService;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(config: DispatcherConfig) {
        if (!config) throw TypeError('Cannot create Dispatcher: config is undefined');
        
        // determine request timeout
        const requestTimeout = config.requestTimeout || DEFAULT_REQUEST_TIMEOUT;

        // create retry policy
        let retryPolicy: LinearRetryPolicyFilter;
        if (!config.retryPolicy) {
            retryPolicy = new LinearRetryPolicyFilter();
        }
        else {
            if (config.retryPolicy.type !== 'linear') throw new TypeError('Retry policy type is invalid');
            retryPolicy = new LinearRetryPolicyFilter(config.retryPolicy.retryCount, config.retryPolicy.retryInterval);
        }

        // initialize class variables
        this.source = { name: config.name || 'dispatcher', type: 'azure queue' };
        this.client = createQueueService(config.account, config.accessKey).withFilter(retryPolicy);
        this.client.defaultClientRequestTimeoutInMs = requestTimeout;
    }

    getClient(logger?: Logger) {
        return new DispatcherClient(this.client, logger || nova.logger, this.source);
    }
}