import mongoose, { Schema, Types } from 'mongoose';

export interface AuditLog {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string; // e.g., auth.register, auth.login, ride.offer.create, ride.request.create, admin.user.approve, ride.match
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    metadata: { type: Object },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', AuditLogSchema);


