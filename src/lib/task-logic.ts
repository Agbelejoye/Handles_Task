/**
 * Task prioritization and business logic
 * These are tested in __tests__/lib/task-logic.test.ts
 */

import type { Task, Priority, TaskStatus } from "@prisma/client";

export type TaskWithScore = Task & { priorityScore: number };

/**
 * Calculates a numeric priority score for sorting tasks.
 * Higher score = higher priority (should appear first).
 */
export function calculatePriorityScore(task: Task): number {
  const priorityWeights: Record<Priority, number> = {
    HIGH: 100,
    MEDIUM: 50,
    LOW: 10,
  };

  let score = priorityWeights[task.priority] ?? 50;

  // Deadline urgency bonus
  if (task.deadline) {
    const hoursUntilDeadline =
      (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) {
      score += 200; // overdue
    } else if (hoursUntilDeadline <= 2) {
      score += 150; // due very soon
    } else if (hoursUntilDeadline <= 24) {
      score += 80; // due today
    } else if (hoursUntilDeadline <= 72) {
      score += 30; // due in 3 days
    }
  }

  return score;
}

/**
 * Sorts tasks by priority score descending.
 */
export function sortTasksByPriority(tasks: Task[]): TaskWithScore[] {
  return tasks
    .map((t) => ({ ...t, priorityScore: calculatePriorityScore(t) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Calculates the daily completion percentage.
 */
export function calculateDailyCompletionPct(
  tasks: Task[],
  targetDate: Date = new Date()
): number {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const todayTasks = tasks.filter((t) => {
    if (t.type === "DAILY") return true;
    if (t.deadline) {
      const d = new Date(t.deadline);
      return d >= startOfDay && d <= endOfDay;
    }
    return false;
  });

  if (todayTasks.length === 0) return 0;

  const completed = todayTasks.filter((t) => t.status === "COMPLETED").length;
  return Math.round((completed / todayTasks.length) * 100);
}

/**
 * Groups tasks by tag and returns completion % per group.
 */
export function calculateCategoryProgress(
  tasks: Task[]
): Record<string, { total: number; completed: number; pct: number }> {
  const groups: Record<string, { total: number; completed: number }> = {};

  for (const task of tasks) {
    const tags = task.tags.length > 0 ? task.tags : ["uncategorized"];
    for (const tag of tags) {
      if (!groups[tag]) groups[tag] = { total: 0, completed: 0 };
      groups[tag].total++;
      if (task.status === "COMPLETED") groups[tag].completed++;
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([tag, { total, completed }]) => [
      tag,
      { total, completed, pct: Math.round((completed / total) * 100) },
    ])
  );
}

/**
 * Filters tasks for "today" view.
 */
export function filterTodayTasks(tasks: Task[]): Task[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayDayOfWeek = now.getDay();

  return tasks.filter((t) => {
    if (t.status === "CANCELLED") return false;
    if (t.type === "DAILY") return true;
    if (t.type === "RECURRING") {
      return t.recurringDays.includes(todayDayOfWeek);
    }
    if (t.deadline) {
      const d = new Date(t.deadline);
      return d >= todayStart && d <= todayEnd;
    }
    // include pending/in-progress tasks created today
    const created = new Date(t.createdAt);
    return created >= todayStart && created <= todayEnd;
  });
}

/**
 * Determines if a break alert should be triggered.
 * Returns true if the user has been in focus for >= alertAfterMin minutes.
 */
export function shouldSuggestBreak(
  sessionStartedAt: Date,
  alertAfterMin = 25
): boolean {
  const elapsedMin = (Date.now() - sessionStartedAt.getTime()) / (1000 * 60);
  return elapsedMin >= alertAfterMin;
}

/**
 * Determines if a sleep reminder should be shown.
 * Shows when local hour >= 23 or < 2 and user has pending tasks.
 */
export function shouldShowSleepReminder(
  hasPendingTasks: boolean,
  date: Date = new Date()
): boolean {
  const hour = date.getHours();
  const isLateNight = hour >= 23 || hour < 2;
  return isLateNight && hasPendingTasks;
}

/**
 * Formats minutes to a human-readable string.
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Returns priority badge color classes */
export function priorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    HIGH: "text-red-400 bg-red-400/10",
    MEDIUM: "text-yellow-400 bg-yellow-400/10",
    LOW: "text-green-400 bg-green-400/10",
  };
  return map[priority] ?? "text-white/40 bg-white/5";
}

/** Returns status badge color classes */
export function statusColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    PENDING: "text-gray-400 bg-gray-400/10",
    IN_PROGRESS: "text-blue-400 bg-blue-400/10",
    COMPLETED: "text-green-400 bg-green-400/10",
    CANCELLED: "text-red-400/60 bg-red-400/5",
  };
  return map[status] ?? "text-white/40 bg-white/5";
}
