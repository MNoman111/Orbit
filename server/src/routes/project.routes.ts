import { Router, Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
} from '../validators/schemas';
import { TaskStatus } from '../models/task.model';

const router = Router();

// Every project route is authenticated AND tenant-scoped.
router.use(authenticate, resolveTenant);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await projectService.list(req.orgId!, req.query.archived === 'true');
    res.json({ data });
  }),
);

router.post(
  '/',
  requireRole('member'),
  validate(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await projectService.create(req.orgId!, req.userId!, req.body);
    res.status(201).json({ data });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await projectService.getById(req.orgId!, req.params.id) });
  }),
);

router.patch(
  '/:id',
  requireRole('member'),
  validate(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await projectService.update(req.orgId!, req.userId!, req.params.id, req.body);
    res.json({ data });
  }),
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    await projectService.remove(req.orgId!, req.userId!, req.params.id);
    res.status(204).end();
  }),
);

// Tasks nested under a project.
router.get(
  '/:id/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await taskService.listForProject(req.orgId!, req.params.id, {
      status: req.query.status as TaskStatus | undefined,
      assigneeId: req.query.assigneeId as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data: items, meta });
  }),
);

router.post(
  '/:id/tasks',
  requireRole('member'),
  validate(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await taskService.create(req.orgId!, req.userId!, req.params.id, req.body);
    res.status(201).json({ data });
  }),
);

export default router;
