import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TaskUpdateSchema } from "@/lib/schemas";
import { ok, notFound, handleError, getUserId } from "@/lib/api-helpers";

// GET /api/tasks/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: { progress: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!task) return notFound("Task not found");
    return ok(task);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const { id } = await params;
    const body = await req.json();
    const data = TaskUpdateSchema.parse(body);

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return notFound("Task not found");

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        completedAt:
          data.status === "COMPLETED" && !existing.completedAt
            ? new Date()
            : data.completedAt
            ? new Date(data.completedAt)
            : existing.completedAt,
      },
    });

    return ok(task);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const { id } = await params;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return notFound("Task not found");

    await prisma.task.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
