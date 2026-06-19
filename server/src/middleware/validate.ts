import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors';

type Part = 'body' | 'query' | 'params';

/**
 * Validates a request part against a Zod schema, replacing it with the parsed
 * (and typed) value. Invalid input is rejected before reaching the controller.
 */
export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      throw new BadRequestError('Validation failed', result.error.flatten().fieldErrors);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[part] = result.data;
    next();
  };
}
