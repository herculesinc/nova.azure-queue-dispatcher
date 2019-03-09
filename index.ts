// IMPORTS
// ================================================================================================
import * as nova from '@nova/core';
import { DispatcherConfig, DispatcherRetryPolicy, Logger, TraceSource } from '@nova/azure-queue-dispatcher';
import { SharedKeyCredential, StorageURL, ServiceURL, IRetryOptions } from '@azure/storage-queue';
import { DispatcherClient } from './lib/Client';

// RE-EXPORTS
// ================================================================================================
export { DispatcherError } from './lib/errors';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_TRY_DELAY = 4000;     // 4 seconds
const DEFAULT_MAX_TRIES = 4;

// declared here because storage queue SDK does not expose this
enum RetryPolicyType {
    EXPONENTIAL, FIXED
}

const DEFAULT_RETRY_OPTIONS: IRetryOptions = {
    retryPolicyType : RetryPolicyType.FIXED as any,
    maxTries        : DEFAULT_MAX_TRIES,
    retryDelayInMs  : DEFAULT_TRY_DELAY,
    tryTimeoutInMs  : DEFAULT_TRY_DELAY - 1000
}

// DISPATCHER CLASS
// ================================================================================================
export class Dispatcher {

    private readonly source : TraceSource;
    private readonly service: ServiceURL;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(config: DispatcherConfig) {
        if (!config) throw TypeError('Cannot create Dispatcher: config is undefined');
        
        // build credentials
        const credentials = new SharedKeyCredential(config.account, config.accessKey);
        const retryOptions = buildRetryOptions(config.retryPolicy);
        const pipeline = StorageURL.newPipeline(credentials, { retryOptions });

        // initialize class variables
        this.source = { name: config.name || 'dispatcher', type: 'azure queue' };
        this.service = new ServiceURL(`https://${config.account}.queue.core.windows.net`, pipeline);
    }

    getClient(logger?: Logger) {
        if (logger === undefined) {
            logger = nova.logger;
        }
        return new DispatcherClient(this.service, logger, this.source);
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function buildRetryOptions(config?: DispatcherRetryPolicy): IRetryOptions {
    if (!config) return DEFAULT_RETRY_OPTIONS;

    if (config.type !== 'linear') throw new TypeError('Retry policy type is invalid');
    // TODO: validate parameters
    const retryOptions: IRetryOptions = {
        retryPolicyType : RetryPolicyType.FIXED as any,
        maxTries        : config.retryCount || DEFAULT_MAX_TRIES,
        retryDelayInMs  : config.retryInterval  || DEFAULT_TRY_DELAY,
        tryTimeoutInMs  : (config.retryInterval || DEFAULT_TRY_DELAY) - 1000
    };
    return retryOptions;
}