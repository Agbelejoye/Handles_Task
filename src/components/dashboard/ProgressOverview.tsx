"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { motion } from "framer-motion";

export function ProgressOverview() {
  const { dailyPct, streak, categoryProgress, setProgress } = useProgressStore();

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((json) => { if (json.success) setProgress(json.data); });
  }, [setProgress]);

  const categories = Object.entries(categoryProgress).slice(0, 5);

  return (
    <Card>
      <CardHeader title="Progress" icon={<span>📊</span>} subtitle="Today's overview" />

      {/* Main daily progress */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-[#D4AF37] gold-text-glow">{dailyPct}%</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">🔥 {streak} day streak</span>
          </div>
        </div>
        <ProgressBar value={dailyPct} showLabel={false} size="lg" />
        <p className="text-xs text-white/40 mt-1">
          {dailyPct === 100
            ? "🎉 All done for today!"
            : dailyPct >= 70
            ? "Great progress — almost there!"
            : dailyPct >= 40
            ? "Keep pushing, you're doing well."
            : "Let's get started on today's tasks."}
        </p>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-white/50 font-medium uppercase tracking-wider">By category</p>
          {categories.map(([tag, { pct, completed, total }], i) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/70 capitalize">#{tag}</span>
                <span className="text-xs text-white/40">
                  {completed}/{total}
                </span>
              </div>
              <ProgressBar value={pct} showLabel={false} size="sm" animated={false} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "Tasks", value: Object.values(categoryProgress).reduce((a, c) => a + c.total, 0) },
          { label: "Done", value: Object.values(categoryProgress).reduce((a, c) => a + c.completed, 0) },
          { label: "Streak", value: `${streak}d` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-base font-bold text-[#D4AF37]">{value}</p>
            <p className="text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
