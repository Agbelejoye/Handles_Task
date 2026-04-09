/**
 * Unit tests for task-logic.ts
 */

import {
  calculatePriorityScore,
  sortTasksByPriority,
  calculateDailyCompletionPct,
  calculateCategoryProgress,
  filterTodayTasks,
  shouldSuggestBreak,
  shouldShowSleepReminder,
  formatMinutes,
} from "../../src/lib/task-logic";
import type { Task } from "@prisma/client";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t1",
  userId: "u1",
  title: "Test task",
  description: null,
  type: "ONE_TIME",
  priority: "MEDIUM",
  status: "PENDING",
  tags: [],
  deadline: null,
  estimatedMinutes: null,
  recurringDays: [],
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ── calculatePriorityScore ────────────────────────────────────────────────────

describe("calculatePriorityScore", () => {
  it("returns higher score for HIGH priority", () => {
    const high = makeTask({ priority: "HIGH" });
    const low = makeTask({ priority: "LOW" });
    expect(calculatePriorityScore(high)).toBeGreaterThan(calculatePriorityScore(low));
  });

  it("adds overdue bonus for past deadlines", () => {
    const overdue = makeTask({
      priority: "LOW",
      deadline: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
    });
    const noDue = makeTask({ priority: "LOW" });
    expect(calculatePriorityScore(overdue)).toBeGreaterThan(calculatePriorityScore(noDue));
  });

  it("adds urgency bonus for tasks due today", () => {
    const dueToday = makeTask({
      priority: "MEDIUM",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3h from now
    });
    const dueLater = makeTask({
      priority: "MEDIUM",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 48), // 2 days
    });
    expect(calculatePriorityScore(dueToday)).toBeGreaterThan(calculatePriorityScore(dueLater));
  });
});

// ── sortTasksByPriority ───────────────────────────────────────────────────────

describe("sortTasksByPriority", () => {
  it("sorts high priority first", () => {
    const tasks = [
      makeTask({ id: "t1", priority: "LOW" }),
      makeTask({ id: "t2", priority: "HIGH" }),
      makeTask({ id: "t3", priority: "MEDIUM" }),
    ];
    const sorted = sortTasksByPriority(tasks);
    expect(sorted[0].id).toBe("t2"); // HIGH first
    expect(sorted[1].id).toBe("t3"); // MEDIUM second
    expect(sorted[2].id).toBe("t1"); // LOW last
  });

  it("attaches priorityScore to each task", () => {
    const tasks = [makeTask({ priority: "HIGH" })];
    const sorted = sortTasksByPriority(tasks);
    expect(sorted[0].priorityScore).toBeGreaterThan(0);
  });
});

// ── calculateDailyCompletionPct ───────────────────────────────────────────────

describe("calculateDailyCompletionPct", () => {
  it("returns 0 when no tasks", () => {
    expect(calculateDailyCompletionPct([])).toBe(0);
  });

  it("returns 100 when all daily tasks complete", () => {
    const tasks = [
      makeTask({ type: "DAILY", status: "COMPLETED" }),
      makeTask({ type: "DAILY", status: "COMPLETED" }),
    ];
    expect(calculateDailyCompletionPct(tasks)).toBe(100);
  });

  it("returns 50 when half done", () => {
    const tasks = [
      makeTask({ type: "DAILY", status: "COMPLETED" }),
      makeTask({ type: "DAILY", status: "PENDING" }),
    ];
    expect(calculateDailyCompletionPct(tasks)).toBe(50);
  });

  it("only includes tasks due today", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      makeTask({ type: "ONE_TIME", status: "COMPLETED", deadline: today }),
      makeTask({
        type: "ONE_TIME",
        status: "PENDING",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 48),
      }),
    ];
    // Only the today task is included
    expect(calculateDailyCompletionPct(tasks)).toBe(100);
  });
});

// ── calculateCategoryProgress ─────────────────────────────────────────────────

describe("calculateCategoryProgress", () => {
  it("groups by tags and calculates pct", () => {
    const tasks = [
      makeTask({ tags: ["work"], status: "COMPLETED" }),
      makeTask({ tags: ["work"], status: "PENDING" }),
      makeTask({ tags: ["personal"], status: "COMPLETED" }),
    ];
    const progress = calculateCategoryProgress(tasks);
    expect(progress["work"].total).toBe(2);
    expect(progress["work"].completed).toBe(1);
    expect(progress["work"].pct).toBe(50);
    expect(progress["personal"].pct).toBe(100);
  });

  it("uses uncategorized for tasks with no tags", () => {
    const tasks = [makeTask({ tags: [] })];
    const progress = calculateCategoryProgress(tasks);
    expect(progress["uncategorized"]).toBeDefined();
  });
});

// ── filterTodayTasks ──────────────────────────────────────────────────────────

describe("filterTodayTasks", () => {
  it("includes DAILY tasks", () => {
    const tasks = [makeTask({ type: "DAILY" })];
    expect(filterTodayTasks(tasks)).toHaveLength(1);
  });

  it("excludes CANCELLED tasks", () => {
    const tasks = [makeTask({ type: "DAILY", status: "CANCELLED" })];
    expect(filterTodayTasks(tasks)).toHaveLength(0);
  });

  it("includes RECURRING tasks for today's day of week", () => {
    const today = new Date().getDay();
    const tasks = [makeTask({ type: "RECURRING", recurringDays: [today] })];
    expect(filterTodayTasks(tasks)).toHaveLength(1);
  });

  it("excludes RECURRING tasks not scheduled for today", () => {
    const today = new Date().getDay();
    const notToday = (today + 1) % 7;
    const tasks = [makeTask({ type: "RECURRING", recurringDays: [notToday] })];
    expect(filterTodayTasks(tasks)).toHaveLength(0);
  });
});

// ── shouldSuggestBreak ────────────────────────────────────────────────────────

describe("shouldSuggestBreak", () => {
  it("returns false if not enough time has passed", () => {
    const start = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    expect(shouldSuggestBreak(start, 25)).toBe(false);
  });

  it("returns true if past alert threshold", () => {
    const start = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    expect(shouldSuggestBreak(start, 25)).toBe(true);
  });
});

// ── shouldShowSleepReminder ───────────────────────────────────────────────────

describe("shouldShowSleepReminder", () => {
  it("returns false during the day", () => {
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    expect(shouldShowSleepReminder(true, noon)).toBe(false);
  });

  it("returns true late at night with pending tasks", () => {
    const lateNight = new Date();
    lateNight.setHours(23, 30, 0, 0);
    expect(shouldShowSleepReminder(true, lateNight)).toBe(true);
  });

  it("returns false if no pending tasks even late", () => {
    const lateNight = new Date();
    lateNight.setHours(23, 30, 0, 0);
    expect(shouldShowSleepReminder(false, lateNight)).toBe(false);
  });

  it("returns true after midnight with pending tasks", () => {
    const afterMidnight = new Date();
    afterMidnight.setHours(1, 0, 0, 0);
    expect(shouldShowSleepReminder(true, afterMidnight)).toBe(true);
  });
});

// ── formatMinutes ─────────────────────────────────────────────────────────────

describe("formatMinutes", () => {
  it("shows minutes for < 60", () => {
    expect(formatMinutes(45)).toBe("45m");
  });

  it("shows hours for whole hours", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("shows hours and minutes for mixed", () => {
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(75)).toBe("1h 15m");
  });
});
