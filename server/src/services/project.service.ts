import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { ActivityLog } from '../models/activityLog.model';
import { NotFoundError } from '../utils/errors';

/**
 * Every method takes `orgId` as its first argument and threads it into every
 * query. This is the discipline that enforces tenant isolation: a project
 * service call can only ever touch one org's data.
 */
export const projectService = {
  async list(orgId: string, includeArchived = false) {
    const filter: Record<string, unknown> = { orgId };
    if (!includeArchived) filter.archived = false;
    return Project.find(filter).sort({ createdAt: -1 }).lean();
  },

  async getById(orgId: string, id: string) {
    const project = await Project.findOne({ _id: id, orgId }).lean();
    if (!project) throw new NotFoundError('Project not found');
    return project;
  },

  async create(
    orgId: string,
    actorId: string,
    input: { name: string; key: string; description?: string },
  ) {
    const project = await Project.create({ ...input, orgId, createdBy: actorId });
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'project',
      entityId: project._id,
      action: 'created',
      metadata: { name: project.name },
    });
    return project.toObject();
  },

  async update(
    orgId: string,
    actorId: string,
    id: string,
    patch: Partial<{ name: string; description: string; archived: boolean }>,
  ) {
    const project = await Project.findOneAndUpdate({ _id: id, orgId }, patch, { new: true }).lean();
    if (!project) throw new NotFoundError('Project not found');
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'project',
      entityId: project._id,
      action: 'updated',
      metadata: patch,
    });
    return project;
  },

  async remove(orgId: string, actorId: string, id: string) {
    const project = await Project.findOneAndDelete({ _id: id, orgId }).lean();
    if (!project) throw new NotFoundError('Project not found');
    await Task.deleteMany({ orgId, projectId: id });
    await ActivityLog.create({
      orgId,
      actorId,
      entityType: 'project',
      entityId: project._id,
      action: 'deleted',
    });
  },
};
