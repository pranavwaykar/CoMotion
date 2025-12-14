import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { RideOfferModel } from '../models/RideOffer';
import { RideRequestModel } from '../models/RideRequest';
import { timeWindowsOverlap, isWithinRushHours } from '../utils/time';
import { haversineDistanceKm } from '../utils/geo';
import { AuditLogModel } from '../models/AuditLog';

const router = Router();
router.use(requireAuth);

// List my offers
router.get('/offers/mine', async (req: AuthenticatedRequest, res) => {
  const offers = await RideOfferModel.find({ driverId: req.user!.userId }).sort({ createdAt: -1 });
  return res.json({ offers });
});

// Close an offer
router.post('/offers/:id/close', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const offer = await RideOfferModel.findOneAndUpdate(
    { _id: id, driverId: req.user!.userId, status: 'active' },
    { $set: { status: 'closed', seatsAvailable: 0 } },
    { new: true }
  );
  if (!offer) return res.status(404).json({ error: 'Offer not found or already closed' });
  return res.json({ offer });
});

// List my requests
router.get('/requests/mine', async (req: AuthenticatedRequest, res) => {
  const requests = await RideRequestModel.find({ passengerId: req.user!.userId }).sort({ createdAt: -1 });
  return res.json({ requests });
});

// Cancel a request
router.post('/requests/:id/cancel', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const request = await RideRequestModel.findOneAndUpdate(
    { _id: id, passengerId: req.user!.userId, status: { $in: ['pending', 'matched'] } },
    { $set: { status: 'cancelled' } },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: 'Request not found or not cancellable' });
  return res.json({ request });
});

const geoPointSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

const periodEnum = z.enum(['morning', 'evening']);

const offerSchema = z.object({
  seatsTotal: z.number().int().min(1).max(6),
  period: periodEnum,
  timeWindowStart: z.string().datetime(),
  timeWindowEnd: z.string().datetime(),
  from: geoPointSchema,
  to: geoPointSchema,
});

router.post('/offers', async (req: AuthenticatedRequest, res) => {
  const parse = offerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { seatsTotal, period, timeWindowStart, timeWindowEnd, from, to } = parse.data;

  const start = new Date(timeWindowStart);
  const end = new Date(timeWindowEnd);
  if (!isWithinRushHours(start, period) || !isWithinRushHours(end, period)) {
    return res.status(400).json({ error: 'Time window must be within rush hours' });
  }
  if (start >= end) return res.status(400).json({ error: 'Invalid time window' });

  const offer = await RideOfferModel.create({
    driverId: req.user!.userId,
    organizationId: req.user!.organizationId,
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

  await AuditLogModel.create({
    organizationId: req.user!.organizationId as any,
    userId: req.user!.userId as any,
    action: 'ride.offer.create',
    metadata: { offerId: offer._id, period },
  });

  // Broadcast new offer to org
  const io = req.app.get('io');
  if (req.user!.organizationId) {
    io?.to(String(req.user!.organizationId)).emit('ride:offer:new', { offerId: offer._id });
  }

  return res.status(201).json({ offer });
});

const requestSchema = z.object({
  period: periodEnum,
  timeWindowStart: z.string().datetime(),
  timeWindowEnd: z.string().datetime(),
  from: geoPointSchema,
  to: geoPointSchema,
});

router.post('/requests', async (req: AuthenticatedRequest, res) => {
  const parse = requestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { period, timeWindowStart, timeWindowEnd, from, to } = parse.data;
  const start = new Date(timeWindowStart);
  const end = new Date(timeWindowEnd);
  if (!isWithinRushHours(start, period) || !isWithinRushHours(end, period)) {
    return res.status(400).json({ error: 'Time window must be within rush hours' });
  }
  if (start >= end) return res.status(400).json({ error: 'Invalid time window' });

  const request = await RideRequestModel.create({
    passengerId: req.user!.userId,
    organizationId: req.user!.organizationId,
    period,
    timeWindowStart: start,
    timeWindowEnd: end,
    fromPoint: { type: 'Point', coordinates: [from.lng, from.lat] },
    toPoint: { type: 'Point', coordinates: [to.lng, to.lat] },
    status: 'pending',
  });

  await AuditLogModel.create({
    organizationId: req.user!.organizationId as any,
    userId: req.user!.userId as any,
    action: 'ride.request.create',
    metadata: { requestId: request._id, period },
  });

  const io = req.app.get('io');
  if (req.user!.organizationId) {
    io?.to(String(req.user!.organizationId)).emit('ride:request:new', { requestId: request._id });
  }

  return res.status(201).json({ request });
});

const matchSchema = z.object({
  period: periodEnum,
  timeWindowStart: z.string().datetime(),
  timeWindowEnd: z.string().datetime(),
  from: geoPointSchema,
  to: geoPointSchema,
});

router.post('/match', async (req: AuthenticatedRequest, res) => {
  const parse = matchSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { period, timeWindowStart, timeWindowEnd, from, to } = parse.data;
  const start = new Date(timeWindowStart);
  const end = new Date(timeWindowEnd);

  // Step 1: candidates by org, status, period, time overlap and available seats
  const candidates = await RideOfferModel.find({
    organizationId: req.user!.organizationId,
    status: 'active',
    period,
    seatsAvailable: { $gt: 0 },
    timeWindowStart: { $lte: end },
    timeWindowEnd: { $gte: start },
  }).lean();

  // Step 2: geospatial proximity filter (simple heuristic)
  const MAX_START_KM = 3.0;
  const MAX_END_KM = 3.0;
  const fromCoords: [number, number] = [from.lng, from.lat];
  const toCoords: [number, number] = [to.lng, to.lat];

  const matches = candidates
    .map((c) => {
      const startDist = haversineDistanceKm(c.fromPoint.coordinates, fromCoords);
      const endDist = haversineDistanceKm(c.toPoint.coordinates, toCoords);
      const timeScore = timeWindowsOverlap(c.timeWindowStart, c.timeWindowEnd, start, end) ? 1 : 0;
      const detourScore = Math.max(0, 1 - (startDist + endDist) / (MAX_START_KM + MAX_END_KM));
      const score = timeScore * 0.6 + detourScore * 0.4;
      return { offer: c, startDistKm: startDist, endDistKm: endDist, score };
    })
    .filter((m) => m.startDistKm <= MAX_START_KM && m.endDistKm <= MAX_END_KM)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return res.json({ matches });
});

const joinSchema = z.object({
  requestId: z.string(),
  offerId: z.string(),
});

router.post('/join', async (req: AuthenticatedRequest, res) => {
  const parse = joinSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { requestId, offerId } = parse.data;

  const requestDoc = await RideRequestModel.findOne({
    _id: requestId,
    passengerId: req.user!.userId,
    organizationId: req.user!.organizationId,
    status: 'pending',
  });
  if (!requestDoc) return res.status(404).json({ error: 'Request not found or not pending' });

  const offerDoc = await RideOfferModel.findOne({
    _id: offerId,
    organizationId: req.user!.organizationId,
    status: 'active',
  });
  if (!offerDoc) return res.status(404).json({ error: 'Offer not found' });
  if (offerDoc.seatsAvailable <= 0) return res.status(400).json({ error: 'No seats available' });

  // Update offer and request atomically
  offerDoc.passengerIds.push(requestDoc.passengerId);
  offerDoc.seatsAvailable = Math.max(0, offerDoc.seatsAvailable - 1);
  await offerDoc.save();

  requestDoc.status = 'matched';
  requestDoc.matchedOfferId = offerDoc._id;
  await requestDoc.save();

  await AuditLogModel.create({
    organizationId: req.user!.organizationId as any,
    userId: req.user!.userId as any,
    action: 'ride.match',
    metadata: { requestId: requestDoc._id, offerId: offerDoc._id },
  });

  const io = req.app.get('io');
  if (req.user!.organizationId) {
    io?.to(String(req.user!.organizationId)).emit('ride:match', {
      requestId: requestDoc._id,
      offerId: offerDoc._id,
      driverId: offerDoc.driverId,
      passengerId: requestDoc.passengerId,
    });
  }

  return res.json({ request: requestDoc, offer: offerDoc });
});

export default router;


