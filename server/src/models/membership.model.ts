import { Schema, model, Document, Types } from 'mongoose';

export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export interface MembershipDoc extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  userId: Types.ObjectId;
  role: Role;
  status: 'active' | 'invited';
  invitedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<MembershipDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// A user can hold exactly one membership per org.
membershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export const Membership = model<MembershipDoc>('Membership', membershipSchema);
