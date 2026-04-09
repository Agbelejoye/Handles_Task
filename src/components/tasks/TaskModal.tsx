"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Task } from "@prisma/client";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const TASK_TYPES = ["ONE_TIME", "DAILY", "RECURRING"] as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskModal({ open, task, onClose }: TaskModalProps) {
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "ONE_TIME" as (typeof TASK_TYPES)[number],
    priority: "MEDIUM" as (typeof PRIORITIES)[number],
    tags: "",
    deadline: "",
    estimatedMinutes: "",
    recurringDays: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        type: task.type,
        priority: task.priority,
        tags: task.tags.join(", "),
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : "",
        estimatedMinutes: task.estimatedMinutes?.toString() ?? "",
        recurringDays: task.recurringDays ?? [],
      });
    } else {
      setForm({
        title: "",
        description: "",
        type: "ONE_TIME",
        priority: "MEDIUM",
        tags: "",
        deadline: "",
        estimatedMinutes: "",
        recurringDays: [],
      });
    }
    setError("");
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      priority: form.priority,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      estimatedMinutes: form.estimatedMinutes
        ? parseInt(form.estimatedMinutes)
        : undefined,
      recurringDays: form.recurringDays,
    };

    try {
      const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to save task");
        return;
      }
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      recurringDays: f.recurringDays.includes(day)
        ? f.recurringDays.filter((d) => d !== day)
        : [...f.recurringDays, day],
    }));
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="glass-gold rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? "Edit Task" : "New Task"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/60"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional details…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/60 resize-none"
                  />
                </div>

                {/* Type + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as (typeof TASK_TYPES)[number],
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/60"
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#1A1A1A]">
                          {t.replace("_", " ").toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priority: e.target.value as (typeof PRIORITIES)[number],
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/60"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p} className="bg-[#1A1A1A]">
                          {p.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Deadline + Estimated */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Deadline</label>
                    <input
                      type="datetime-local"
                      value={form.deadline}
                      onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Est. (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={form.estimatedMinutes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))
                      }
                      placeholder="25"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/60"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="work, research, personal"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/60"
                  />
                </div>

                {/* Recurring days */}
                {form.type === "RECURRING" && (
                  <div>
                    <label className="block text-xs text-white/60 mb-2">
                      Repeat on
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {DAYS.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                            form.recurringDays.includes(i)
                              ? "bg-[#D4AF37] text-black"
                              : "bg-white/5 text-white/50 hover:bg-white/10"
                          }`}
                        >
                          {day.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    {isEdit ? "Save Changes" : "Create Task"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
