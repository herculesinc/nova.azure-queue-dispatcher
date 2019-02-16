"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Error_1 = require("./Error");
// CLASS DEFINITION
// ================================================================================================
class DispatcherClient {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(client, logger, source) {
        this.client = client;
        this.logger = logger;
        this.source = source;
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
                    throw new Error_1.DispatcherError(err, task.name);
                }
            }
            messages.push(JSON.stringify(task.payload));
            options.push({
                visibilityTimeout: task.delay,
                messageTimeToLive: task.ttl
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
    sendMessage(queue, messageText, options) {
        const start = Date.now();
        const command = {
            name: `send message: ${queue}`,
            text: `${messageText}`
        };
        return new Promise((resolve, reject) => {
            this.client.createMessage(queue, messageText, options, (error, response) => {
                this.logger.trace(this.source, command.name, Date.now() - start, !error);
                if (error) {
                    return reject(new Error_1.DispatcherError(error, queue, command));
                }
                resolve();
            });
        });
    }
}
exports.DispatcherClient = DispatcherClient;
//# sourceMappingURL=Client.js.map