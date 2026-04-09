"use client";

import { useEffect, useRef } from "react";
import { useTaskStore, useProgressStore, useAlertStore } from "@/store";

/**
 * useRealtimeSync – subscribes to the SSE /api/realtime endpoint and
 * triggers data refreshes when events arrive.
 *
 * Fallback: also polls every 30s for environments where SSE is blocked.
 *
 * TODO: Replace with a managed realtime service (Pusher, Supabase Realtime,
 *       etc.) for production multi-instance deployments.
 */
export function useRealtimeSync() {
  const { filter, setTasks, setLoading } = useTaskStore();
  const { setProgress } = useProgressStore();
  const { setAlerts } = useAlertStore();
  const esRef = useRef<EventSource | null>(null);

  const refresh = async () => {
    try {
      const [tasksRes, progressRes, alertsRes] = await Promise.all([
        fetch(`/api/tasks?filter=${filter}`),
        fetch("/api/progress"),
        fetch("/api/alerts"),
      ]);

      const [tasks, progress, alerts] = await Promise.all([
        tasksRes.json(),
        progressRes.json(),
        alertsRes.json(),
      ]);

      if (tasks.success) setTasks(tasks.data.tasks);
      if (progress.success) setProgress(progress.data);
      if (alerts.success) setAlerts(alerts.data);
    } catch {
      // Silently ignore refresh errors
    }
  };

  useEffect(() => {
    // SSE connection
    const es = new EventSource("/api/realtime");
    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "task_updated" || data.type === "progress_updated") {
        refresh();
      }
    };

    // Polling fallback (every 60s)
    const poll = setInterval(refresh, 60_000);

    return () => {
      es.close();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
}
