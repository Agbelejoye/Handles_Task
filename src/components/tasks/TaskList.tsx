"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore, useProgressStore } from "@/store";
import type { Task } from "@prisma/client";
import { priorityColor, statusColor, formatMinutes } from "@/lib/task-logic";
import { Badge } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { TaskModal } from "./TaskModal";

export function TaskList() {
  const { tasks, loading, filter, setFilter, setTasks, updateTask, removeTask, setLoading } = useTaskStore();
  const { setProgress } = useProgressStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?filter=${filter}`);
      const json = await res.json();
      if (json.success) setTasks(json.data.tasks);
    } finally {
      setLoading(false);
    }
  }, [filter, setTasks, setLoading]);

  const fetchProgress = useCallback(async () => {
    const res = await fetch("/api/progress");
    const json = await res.json();
    if (json.success) setProgress(json.data);
  }, [setProgress]);

  useEffect(() => {
    fetchTasks();
    fetchProgress();
  }, [fetchTasks, fetchProgress]);

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      updateTask(task.id, json.data);
      fetchProgress();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) removeTask(id);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTask(null);
    fetchTasks();
    fetchProgress();
  };

  const filters = [
    { key: "today", label: "Today" },
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Done" },
  ] as const;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader
          title="Tasks"
          icon={<span>📋</span>}
          action={
            <Button size="sm" onClick={handleCreate}>
              + New Task
            </Button>
          }
        />

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-lg">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all duration-200 ${
                filter === f.key
                  ? "bg-[#D4AF37] text-black font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/40 text-sm">
              Loading…
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">✨</span>
              <p className="text-white/40 text-sm">No tasks here. Create one!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleComplete(task)}
                  onEdit={() => handleEdit(task)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={handleModalClose}
      />
    </>
  );
}

function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCompleted = task.status === "COMPLETED";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? "bg-[#D4AF37] border-[#D4AF37]"
            : "border-white/30 hover:border-[#D4AF37]"
        }`}
      >
        {isCompleted && <span className="text-black text-xs font-bold">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isCompleted ? "line-through text-white/40" : "text-white"
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-white/40 truncate mt-0.5">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <Badge className={priorityColor(task.priority)}>{task.priority.toLowerCase()}</Badge>
          {task.deadline && (
            <span className="text-xs text-white/40">
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="text-xs text-white/30">⏱ {formatMinutes(task.estimatedMinutes)}</span>
          )}
          {task.tags.slice(0, 2).map((tag: string) => (
            <Badge key={tag} className="text-white/50 bg-white/5">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="text-white/40 hover:text-[#D4AF37] text-xs px-2 py-1 rounded"
        >
          ✏
        </button>
        <button
          onClick={onDelete}
          className="text-white/40 hover:text-red-400 text-xs px-2 py-1 rounded"
        >
          🗑
        </button>
      </div>
    </motion.div>
  );
}
