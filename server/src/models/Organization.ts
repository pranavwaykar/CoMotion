import mongoose, { Schema, Types } from 'mongoose';

export interface Organization {
  _id: Types.ObjectId;
  name: string;
  emailDomains: string[]; // lowercase domains, e.g., "example.com"
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<Organization>(
  {
    name: { type: String, required: true },
    emailDomains: { type: [String], required: true, index: true },
  },
  { timestamps: true }
);

export const OrganizationModel = mongoose.model<Organization>('Organization', OrganizationSchema);


