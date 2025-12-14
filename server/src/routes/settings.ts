import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { AuditLogModel } from '../models/AuditLog';

const router = Router();
router.use(requireAuth);

router.get('/places', async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!.userId).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    home: user.homePoint?.coordinates ? { lng: user.homePoint.coordinates[0], lat: user.homePoint.coordinates[1] } : null,
    office: user.officePoint?.coordinates ? { lng: user.officePoint.coordinates[0], lat: user.officePoint.coordinates[1] } : null,
  });
});

const pointSchema = z.object({ lng: z.number().min(-180).max(180), lat: z.number().min(-90).max(90) });
const payloadSchema = z.object({ home: pointSchema.nullish(), office: pointSchema.nullish() });

router.post('/places', async (req: AuthenticatedRequest, res) => {
  const parse = payloadSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { home, office } = parse.data;
  const update: any = {};
  if (home) update.homePoint = { type: 'Point', coordinates: [home.lng, home.lat] };
  if (office) update.officePoint = { type: 'Point', coordinates: [office.lng, office.lat] };
  const user = await UserModel.findOneAndUpdate({ _id: req.user!.userId }, { $set: update }, { new: true });
  await AuditLogModel.create({
    organizationId: user?.organizationId,
    userId: user?._id,
    action: 'settings.places.update',
    metadata: { hasHome: !!home, hasOffice: !!office },
  });
  return res.json({ ok: true });
});

export default router;


