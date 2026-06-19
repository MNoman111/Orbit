import { Schema, model, Document, Types } from 'mongoose';

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface TaskDoc extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  dueDate?: Date;
  order: number;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: TASK_STATUSES, default: 'backlog' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
    labels: { type: [String], default: [] },
  },
  { timestamps: true },
);

taskSchema.index({ orgId: 1, projectId: 1, status: 1, order: 1 });

export const Task = model<TaskDoc>('Task', taskSchema);
