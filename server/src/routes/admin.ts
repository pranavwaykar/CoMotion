import { Router } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { RideOfferModel } from '../models/RideOffer';
import { RideRequestModel } from '../models/RideRequest';
import { AuditLogModel } from '../models/AuditLog';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users/pending', async (req: AuthenticatedRequest, res) => {
  const users = await UserModel.find({ organizationId: req.user!.organizationId, status: 'pending' }).sort({ createdAt: 1 });
  return res.json({ users });
});

router.post('/approve/:userId', async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, organizationId: req.user!.organizationId },
    { $set: { status: 'approved' } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Optionally emit socket event for approvals
  const io = req.app.get('io');
  io?.to(String(req.user!.organizationId)).emit('admin:userApproved', { userId });

  await AuditLogModel.create({
    organizationId: user.organizationId,
    userId: req.user!.userId as any,
    action: 'admin.user.approve',
    metadata: { approvedUserId: user._id },
  });

  return res.json({ user });
});

router.get('/metrics/summary', async (req: AuthenticatedRequest, res) => {
  const orgId = req.user!.organizationId;
  const [totalUsers, approvedUsers, activeOffers, activeRequests] = await Promise.all([
    UserModel.countDocuments({ organizationId: orgId }),
    UserModel.countDocuments({ organizationId: orgId, status: 'approved' }),
    RideOfferModel.countDocuments({ organizationId: orgId, status: 'active' }),
    RideRequestModel.countDocuments({ organizationId: orgId, status: 'pending' }),
  ]);

  const adoptionRate = totalUsers === 0 ? 0 : Math.round((approvedUsers / totalUsers) * 100);

  // Simple proxy metrics for PM dashboard; refine later
  return res.json({
    totalUsers,
    approvedUsers,
    adoptionRate,
    activeOffers,
    activeRequests,
    co2ReductionKg: Math.round(activeOffers * 3.5), // rough placeholder
    peakUsage: { morning: 0, evening: 0 }, // to be filled with time-bucketed data later
  });
});

router.get('/audit', async (req: AuthenticatedRequest, res) => {
  const orgId = req.user!.organizationId;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const logs = await AuditLogModel.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(limit);
  return res.json({ logs });
});

export default router;


