"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const rides_1 = __importDefault(require("./routes/rides"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin, credentials: true }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.get('/health', (_req, res) => res.json({ ok: true }));
    app.use('/api/auth', auth_1.default);
    app.use('/api/admin', admin_1.default);
    app.use('/api/rides', rides_1.default);
    // Basic error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        const status = err.status ?? 500;
        const message = err.message ?? 'Internal Server Error';
        res.status(status).json({ error: message });
    });
    return app;
}
