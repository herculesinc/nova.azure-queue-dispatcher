"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const core_1 = require("@nova/core");
// CLASS DEFINITION
// ================================================================================================
class DispatcherError extends core_1.Exception {
    constructor(cause, queue, command) {
        super({ cause, message: `Failed to send a message into ${queue} queue` });
        if (command) {
            this.details = {
                command: command.text
            };
        }
    }
}
exports.DispatcherError = DispatcherError;
//# sourceMappingURL=errors.js.map