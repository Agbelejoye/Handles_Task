import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, notFound, handleError, getUserId } from "@/lib/api-helpers";
import { z } from "zod";

const StopSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]).default("COMPLETED"),
});

// PATCH /api/focus/[id] – stop/complete a focus session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    const { id } = await params;
    const body = await req.json();
    const { status } = StopSchema.parse(body);

    const session = await prisma.focusSession.findFirst({
      where: { id, userId },
    });
    if (!session) return notFound("Focus session not found");

    const updated = await prisma.focusSession.update({
      where: { id },
      data: { status, endedAt: new Date() },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
