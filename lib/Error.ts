// IMPORTS
// ================================================================================================
import { Exception, TraceCommand } from '@nova/core';

// CLASS DEFINITION
// ================================================================================================
export class DispatcherError extends Exception {
    constructor(cause: Error, queue: string, command?: TraceCommand) {
        super({ cause, message: `Failed to send a message into ${queue} queue` });
        if (command) {
            this.details = {
                command : command.text
            };
        }
    }
}