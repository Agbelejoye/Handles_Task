"use client";

import { useEffect } from "react";
import { useActivityStore } from "@/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { motion } from "framer-motion";

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

export function ActivityInsights() {
  const { topDomains, recentActivity, setActivity } = useActivityStore();

  useEffect(() => {
    fetch("/api/activity?limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setActivity(json.data);
      });
  }, [setActivity]);

  const totalSec = topDomains.reduce((a, d) => a + d.durationSec, 0);

  return (
    <Card>
      <CardHeader title="Activity Insights" icon={<span>📡</span>} subtitle="Browser activity" />

      {topDomains.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <span className="text-3xl">🌐</span>
          <p className="text-white/40 text-sm text-center">
            No activity yet. Install the browser extension to start tracking.
          </p>
          <p className="text-xs text-white/30 text-center">
            See <code className="text-[#D4AF37]">/extension</code> folder for setup.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topDomains.slice(0, 6).map((d, i) => {
            const pct = Math.round((d.durationSec / (totalSec || 1)) * 100);
            return (
              <motion.div
                key={d.domain}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/70 truncate max-w-[60%]">{d.domain}</span>
                  <span className="text-xs text-white/40">{formatDuration(d.durationSec)}</span>
                </div>
                <ProgressBar value={pct} showLabel={false} size="sm" animated={false} />
              </motion.div>
            );
          })}

          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-white/40">
              Total tracked: {formatDuration(totalSec)} · {recentActivity.length} events
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
