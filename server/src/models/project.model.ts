import { Schema, model, Document, Types } from 'mongoose';

export interface ProjectDoc extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  createdBy: Types.ObjectId;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Tenant-leading indexes: every query is isolated AND fast.
projectSchema.index({ orgId: 1, key: 1 }, { unique: true });
projectSchema.index({ orgId: 1, archived: 1 });

export const Project = model<ProjectDoc>('Project', projectSchema);
