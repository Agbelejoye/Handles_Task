import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { AlertUpdateSchema } from "@/lib/schemas";
import { ok, handleError, getUserId } from "@/lib/api-helpers";
import { generateAlerts } from "@/lib/alert-heuristics";

// GET /api/alerts – fetch active alerts (DB + generated heuristics)
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);

    const dbAlerts = await prisma.alert.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    // Generate heuristic alerts on the fly
    const tasks = await prisma.task.findMany({ where: { userId } });
    const activeSession = await prisma.focusSession.findFirst({
      where: { userId, status: "ACTIVE" },
    });
    const recentActivity = await prisma.activityLog.findMany({
      where: { userId, recordedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
    });

    const heuristic = generateAlerts(tasks, activeSession, recentActivity);

    // Save heuristic alerts that don't already exist
    const alertsToSave = heuristic.filter(
      (h) =>
        !dbAlerts.some(
          (d) =>
            d.type === h.type &&
            d.status === "ACTIVE" &&
            (!h.taskId || d.taskId === h.taskId)
        )
    );

    if (alertsToSave.length > 0) {
      await prisma.alert.createMany({
        data: alertsToSave.map((a) => ({
          userId,
          type: a.type,
          title: a.title,
          message: a.message,
          taskId: a.taskId ?? null,
        })),
      });
    }

    const allAlerts = await prisma.alert.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return ok(allAlerts);
  } catch (err) {
    return handleError(err);
  }
}
