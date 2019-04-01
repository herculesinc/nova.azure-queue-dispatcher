"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const nova = require("@nova/core");
const storage_queue_1 = require("@azure/storage-queue");
const Client_1 = require("./lib/Client");
// RE-EXPORTS
// ================================================================================================
var errors_1 = require("./lib/errors");
exports.DispatcherError = errors_1.DispatcherError;
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_TRY_DELAY = 4000; // 4 seconds
const DEFAULT_MAX_TRIES = 4;
// declared here because storage queue SDK does not expose this
var RetryPolicyType;
(function (RetryPolicyType) {
    RetryPolicyType[RetryPolicyType["EXPONENTIAL"] = 0] = "EXPONENTIAL";
    RetryPolicyType[RetryPolicyType["FIXED"] = 1] = "FIXED";
})(RetryPolicyType || (RetryPolicyType = {}));
const DEFAULT_RETRY_OPTIONS = {
    retryPolicyType: RetryPolicyType.FIXED,
    maxTries: DEFAULT_MAX_TRIES,
    retryDelayInMs: DEFAULT_TRY_DELAY,
    tryTimeoutInMs: DEFAULT_TRY_DELAY - 1000
};
// DISPATCHER CLASS
// ================================================================================================
class Dispatcher {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(config) {
        if (!config)
            throw TypeError('Cannot create Dispatcher: config is undefined');
        // build credentials
        const credentials = new storage_queue_1.SharedKeyCredential(config.account, config.accessKey);
        const retryOptions = buildRetryOptions(config.retryPolicy);
        const pipeline = storage_queue_1.StorageURL.newPipeline(credentials, { retryOptions });
        // initialize class variables
        this.source = { name: config.name || 'dispatcher', type: 'azure queue' };
        this.service = new storage_queue_1.ServiceURL(`https://${config.account}.queue.core.windows.net`, pipeline);
    }
    getClient(operationId, logger) {
        if (operationId !== undefined) {
            if (typeof operationId !== 'string')
                throw new TypeError('Operation ID is invalid');
        }
        if (logger === undefined) {
            logger = nova.logger;
        }
        else if (logger === null) {
            logger = undefined;
        }
        return new Client_1.DispatcherClient(this.service, this.source, operationId, logger);
    }
}
exports.Dispatcher = Dispatcher;
// HELPER FUNCTIONS
// ================================================================================================
function buildRetryOptions(config) {
    if (!config)
        return DEFAULT_RETRY_OPTIONS;
    if (config.type !== 'linear')
        throw new TypeError('Retry policy type is invalid');
    // TODO: validate parameters
    const retryOptions = {
        retryPolicyType: RetryPolicyType.FIXED,
        maxTries: config.retryCount || DEFAULT_MAX_TRIES,
        retryDelayInMs: config.retryInterval || DEFAULT_TRY_DELAY,
        tryTimeoutInMs: (config.retryInterval || DEFAULT_TRY_DELAY) - 1000
    };
    return retryOptions;
}
//# sourceMappingURL=index.js.map