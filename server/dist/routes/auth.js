"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Organization_1 = require("../models/Organization");
const User_1 = require("../models/User");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
router.post('/register', async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: parse.error.flatten() });
    }
    const { email, fullName, password } = parse.data;
    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];
    if (!domain)
        return res.status(400).json({ error: 'Invalid email domain' });
    const existing = await User_1.UserModel.findOne({ email: emailLower });
    if (existing)
        return res.status(409).json({ error: 'Email already registered' });
    // Find or create organization based on domain
    let org = await Organization_1.OrganizationModel.findOne({ emailDomains: domain });
    if (!org) {
        org = await Organization_1.OrganizationModel.create({
            name: domain,
            emailDomains: [domain],
        });
    }
    const usersInOrgCount = await User_1.UserModel.countDocuments({ organizationId: org._id });
    const isBootstrapAdmin = usersInOrgCount === 0;
    const role = isBootstrapAdmin ? 'admin' : 'user';
    const shouldAutoApprove = isBootstrapAdmin ||
        (config_1.config.orgEmailDomain && config_1.config.orgEmailDomain === domain.toLowerCase());
    const status = shouldAutoApprove ? 'approved' : 'pending';
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.UserModel.create({
        fullName,
        email: emailLower,
        passwordHash,
        role,
        status,
        organizationId: org._id,
    });
    const token = jsonwebtoken_1.default.sign({ userId: user._id.toString(), role: user.role, organizationId: user.organizationId?.toString() }, config_1.config.jwtSecret, { expiresIn: '7d' });
    return res.status(201).json({ token, user });
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
router.post('/login', async (req, res) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: parse.error.flatten() });
    }
    const { email, password } = parse.data;
    const emailLower = email.toLowerCase();
    const user = await User_1.UserModel.findOne({ email: emailLower });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'approved')
        return res.status(403).json({ error: 'Awaiting admin approval' });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ userId: user._id.toString(), role: user.role, organizationId: user.organizationId?.toString() }, config_1.config.jwtSecret, { expiresIn: '7d' });
    return res.json({ token, user });
});
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const user = await User_1.UserModel.findById(req.user.userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
});
exports.default = router;
