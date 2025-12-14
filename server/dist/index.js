"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const config_1 = require("./config");
async function main() {
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: { origin: config_1.config.corsOrigin },
    });
    // Expose io to routes via app locals
    app.set('io', io);
    io.on('connection', (socket) => {
        // Optionally, authenticate sockets later
        socket.on('disconnect', () => {
            // no-op
        });
    });
    await mongoose_1.default.connect(config_1.config.mongoUrl);
    server.listen(config_1.config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on http://localhost:${config_1.config.port}`);
    });
    const shutdown = async () => {
        // eslint-disable-next-line no-console
        console.log('Shutting down server...');
        await mongoose_1.default.disconnect();
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
