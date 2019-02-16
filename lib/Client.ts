// IMPORTS
// ================================================================================================
import { Task, Logger, TraceSource, TraceCommand } from '@nova/azure-queue-dispatcher';
import { QueueService } from 'azure-storage';
import { DispatcherError } from './Error';

// CLASS DEFINITION
// ================================================================================================
export class DispatcherClient {

    private readonly client : QueueService;
    private readonly logger : Logger;
    private readonly source : TraceSource;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(client: QueueService, logger: Logger, source: TraceSource) {
        this.client = client;
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
        const options: QueueService.CreateMessageRequestOptions[] = [];
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
    private sendMessage(queue: string, messageText: string, options: QueueService.CreateMessageRequestOptions) {        
        const start = Date.now();

        const command: TraceCommand = {
            name    : `send message: ${queue}`,
            text    : `${messageText}`
        };

        return new Promise((resolve, reject) => {
            this.client.createMessage(queue, messageText, options, (error, response) => {
                this.logger.trace(this.source, command.name, Date.now() - start, !error);
                if (error) {
                    return reject(new DispatcherError(error, queue, command));
                }
                resolve();
            });
        });
    }
}