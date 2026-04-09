import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ActivityIngestBatchSchema } from "@/lib/schemas";
import { ok, handleError, getUserId } from "@/lib/api-helpers";

// GET /api/activity – recent activity for the current user
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50"),
      200
    );

    const activity = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: limit,
    });

    // Domain summary for insights
    const domainMap: Record<string, number> = {};
    for (const log of activity) {
      domainMap[log.domain] = (domainMap[log.domain] ?? 0) + log.durationSec;
    }
    const topDomains = Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, durationSec]) => ({ domain, durationSec }));

    return ok({ activity, topDomains });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/activity – ingest activity from browser extension
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { events } = ActivityIngestBatchSchema.parse(body);

    const data = events.map((e) => ({
      userId,
      domain: e.domain,
      url: e.url ?? null,
      title: e.title ?? null,
      durationSec: e.durationSec,
      taskId: e.taskId ?? null,
      recordedAt: e.recordedAt ? new Date(e.recordedAt) : new Date(),
    }));

    await prisma.activityLog.createMany({ data });

    return ok({ ingested: data.length });
  } catch (err) {
    return handleError(err);
  }
}
