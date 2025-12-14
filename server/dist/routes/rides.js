"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const RideOffer_1 = require("../models/RideOffer");
const RideRequest_1 = require("../models/RideRequest");
const time_1 = require("../utils/time");
const geo_1 = require("../utils/geo");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const geoPointSchema = zod_1.z.object({
    lng: zod_1.z.number().min(-180).max(180),
    lat: zod_1.z.number().min(-90).max(90),
});
const periodEnum = zod_1.z.enum(['morning', 'evening']);
const offerSchema = zod_1.z.object({
    seatsTotal: zod_1.z.number().int().min(1).max(6),
    period: periodEnum,
    timeWindowStart: zod_1.z.string().datetime(),
    timeWindowEnd: zod_1.z.string().datetime(),
    from: geoPointSchema,
    to: geoPointSchema,
});
router.post('/offers', async (req, res) => {
    const parse = offerSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { seatsTotal, period, timeWindowStart, timeWindowEnd, from, to } = parse.data;
    const start = new Date(timeWindowStart);
    const end = new Date(timeWindowEnd);
    if (!(0, time_1.isWithinRushHours)(start, period) || !(0, time_1.isWithinRushHours)(end, period)) {
        return res.status(400).json({ error: 'Time window must be within rush hours' });
    }
    if (start >= end)
        return res.status(400).json({ error: 'Invalid time window' });
    const offer = await RideOffer_1.RideOfferModel.create({
        driverId: req.user.userId,
        organizationId: req.user.organizationId,
        seatsTotal,
        seatsAvailable: seatsTotal,
        period,
        timeWindowStart: start,
        timeWindowEnd: end,
        fromPoint: { type: 'Point', coordinates: [from.lng, from.lat] },
        toPoint: { type: 'Point', coordinates: [to.lng, to.lat] },
        passengerIds: [],
        status: 'active',
    });
    // Broadcast new offer to org
    const io = req.app.get('io');
    if (req.user.organizationId) {
        io?.to(String(req.user.organizationId)).emit('ride:offer:new', { offerId: offer._id });
    }
    return res.status(201).json({ offer });
});
const requestSchema = zod_1.z.object({
    period: periodEnum,
    timeWindowStart: zod_1.z.string().datetime(),
    timeWindowEnd: zod_1.z.string().datetime(),
    from: geoPointSchema,
    to: geoPointSchema,
});
router.post('/requests', async (req, res) => {
    const parse = requestSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { period, timeWindowStart, timeWindowEnd, from, to } = parse.data;
    const start = new Date(timeWindowStart);
    const end = new Date(timeWindowEnd);
    if (!(0, time_1.isWithinRushHours)(start, period) || !(0, time_1.isWithinRushHours)(end, period)) {
        return res.status(400).json({ error: 'Time window must be within rush hours' });
    }
    if (start >= end)
        return res.status(400).json({ error: 'Invalid time window' });
    const request = await RideRequest_1.RideRequestModel.create({
        passengerId: req.user.userId,
        organizationId: req.user.organizationId,
        period,
        timeWindowStart: start,
        timeWindowEnd: end,
        fromPoint: { type: 'Point', coordinates: [from.lng, from.lat] },
        toPoint: { type: 'Point', coordinates: [to.lng, to.lat] },
        status: 'pending',
    });
    const io = req.app.get('io');
    if (req.user.organizationId) {
        io?.to(String(req.user.organizationId)).emit('ride:request:new', { requestId: request._id });
    }
    return res.status(201).json({ request });
});
const matchSchema = zod_1.z.object({
    period: periodEnum,
    timeWindowStart: zod_1.z.string().datetime(),
    timeWindowEnd: zod_1.z.string().datetime(),
    from: geoPointSchema,
    to: geoPointSchema,
});
router.post('/match', async (req, res) => {
    const parse = matchSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { period, timeWindowStart, timeWindowEnd, from, to } = parse.data;
    const start = new Date(timeWindowStart);
    const end = new Date(timeWindowEnd);
    // Step 1: candidates by org, status, period, time overlap and available seats
    const candidates = await RideOffer_1.RideOfferModel.find({
        organizationId: req.user.organizationId,
        status: 'active',
        period,
        seatsAvailable: { $gt: 0 },
        timeWindowStart: { $lte: end },
        timeWindowEnd: { $gte: start },
    }).lean();
    // Step 2: geospatial proximity filter (simple heuristic)
    const MAX_START_KM = 3.0;
    const MAX_END_KM = 3.0;
    const fromCoords = [from.lng, from.lat];
    const toCoords = [to.lng, to.lat];
    const matches = candidates
        .map((c) => {
        const startDist = (0, geo_1.haversineDistanceKm)(c.fromPoint.coordinates, fromCoords);
        const endDist = (0, geo_1.haversineDistanceKm)(c.toPoint.coordinates, toCoords);
        const timeScore = (0, time_1.timeWindowsOverlap)(c.timeWindowStart, c.timeWindowEnd, start, end) ? 1 : 0;
        const detourScore = Math.max(0, 1 - (startDist + endDist) / (MAX_START_KM + MAX_END_KM));
        const score = timeScore * 0.6 + detourScore * 0.4;
        return { offer: c, startDistKm: startDist, endDistKm: endDist, score };
    })
        .filter((m) => m.startDistKm <= MAX_START_KM && m.endDistKm <= MAX_END_KM)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    return res.json({ matches });
});
const joinSchema = zod_1.z.object({
    requestId: zod_1.z.string(),
    offerId: zod_1.z.string(),
});
router.post('/join', async (req, res) => {
    const parse = joinSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { requestId, offerId } = parse.data;
    const requestDoc = await RideRequest_1.RideRequestModel.findOne({
        _id: requestId,
        passengerId: req.user.userId,
        organizationId: req.user.organizationId,
        status: 'pending',
    });
    if (!requestDoc)
        return res.status(404).json({ error: 'Request not found or not pending' });
    const offerDoc = await RideOffer_1.RideOfferModel.findOne({
        _id: offerId,
        organizationId: req.user.organizationId,
        status: 'active',
    });
    if (!offerDoc)
        return res.status(404).json({ error: 'Offer not found' });
    if (offerDoc.seatsAvailable <= 0)
        return res.status(400).json({ error: 'No seats available' });
    // Update offer and request atomically
    offerDoc.passengerIds.push(requestDoc.passengerId);
    offerDoc.seatsAvailable = Math.max(0, offerDoc.seatsAvailable - 1);
    await offerDoc.save();
    requestDoc.status = 'matched';
    requestDoc.matchedOfferId = offerDoc._id;
    await requestDoc.save();
    const io = req.app.get('io');
    if (req.user.organizationId) {
        io?.to(String(req.user.organizationId)).emit('ride:match', {
            requestId: requestDoc._id,
            offerId: offerDoc._id,
            driverId: offerDoc.driverId,
            passengerId: requestDoc.passengerId,
        });
    }
    return res.json({ request: requestDoc, offer: offerDoc });
});
exports.default = router;
