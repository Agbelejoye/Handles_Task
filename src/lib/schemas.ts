/**
 * Shared Zod validation schemas for API routes
 */

import { z } from "zod";

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["DAILY", "ONE_TIME", "RECURRING"]).default("ONE_TIME"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  deadline: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  recurringDays: z.array(z.number().int().min(0).max(6)).default([]),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  completedAt: z.string().datetime().optional(),
});

export const TaskFilterSchema = z.object({
  filter: z.enum(["today", "all", "completed", "pending", "in_progress"]).default("all"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const FocusSessionCreateSchema = z.object({
  taskId: z.string().optional(),
  durationMin: z.number().int().min(1).max(120).default(25),
  breakMin: z.number().int().min(1).max(30).default(5),
});

export const ActivityIngestSchema = z.object({
  userId: z.string().optional(),
  domain: z.string().min(1).max(255),
  url: z.string().url().optional(),
  title: z.string().max(500).optional(),
  durationSec: z.number().int().min(0),
  taskId: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
});

export const ActivityIngestBatchSchema = z.object({
  events: z.array(ActivityIngestSchema).min(1).max(100),
});

export const AlertUpdateSchema = z.object({
  status: z.enum(["ACKNOWLEDGED", "RESCHEDULED", "DISMISSED"]),
  scheduledAt: z.string().datetime().optional(),
});

export const AIChatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

export const ProgressQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
