import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { FocusSessionCreateSchema } from "@/lib/schemas";
import { ok, created, notFound, handleError, getUserId } from "@/lib/api-helpers";

// GET /api/focus – get active session
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const session = await prisma.focusSession.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    });
    return ok(session);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/focus – start a new focus session
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const data = FocusSessionCreateSchema.parse(body);

    // Cancel any existing active sessions
    await prisma.focusSession.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED", endedAt: new Date() },
    });

    const session = await prisma.focusSession.create({
      data: { ...data, userId },
    });

    return created(session);
  } catch (err) {
    return handleError(err);
  }
}
