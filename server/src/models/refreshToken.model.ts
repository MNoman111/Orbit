import { Schema, model, Document, Types } from 'mongoose';

/**
 * Persisted refresh-token records so tokens can be ROTATED and REVOKED
 * (logout, suspected compromise). In production this belongs in Redis with a
 * TTL; Mongo is used here to keep the scaffold runnable with a single
 * datastore. The `tokenId` is what the JWT carries — the raw token is never
 * stored.
 */
export interface RefreshTokenDoc extends Document {
  _id: Types.ObjectId;
  tokenId: string;
  userId: Types.ObjectId;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    tokenId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL index — expired records are reaped automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);
