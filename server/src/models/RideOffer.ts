import mongoose, { Schema, Types } from 'mongoose';

export type CommutePeriod = 'morning' | 'evening';
export type RideOfferStatus = 'active' | 'closed';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface RideOffer {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  seatsTotal: number;
  seatsAvailable: number;
  period: CommutePeriod;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  fromPoint: GeoPoint;
  toPoint: GeoPoint;
  passengerIds: Types.ObjectId[];
  status: RideOfferStatus;
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

const RideOfferSchema = new Schema<RideOffer>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    seatsTotal: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['morning', 'evening'], required: true, index: true },
    timeWindowStart: { type: Date, required: true, index: true },
    timeWindowEnd: { type: Date, required: true, index: true },
    fromPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    toPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    passengerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'closed'], required: true, default: 'active', index: true },
  },
  { timestamps: true }
);

export const RideOfferModel = mongoose.model<RideOffer>('RideOffer', RideOfferSchema);


