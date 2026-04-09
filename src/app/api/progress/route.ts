import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ProgressQuerySchema } from "@/lib/schemas";
import { ok, handleError, getUserId } from "@/lib/api-helpers";
import { calculateDailyCompletionPct, calculateCategoryProgress } from "@/lib/task-logic";

// GET /api/progress – daily completion & category breakdown
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { date } = ProgressQuerySchema.parse(params);

    const targetDate = date ? new Date(date) : new Date();

    const tasks = await prisma.task.findMany({ where: { userId } });

    const dailyPct = calculateDailyCompletionPct(tasks, targetDate);
    const categoryProgress = calculateCategoryProgress(tasks);

    // 7-day streak
    const streak = await computeStreak(userId);

    return ok({ dailyPct, categoryProgress, streak, date: targetDate.toISOString().split("T")[0] });
  } catch (err) {
    return handleError(err);
  }
}

async function computeStreak(userId: string): Promise<number> {
  // Count consecutive days with at least one completed task
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const count = await prisma.task.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (count === 0) break;
    streak++;
  }

  return streak;
}
