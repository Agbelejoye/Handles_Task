import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { AlertUpdateSchema } from "@/lib/schemas";
import { ok, notFound, handleError, getUserId } from "@/lib/api-helpers";

// PATCH /api/alerts/[id] – acknowledge, reschedule, or dismiss an alert
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const { id } = await params;
    const body = await req.json();
    const { status, scheduledAt } = AlertUpdateSchema.parse(body);

    const alert = await prisma.alert.findFirst({ where: { id, userId } });
    if (!alert) return notFound("Alert not found");

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status,
        acknowledgedAt: status === "ACKNOWLEDGED" ? new Date() : alert.acknowledgedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : alert.scheduledAt,
      },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
