const Server = require('../lib/index').default;

async function start() {
    const server = new Server();
    try {
        await server.initialize();
        await server.startServer();
    } catch (err) {
        console.log(err);
    }
}

start();