"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_queue_1 = require("@azure/storage-queue");
const errors_1 = require("./errors");
// CLASS DEFINITION
// ================================================================================================
class DispatcherClient {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(service, logger, source) {
        this.service = service;
        this.logger = logger;
        this.source = source;
        if (logger) {
            this.operationId = logger.operationId;
        }
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    async send(taskOrTasks) {
        if (!taskOrTasks)
            throw new TypeError('Cannot send task(s): task(s) are invalid');
        const tasks = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
        // validate tasks
        const messages = [];
        const options = [];
        for (let task of tasks) {
            if (typeof task.name !== 'string')
                throw new TypeError('Task name is invalid');
            if (task.ttl !== undefined) {
                if (typeof task.ttl !== 'number')
                    throw new TypeError('Task time-to-live is invalid');
            }
            if (task.delay !== undefined) {
                if (typeof task.delay !== 'number')
                    throw new TypeError('Task delay is invalid');
                if (task.ttl && task.ttl <= task.delay) {
                    const err = new Error('Task delay must be smaller than time-to-live');
                    throw new errors_1.DispatcherError(err, task.name);
                }
            }
            let message = { opid: this.operationId, payload: task.payload };
            messages.push(Buffer.from(JSON.stringify(message), 'utf8').toString('base64'));
            options.push({
                visibilityTimeout: task.delay,
                messageTimeToLive: task.ttl,
                requestId: this.operationId
            });
        }
        // dispatch messages
        const promises = [];
        for (let i = 0; i < tasks.length; i++) {
            promises.push(this.sendMessage(tasks[i].name, messages[i], options[i]));
        }
        await Promise.all(promises);
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    async sendMessage(queue, messageText, options) {
        const start = Date.now();
        const command = {
            name: `send message: ${queue}`,
            text: `${messageText}`
        };
        try {
            const queueUrl = storage_queue_1.QueueURL.fromServiceURL(this.service, queue);
            const messagesUrl = storage_queue_1.MessagesURL.fromQueueURL(queueUrl);
            const response = await messagesUrl.enqueue(storage_queue_1.Aborter.none, messageText, options);
            this.logger && this.logger.trace(this.source, command.name, Date.now() - start, true);
        }
        catch (error) {
            this.logger && this.logger.trace(this.source, command.name, Date.now() - start, false);
            throw new errors_1.DispatcherError(error, queue, command);
        }
    }
}
exports.DispatcherClient = DispatcherClient;
//# sourceMappingURL=Client.js.map