import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    organizationId?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      role: UserRole;
      organizationId?: string | Types.ObjectId;
    };
    req.user = {
      userId: String(payload.userId),
      role: payload.role,
      organizationId: payload.organizationId ? String(payload.organizationId) : undefined,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: UserRole) {
  return function roleMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}


