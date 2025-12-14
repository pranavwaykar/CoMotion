"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = {
            userId: String(payload.userId),
            role: payload.role,
            organizationId: payload.organizationId ? String(payload.organizationId) : undefined,
        };
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(role) {
    return function roleMiddleware(req, res, next) {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role !== role)
            return res.status(403).json({ error: 'Forbidden' });
        return next();
    };
}
