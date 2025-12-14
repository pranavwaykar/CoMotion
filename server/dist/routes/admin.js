"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const RideOffer_1 = require("../models/RideOffer");
const RideRequest_1 = require("../models/RideRequest");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, (0, auth_1.requireRole)('admin'));
router.get('/users/pending', async (req, res) => {
    const users = await User_1.UserModel.find({ organizationId: req.user.organizationId, status: 'pending' }).sort({ createdAt: 1 });
    return res.json({ users });
});
router.post('/approve/:userId', async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.UserModel.findOneAndUpdate({ _id: userId, organizationId: req.user.organizationId }, { $set: { status: 'approved' } }, { new: true });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    // Optionally emit socket event for approvals
    const io = req.app.get('io');
    io?.to(String(req.user.organizationId)).emit('admin:userApproved', { userId });
    return res.json({ user });
});
router.get('/metrics/summary', async (req, res) => {
    const orgId = req.user.organizationId;
    const [totalUsers, approvedUsers, activeOffers, activeRequests] = await Promise.all([
        User_1.UserModel.countDocuments({ organizationId: orgId }),
        User_1.UserModel.countDocuments({ organizationId: orgId, status: 'approved' }),
        RideOffer_1.RideOfferModel.countDocuments({ organizationId: orgId, status: 'active' }),
        RideRequest_1.RideRequestModel.countDocuments({ organizationId: orgId, status: 'pending' }),
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
exports.default = router;
