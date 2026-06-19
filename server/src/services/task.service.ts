import { Task, TaskStatus, Priority } from '../models/task.model';
import { Project } from '../models/project.model';
import { ActivityLog } from '../models/activityLog.model';
import { NotFoundError } from '../utils/errors';

interface ListOptions {
  status?: TaskStatus;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export const taskService = {
  async listForProject(orgId: string, projectId: string, opts: ListOptions = {}) {
    // Confirm the project belongs to this tenant before listing its tasks.
    const project = await Project.findOne({ _id: projectId, orgId }).lean();
    if (!project) throw new NotFoundError('Project not found');

    const filter: Record<string, unknown> = { orgId, projectId };
    if (opts.status) filter.status = opts.status;
    if (opts.assigneeId) filter.assigneeId = opts.assigneeId;

    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));

    const [items, total] = await Promise.all([
      Task.find(filter)
        .sort({ status: 1, order: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async create(
    orgId: string,
    actorId: string,
    projectId: string,
    input: {
      title: string;
      description?: string;
      priority?: Priority;
      assigneeId?: string;
      dueDate?: Date;
    },
  ) {
    const project = await Project.findOne({ _id: projectId, orgId }).lean();
    if (!project) throw new NotFoundError('Project not found');

    const task = await Task.create({
      ...input,
      orgId,
      projectId,
      reporterId: actorId,
      status: 'backlog',
    });
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'task',
      entityId: task._id,
      action: 'created',
      metadata: { title: task.title },
    });
    return task.toObject();
  },

  async update(
    orgId: string,
    actorId: string,
    id: string,
    patch: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: Priority;
      assigneeId: string;
      dueDate: Date;
      order: number;
      labels: string[];
    }>,
  ) {
    const task = await Task.findOneAndUpdate({ _id: id, orgId }, patch, { new: true }).lean();
    if (!task) throw new NotFoundError('Task not found');
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'task',
      entityId: task._id,
      action: 'updated',
      metadata: patch,
    });
    return task;
  },

  async remove(orgId: string, actorId: string, id: string) {
    const task = await Task.findOneAndDelete({ _id: id, orgId }).lean();
    if (!task) throw new NotFoundError('Task not found');
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'task',
      entityId: task._id,
      action: 'deleted',
    });
  },
};
