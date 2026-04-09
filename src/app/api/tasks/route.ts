import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TaskCreateSchema, TaskFilterSchema } from "@/lib/schemas";
import { ok, created, handleError, getUserId } from "@/lib/api-helpers";
import { filterTodayTasks, sortTasksByPriority } from "@/lib/task-logic";

// GET /api/tasks – list tasks with optional filters
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { filter, priority, tag, page, limit } = TaskFilterSchema.parse(params);

    const where: Record<string, unknown> = { userId };

    if (priority) where.priority = priority;
    if (tag) where.tags = { has: tag };

    if (filter === "completed") where.status = "COMPLETED";
    else if (filter === "pending") where.status = "PENDING";
    else if (filter === "in_progress") where.status = "IN_PROGRESS";

    let tasks = await prisma.task.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    if (filter === "today") {
      tasks = filterTodayTasks(tasks);
    }

    const sorted = sortTasksByPriority(tasks);
    const total = await prisma.task.count({ where });

    return ok({ tasks: sorted, total, page, limit });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/tasks – create a task
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const data = TaskCreateSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        ...data,
        userId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });

    return created(task);
  } catch (err) {
    return handleError(err);
  }
}
