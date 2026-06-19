import { Schema, model, Document, Types } from 'mongoose';

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// Users are GLOBAL — not tenant-scoped — so a single account can belong to
// many organizations (see Membership).
export const User = model<UserDoc>('User', userSchema);
