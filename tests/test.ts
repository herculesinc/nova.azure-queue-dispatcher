// IMPORTS
// ================================================================================================
import { Dispatcher } from '../index';
import { Task } from '@nova/azure-queue-dispatcher';

// MODULE VARIABLES
// ================================================================================================
const dispatcher = new Dispatcher({
    account     : '',
    accessKey   : ''
});

const task1: Task = {
    name    : 'test-queue1',
    payload : {
        test: 'testing'
    },
    ttl     : 20,   // seconds
    delay   : 10    // seconds
};

// TESTS
// ================================================================================================
(async function test() {

    const client = await dispatcher.getClient();
    await client.send(task1);

})();