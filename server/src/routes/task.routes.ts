import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { updateTaskSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate, resolveTenant);

router.patch(
  '/:id',
  requireRole('member'),
  validate(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await taskService.update(req.orgId!, req.userId!, req.params.id, req.body);
    res.json({ data });
  }),
);

router.delete(
  '/:id',
  requireRole('member'),
  asyncHandler(async (req: Request, res: Response) => {
    await taskService.remove(req.orgId!, req.userId!, req.params.id);
    res.status(204).end();
  }),
);

export default router;
