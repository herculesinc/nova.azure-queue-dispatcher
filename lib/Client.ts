// IMPORTS
// ================================================================================================
import { Task, Logger, TraceSource, TraceCommand } from '@nova/azure-queue-dispatcher';
import { Aborter, ServiceURL, QueueURL, MessagesURL, Models } from '@azure/storage-queue';
import { DispatcherError } from './errors';

// CLASS DEFINITION
// ================================================================================================
export class DispatcherClient {

    private readonly service    : ServiceURL;
    private readonly source     : TraceSource;
    private readonly logger?    : Logger;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(service: ServiceURL, logger: Logger, source: TraceSource) {
        this.service = service;
        this.logger = logger;
        this.source = source;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    async send(taskOrTasks: Task | Task[]) {
        if (!taskOrTasks) throw new TypeError('Cannot send task(s): task(s) are invalid');
        const tasks = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];

        // validate tasks
        const messages: string[] = [];
        const options: Models.MessagesEnqueueOptionalParams[] = [];
        for (let task of tasks) {
            if (typeof task.name !== 'string') throw new TypeError('Task name is invalid');
            if (task.ttl !== undefined) {
                if (typeof task.ttl !== 'number') throw new TypeError('Task time-to-live is invalid');
            }
            if (task.delay !== undefined) {
                if (typeof task.delay !== 'number') throw new TypeError('Task delay is invalid');
                if (task.ttl && task.ttl <= task.delay) {
                    const err = new Error('Task delay must be smaller than time-to-live');
                    throw new DispatcherError(err, task.name);
                }
            }
            
            messages.push(JSON.stringify(task.payload));
            options.push({
                visibilityTimeout: task.delay,
                messageTimeToLive: task.ttl
            });
        }
        
        // dispatch messages
        const promises: Promise<any>[] = [];
        for (let i = 0; i < tasks.length; i++) {
            promises.push(this.sendMessage(tasks[i].name, messages[i], options[i]));
        }
        await Promise.all(promises);
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private async sendMessage(queue: string, messageText: string, options: Models.MessagesEnqueueOptionalParams) {
        const start = Date.now();

        const command: TraceCommand = {
            name    : `send message: ${queue}`,
            text    : `${messageText}`
        };

        try {
            const queueUrl = QueueURL.fromServiceURL(this.service, queue);
            const messagesUrl = MessagesURL.fromQueueURL(queueUrl);
            const response = await messagesUrl.enqueue(Aborter.none, messageText, options);
            this.logger && this.logger.trace(this.source, command.name, Date.now() - start, true);
        }
        catch (error) {
            this.logger && this.logger.trace(this.source, command.name, Date.now() - start, false);
            throw new DispatcherError(error, queue, command);
        }
    }
}