import { Schema, model, Document, Types } from 'mongoose';

export interface OrganizationDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  plan: 'free' | 'pro';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<OrganizationDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Organization = model<OrganizationDoc>('Organization', organizationSchema);
