/**
 * Unit tests for alert-heuristics.ts
 */

import { generateAlerts } from "../../src/lib/alert-heuristics";
import type { Task, FocusSession, ActivityLog } from "@prisma/client";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t1",
  userId: "u1",
  title: "Test",
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

const makeSession = (overrides: Partial<FocusSession> = {}): FocusSession => ({
  id: "s1",
  userId: "u1",
  taskId: null,
  durationMin: 25,
  breakMin: 5,
  status: "ACTIVE",
  startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  endedAt: null,
  ...overrides,
});

const makeActivity = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id: "a1",
  userId: "u1",
  taskId: null,
  url: null,
  domain: "github.com",
  title: null,
  durationSec: 100,
  recordedAt: new Date(),
  ...overrides,
});

describe("generateAlerts", () => {
  it("returns empty array with no triggers", () => {
    const tasks = [makeTask({ status: "COMPLETED" })];
    const alerts = generateAlerts(tasks, null, [], new Date("2024-06-15T14:00:00"));
    expect(alerts).toHaveLength(0);
  });

  it("generates SLEEP_REMINDER late at night with pending tasks", () => {
    const lateNight = new Date("2024-06-15T23:30:00");
    const tasks = [makeTask({ status: "PENDING" })];
    const alerts = generateAlerts(tasks, null, [], lateNight);
    expect(alerts.some((a) => a.type === "SLEEP_REMINDER")).toBe(true);
  });

  it("generates BREAK_REMINDER when focus session exceeds duration", () => {
    const session = makeSession({
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      durationMin: 25,
    });
    const alerts = generateAlerts([], session, [], new Date("2024-06-15T14:00:00"));
    expect(alerts.some((a) => a.type === "BREAK_REMINDER")).toBe(true);
  });

  it("does NOT generate BREAK_REMINDER when session is short", () => {
    const session = makeSession({
      startedAt: new Date(Date.now() - 10 * 60 * 1000), // only 10 min
      durationMin: 25,
    });
    const alerts = generateAlerts([], session, [], new Date("2024-06-15T14:00:00"));
    expect(alerts.some((a) => a.type === "BREAK_REMINDER")).toBe(false);
  });

  it("generates TASK_INCOMPLETE for overdue tasks", () => {
    const testDate = new Date("2024-06-15T14:00:00");
    const overdueTask = makeTask({
      status: "PENDING",
      deadline: new Date("2024-06-15T12:00:00"), // 2h before testDate
    });
    const alerts = generateAlerts([overdueTask], null, [], testDate);
    expect(alerts.some((a) => a.type === "TASK_INCOMPLETE")).toBe(true);
    expect(alerts.find((a) => a.type === "TASK_INCOMPLETE")?.taskId).toBe("t1");
  });

  it("generates FOCUS_DISTRACTION when on social media during focus", () => {
    const session = makeSession({ startedAt: new Date(Date.now() - 30 * 60 * 1000) });
    const distractionActivity = makeActivity({
      domain: "youtube.com",
      durationSec: 600, // > 300s threshold
    });
    const alerts = generateAlerts([], session, [distractionActivity], new Date("2024-06-15T14:00:00"));
    expect(alerts.some((a) => a.type === "FOCUS_DISTRACTION")).toBe(true);
  });

  it("does NOT generate distraction without active session", () => {
    const distractionActivity = makeActivity({
      domain: "youtube.com",
      durationSec: 600,
    });
    const alerts = generateAlerts([], null, [distractionActivity], new Date("2024-06-15T14:00:00"));
    expect(alerts.some((a) => a.type === "FOCUS_DISTRACTION")).toBe(false);
  });

  it("caps TASK_INCOMPLETE alerts at 3", () => {
    const testDate = new Date("2024-06-15T14:00:00");
    const overdueTasks = Array.from({ length: 5 }, (_, i) =>
      makeTask({
        id: `t${i}`,
        status: "PENDING",
        deadline: new Date("2024-06-15T12:00:00"), // 2h before testDate
      })
    );
    const alerts = generateAlerts(overdueTasks, null, [], testDate);
    const incompleteAlerts = alerts.filter((a) => a.type === "TASK_INCOMPLETE");
    expect(incompleteAlerts.length).toBeLessThanOrEqual(3);
  });
});
