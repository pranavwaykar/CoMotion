import mongoose, { Schema, Types } from 'mongoose';
import { CommutePeriod, GeoPoint } from './RideOffer';

export type RideRequestStatus = 'pending' | 'matched' | 'cancelled' | 'completed';

export interface RideRequest {
  _id: Types.ObjectId;
  passengerId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  period: CommutePeriod;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  fromPoint: GeoPoint;
  toPoint: GeoPoint;
  status: RideRequestStatus;
  matchedOfferId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GeoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const RideRequestSchema = new Schema<RideRequest>(
  {
    passengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    period: { type: String, enum: ['morning', 'evening'], required: true, index: true },
    timeWindowStart: { type: Date, required: true, index: true },
    timeWindowEnd: { type: Date, required: true, index: true },
    fromPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    toPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    status: { type: String, enum: ['pending', 'matched', 'cancelled', 'completed'], required: true, default: 'pending', index: true },
    matchedOfferId: { type: Schema.Types.ObjectId, ref: 'RideOffer' },
  },
  { timestamps: true }
);

export const RideRequestModel = mongoose.model<RideRequest>('RideRequest', RideRequestSchema);


