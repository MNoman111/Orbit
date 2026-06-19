import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { registerSchema, loginSchema } from '../validators/schemas';

const router = Router();
const REFRESH_COOKIE = 'orbit_rt';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: authService.isProd,
    sameSite: 'lax',
    maxAge: authService.refreshCookieMaxAge,
    path: '/api/v1/auth',
  });
}

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken, ...rest } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ data: rest });
  }),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken, ...rest } = await authService.login(req.body.email, req.body.password);
    setRefreshCookie(res, refreshToken);
    res.json({ data: rest });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken, ...rest } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    setRefreshCookie(res, refreshToken);
    res.json({ data: rest });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.status(204).end();
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await authService.me(req.userId!) });
  }),
);

export default router;
