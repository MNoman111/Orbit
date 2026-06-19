import { z } from 'zod';
import { TASK_STATUSES, PRIORITIES } from '../models/task.model';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
  orgName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
  key: z
    .string()
    .min(2)
    .max(6)
    .regex(/^[A-Za-z]+$/, 'Key must be letters only'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  archived: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  order: z.number().optional(),
  labels: z.array(z.string()).optional(),
});
