"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlertStore } from "@/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Alert } from "@prisma/client";

const ALERT_ICONS: Record<string, string> = {
  TASK_INCOMPLETE: "📋",
  FOCUS_DISTRACTION: "🚨",
  BREAK_REMINDER: "⏸",
  SLEEP_REMINDER: "🌙",
  CUSTOM: "🔔",
};

export function AlertsPanel() {
  const { alerts, setAlerts, removeAlert } = useAlertStore();

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((json) => { if (json.success) setAlerts(json.data); });
  }, [setAlerts]);

  const handleAction = async (
    alert: Alert,
    action: "ACKNOWLEDGED" | "DISMISSED" | "RESCHEDULED"
  ) => {
    const body: Record<string, unknown> = { status: action };
    if (action === "RESCHEDULED") {
      body.scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    }

    await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    removeAlert(alert.id);
  };

  return (
    <Card>
      <CardHeader
        title="Alerts"
        icon={<span>🔔</span>}
        subtitle={alerts.length > 0 ? `${alerts.length} active` : "All clear"}
      />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <span className="text-3xl">✅</span>
          <p className="text-white/40 text-sm">No active alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {alerts.slice(0, 5).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={(action) => handleAction(alert, action)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

function AlertCard({
  alert,
  onAction,
}: {
  alert: Alert;
  onAction: (action: "ACKNOWLEDGED" | "DISMISSED" | "RESCHEDULED") => void;
}) {
  const borderColors: Record<string, string> = {
    TASK_INCOMPLETE: "border-yellow-500/30",
    FOCUS_DISTRACTION: "border-red-500/30",
    BREAK_REMINDER: "border-blue-500/30",
    SLEEP_REMINDER: "border-purple-500/30",
    CUSTOM: "border-white/20",
  };
  const borderColor = borderColors[alert.type as string] ?? "border-white/20";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`glass rounded-xl p-3 border ${borderColor}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg flex-shrink-0">{ALERT_ICONS[alert.type] ?? "🔔"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{alert.title}</p>
          <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{alert.message}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          className="flex-1 text-xs"
          onClick={() => onAction("ACKNOWLEDGED")}
        >
          Continue
        </Button>
        {alert.type === "BREAK_REMINDER" || alert.type === "FOCUS_DISTRACTION" ? (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 text-xs"
            onClick={() => onAction("ACKNOWLEDGED")}
          >
            Take Break
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs"
            onClick={() => onAction("RESCHEDULED")}
          >
            Reschedule
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="px-2"
          onClick={() => onAction("DISMISSED")}
        >
          ×
        </Button>
      </div>
    </motion.div>
  );
}
