/**
 * AI helper – builds context from tasks/progress/activity and
 * returns assistant responses. Falls back to deterministic mock
 * responses when OPENAI_API_KEY is not set.
 */

import type { Task, ActivityLog, FocusSession } from "@prisma/client";
import {
  calculateDailyCompletionPct,
  filterTodayTasks,
  shouldShowSleepReminder,
} from "./task-logic";

export interface AIContext {
  tasks: Task[];
  recentActivity: ActivityLog[];
  activeFocusSession: FocusSession | null;
  conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

// ─── Mock / rule-based responses ─────────────────────────────────────────────

const MOCK_INTROS = [
  "Here's what I'm seeing based on your tasks:",
  "Looking at your current workload:",
  "Based on your schedule:",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMockResponse(prompt: string, ctx: AIContext): string {
  const lower = prompt.toLowerCase();
  const todayTasks = filterTodayTasks(ctx.tasks);
  const completionPct = calculateDailyCompletionPct(ctx.tasks);
  const pending = todayTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  // Sleep reminder
  if (shouldShowSleepReminder(pending.length > 0)) {
    return "🌙 It's getting late. You have a few tasks pending but your wellbeing matters more. Consider wrapping up and getting some rest — you'll be more productive tomorrow.";
  }

  // Day planning
  if (lower.includes("plan") && lower.includes("day")) {
    if (pending.length === 0) return "✅ You've completed all your tasks for today! Great work. Feel free to rest or tackle something from tomorrow's list.";
    const top3 = pending.slice(0, 3).map((t, i) => `${i + 1}. **${t.title}**${t.priority === "HIGH" ? " 🔴" : t.priority === "MEDIUM" ? " 🟡" : " 🟢"}`).join("\n");
    return `${randomPick(MOCK_INTROS)}\n\nI suggest tackling these first:\n${top3}\n\nYou're at **${completionPct}%** for the day. ${completionPct < 50 ? "There's still a good chunk to go — break tasks into 25-min focus blocks." : "You're making great progress!"}`;
  }

  // What to do next
  if (lower.includes("next") || lower.includes("what should")) {
    if (pending.length === 0) return "🎉 Nothing left on today's list! Take a well-earned break.";
    const next = pending[0];
    return `Your next best task is **"${next.title}"** (${next.priority.toLowerCase()} priority${next.deadline ? `, due ${new Date(next.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}). ${next.estimatedMinutes ? `Estimated time: ${next.estimatedMinutes} minutes.` : ""}\n\nWant me to start a focus session for it?`;
  }

  // Break reminder
  if (lower.includes("break")) {
    return "⏸ Taking a break is a great idea! A 5-10 minute walk or stretch can improve focus significantly. Come back refreshed and you'll work more effectively.";
  }

  // Progress query
  if (lower.includes("progress") || lower.includes("how am i")) {
    return `You're at **${completionPct}%** completion today (${todayTasks.filter(t => t.status === "COMPLETED").length} of ${todayTasks.length} tasks done). ${completionPct === 100 ? "🏆 Perfect day!" : completionPct >= 70 ? "💪 Excellent momentum!" : completionPct >= 40 ? "📈 Keep pushing!" : "🚀 Let's get started!"}`;
  }

  // Behind / struggling
  if (lower.includes("behind") || lower.includes("struggle") || lower.includes("falling")) {
    const overdue = pending.filter((t) => t.deadline && new Date(t.deadline) < new Date());
    return `You have ${pending.length} pending tasks${overdue.length > 0 ? `, including ${overdue.length} overdue` : ""}. The key is to focus on one task at a time. Start with your highest-priority item and use the Focus Mode to eliminate distractions. Small wins build momentum! 💡`;
  }

  // Task breakdown
  if (lower.includes("break") && lower.includes("task")) {
    const match = ctx.tasks.find((t) => lower.includes(t.title.toLowerCase()));
    if (match) {
      return `To break down **"${match.title}"**:\n1. Define the desired outcome clearly\n2. List all sub-tasks needed\n3. Estimate time for each step\n4. Tackle the hardest part first (Eat the Frog!)\n5. Review and adjust as you go\n\nWould you like me to create sub-tasks for this?`;
    }
    return "To break down a task effectively: define the outcome, list sub-steps, estimate each, start with the hardest part, and review often. Tell me which task you'd like to break down!";
  }

  // Focus session
  if (lower.includes("focus") || lower.includes("pomodoro")) {
    return "🎯 The Pomodoro Technique works great: 25 minutes of focused work, then a 5-minute break. After 4 rounds, take a longer 15-30 minute break. Use the **Focus Mode** panel to start a timed session now!";
  }

  // Default helpful response
  return `I'm here to help with your tasks! You have **${pending.length} tasks** remaining today at **${completionPct}%** completion.\n\nYou can ask me:\n• "What should I do next?"\n• "Plan my day"\n• "How am I doing on my tasks?"\n• "Should I take a break?"\n• "Break down [task name]"`;
}

// ─── OpenAI integration ───────────────────────────────────────────────────────

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
}

function buildSystemPrompt(ctx: AIContext): string {
  const todayTasks = filterTodayTasks(ctx.tasks);
  const completionPct = calculateDailyCompletionPct(ctx.tasks);
  const pending = todayTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  const tasksSummary = pending
    .slice(0, 10)
    .map((t) => `- ${t.title} [${t.priority}${t.deadline ? `, due ${new Date(t.deadline).toISOString()}` : ""}]`)
    .join("\n");

  return `You are Task Handler AI, an intelligent productivity assistant. Be concise, motivational, and practical.

Current context:
- Today's completion: ${completionPct}%
- Pending tasks (${pending.length}):
${tasksSummary || "None"}
- Active focus session: ${ctx.activeFocusSession ? "Yes" : "No"}
- Recent browsing activity: ${ctx.recentActivity.length} records

Rules:
- Give actionable advice, not generic platitudes
- Reference specific tasks when relevant
- Suggest focus sessions, breaks, or sleep reminders when appropriate
- Keep responses under 200 words
- Use markdown formatting
- Be encouraging but realistic`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAIResponse(
  userMessage: string,
  ctx: AIContext
): Promise<string> {
  // Use real OpenAI if key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const history = ctx.conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));
      history.push({ role: "user", content: userMessage });
      return await callOpenAI(history, buildSystemPrompt(ctx));
    } catch (err) {
      console.error("OpenAI call failed, falling back to mock:", err);
    }
  }

  // Fallback to deterministic mock
  return buildMockResponse(userMessage, ctx);
}
