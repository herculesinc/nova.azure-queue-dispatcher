"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const nova = require("@nova/core");
const azure_storage_1 = require("azure-storage");
const Client_1 = require("./lib/Client");
// RE-EXPORTS
// ================================================================================================
var Error_1 = require("./lib/Error");
exports.DispatcherError = Error_1.DispatcherError;
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_REQUEST_TIMEOUT = 3000; // 3 seconds
// DISPATCHER CLASS
// ================================================================================================
class Dispatcher {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(config) {
        if (!config)
            throw TypeError('Cannot create Dispatcher: config is undefined');
        // determine request timeout
        const requestTimeout = config.requestTimeout || DEFAULT_REQUEST_TIMEOUT;
        // create retry policy
        let retryPolicy;
        if (!config.retryPolicy) {
            retryPolicy = new azure_storage_1.LinearRetryPolicyFilter();
        }
        else {
            if (config.retryPolicy.type !== 'linear')
                throw new TypeError('Retry policy type is invalid');
            retryPolicy = new azure_storage_1.LinearRetryPolicyFilter(config.retryPolicy.retryCount, config.retryPolicy.retryInterval);
        }
        // initialize class variables
        this.source = { name: config.name || 'dispatcher', type: 'azure queue' };
        this.client = azure_storage_1.createQueueService(config.account, config.accessKey).withFilter(retryPolicy);
        this.client.defaultClientRequestTimeoutInMs = requestTimeout;
    }
    getClient(logger) {
        return new Client_1.DispatcherClient(this.client, logger || nova.logger, this.source);
    }
}
exports.Dispatcher = Dispatcher;
//# sourceMappingURL=index.js.map