import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OrganizationModel } from '../models/Organization';
import { UserModel } from '../models/User';
import { config } from '../config';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AuditLogModel } from '../models/AuditLog';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit: max 20 requests per 10 minutes per IP for auth endpoints
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(['/register', '/login'], authLimiter);

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    const msg = parse.error.issues.map((i) => i.message).join(', ') || 'Invalid input';
    return res.status(400).json({ error: msg });
  }
  const { email, fullName, password } = parse.data;
  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  if (!domain) return res.status(400).json({ error: 'Invalid email domain' });

  const existing = await UserModel.findOne({ email: emailLower });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  // Find or create organization based on domain
  let org = await OrganizationModel.findOne({ emailDomains: domain });
  if (!org) {
    org = await OrganizationModel.create({
      name: domain,
      emailDomains: [domain],
    });
  }

  const usersInOrgCount = await UserModel.countDocuments({ organizationId: org._id });
  const isBootstrapAdmin = usersInOrgCount === 0;
  const role = isBootstrapAdmin ? 'admin' : 'user';

  const shouldAutoApprove =
    isBootstrapAdmin ||
    (config.orgEmailDomain && config.orgEmailDomain === domain.toLowerCase());
  const status = shouldAutoApprove ? 'approved' : 'pending';

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    fullName,
    email: emailLower,
    passwordHash,
    role,
    status,
    organizationId: org._id,
  });

  await AuditLogModel.create({
    organizationId: user.organizationId,
    userId: user._id,
    action: 'auth.register',
    metadata: { domain, autoApproved: shouldAutoApprove, role },
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, organizationId: user.organizationId?.toString() },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return res.status(201).json({ token, user });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    const msg = parse.error.issues.map((i) => i.message).join(', ') || 'Invalid input';
    return res.status(400).json({ error: msg });
  }
  const { email, password } = parse.data;
  const emailLower = email.toLowerCase();
  const user = await UserModel.findOne({ email: emailLower });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status !== 'approved') return res.status(403).json({ error: 'Awaiting admin approval' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  await AuditLogModel.create({
    organizationId: user.organizationId,
    userId: user._id,
    action: 'auth.login',
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, organizationId: user.organizationId?.toString() },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return res.json({ token, user });
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;


