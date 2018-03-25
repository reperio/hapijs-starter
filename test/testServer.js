const Server = require('../lib/index').Server;

async function start() {
    const server = new Server();
    try {
        await server.startServer();
    } catch (err) {
        console.log(err);
    }
}

start();