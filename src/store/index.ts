"use client";

import { create } from "zustand";
import type { Task, Alert, FocusSession, ActivityLog } from "@prisma/client";

// ─── Task store ───────────────────────────────────────────────────────────────

interface TaskState {
  tasks: Task[];
  loading: boolean;
  filter: "today" | "all" | "completed" | "pending";
  setFilter: (f: TaskState["filter"]) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  filter: "today",
  setFilter: (filter) => set({ filter }),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, patch) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));

// ─── Progress store ───────────────────────────────────────────────────────────

interface ProgressState {
  dailyPct: number;
  streak: number;
  categoryProgress: Record<string, { total: number; completed: number; pct: number }>;
  setProgress: (data: Partial<ProgressState>) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  dailyPct: 0,
  streak: 0,
  categoryProgress: {},
  setProgress: (data) => set((s) => ({ ...s, ...data })),
}));

// ─── Focus store ──────────────────────────────────────────────────────────────

interface FocusState {
  activeSession: FocusSession | null;
  elapsedSec: number;
  setSession: (session: FocusSession | null) => void;
  setElapsed: (sec: number | ((prev: number) => number)) => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  activeSession: null,
  elapsedSec: 0,
  setSession: (activeSession) => set({ activeSession, elapsedSec: 0 }),
  setElapsed: (sec: number | ((prev: number) => number)) => set((s) => ({
    elapsedSec: typeof sec === "function" ? sec(s.elapsedSec) : sec,
  })),
}));

// ─── Alert store ──────────────────────────────────────────────────────────────

interface AlertState {
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  removeAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
}));

// ─── Activity store ───────────────────────────────────────────────────────────

interface ActivityState {
  recentActivity: ActivityLog[];
  topDomains: { domain: string; durationSec: number }[];
  setActivity: (data: { recentActivity: ActivityLog[]; topDomains: { domain: string; durationSec: number }[] }) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  recentActivity: [],
  topDomains: [],
  setActivity: ({ recentActivity, topDomains }) => set({ recentActivity, topDomains }),
}));

// ─── AI Chat store ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
}

interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  addMessage: (msg: ChatMessage) => void;
  setConversationId: (id: string) => void;
  setSending: (v: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversationId: null,
  messages: [],
  sending: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setConversationId: (conversationId) => set({ conversationId }),
  setSending: (sending) => set({ sending }),
  clearChat: () => set({ messages: [], conversationId: null }),
}));

// ─── Settings store ───────────────────────────────────────────────────────────

interface SettingsState {
  activityTrackingEnabled: boolean;
  toggleActivityTracking: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activityTrackingEnabled: false,
  toggleActivityTracking: () =>
    set((s) => ({ activityTrackingEnabled: !s.activityTrackingEnabled })),
}));
