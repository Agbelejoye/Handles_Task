/**
 * Alert generation heuristics
 */

import type { Task, FocusSession, ActivityLog } from "@prisma/client";
import { shouldSuggestBreak, shouldShowSleepReminder } from "./task-logic";

export interface GeneratedAlert {
  type: "TASK_INCOMPLETE" | "FOCUS_DISTRACTION" | "BREAK_REMINDER" | "SLEEP_REMINDER";
  title: string;
  message: string;
  taskId?: string;
}

/**
 * Checks all alert conditions and returns any alerts that should be shown.
 */
export function generateAlerts(
  tasks: Task[],
  activeSession: FocusSession | null,
  recentActivity: ActivityLog[],
  date: Date = new Date()
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];

  // ── Sleep reminder ────────────────────────────────────────────────────────
  const hasPending = tasks.some(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );
  if (shouldShowSleepReminder(hasPending, date)) {
    alerts.push({
      type: "SLEEP_REMINDER",
      title: "Time to Rest 🌙",
      message:
        "It's late and you still have pending tasks. Your productivity will be better after a good night's sleep. Consider stopping for today.",
    });
  }

  // ── Break reminder (active session too long) ──────────────────────────────
  if (activeSession) {
    const sessionStart = new Date(activeSession.startedAt);
    if (shouldSuggestBreak(sessionStart, activeSession.durationMin)) {
      alerts.push({
        type: "BREAK_REMINDER",
        title: "Break Time ⏸",
        message: `You've been in focus mode for ${activeSession.durationMin}+ minutes. Take a ${activeSession.breakMin}-minute break to recharge.`,
      });
    }
  }

  // ── Overdue task alerts ───────────────────────────────────────────────────
  const now = date.getTime();
  const overdueTasks = tasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline).getTime() < now &&
      t.status !== "COMPLETED" &&
      t.status !== "CANCELLED"
  );

  for (const task of overdueTasks.slice(0, 3)) {
    alerts.push({
      type: "TASK_INCOMPLETE",
      title: `Overdue: ${task.title}`,
      message: `This task passed its deadline. Would you like to complete it now or reschedule?`,
      taskId: task.id,
    });
  }

  // ── Focus distraction (recent activity unrelated to tasks) ───────────────
  const distractingDomains = ["youtube.com", "twitter.com", "x.com", "instagram.com", "tiktok.com", "reddit.com", "facebook.com"];
  const recentDistraction = recentActivity.find(
    (a) => distractingDomains.some((d) => a.domain.includes(d)) && a.durationSec > 300
  );
  if (activeSession && recentDistraction) {
    alerts.push({
      type: "FOCUS_DISTRACTION",
      title: "Distraction Detected 🚨",
      message: `You've been on ${recentDistraction.domain} for ${Math.round(recentDistraction.durationSec / 60)} minutes during your focus session. Ready to refocus?`,
    });
  }

  return alerts;
}
