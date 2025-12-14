"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function readEnv(name, defaultValue) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required env var ${name}`);
    }
    return value;
}
function readEnvNumber(name, defaultValue) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required env var ${name}`);
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
        throw new Error(`Env var ${name} must be a number`);
    }
    return parsed;
}
exports.config = {
    port: readEnvNumber('PORT', 4000),
    mongoUrl: readEnv('MONGODB_URL', 'mongodb://localhost:27017/commute'),
    jwtSecret: readEnv('JWT_SECRET', 'changeme'),
    corsOrigin: readEnv('CORS_ORIGIN', 'http://localhost:5173'),
    orgEmailDomain: process.env.ORG_EMAIL_DOMAIN?.toLowerCase(),
    mapProvider: readEnv('MAP_PROVIDER', 'mapbox'),
    mapboxToken: process.env.MAPBOX_TOKEN ?? '',
};
