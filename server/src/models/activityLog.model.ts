import { Schema, model, Document, Types } from 'mongoose';

export interface ActivityLogDoc extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  actorId: Types.ObjectId;
  entityType: string;
  entityId: Types.ObjectId;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLogDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ orgId: 1, entityType: 1, entityId: 1, createdAt: -1 });

// Append-only audit trail.
export const ActivityLog = model<ActivityLogDoc>('ActivityLog', activityLogSchema);
