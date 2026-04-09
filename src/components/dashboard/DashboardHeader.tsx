"use client";

import { motion } from "framer-motion";
import { useSettingsStore } from "@/store";

export function DashboardHeader() {
  const { activityTrackingEnabled, toggleActivityTracking } = useSettingsStore();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      {/* Logo + greeting */}
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="text-[#D4AF37] text-sm">⚡</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Task Handler <span className="text-[#D4AF37]">AI</span>
          </span>
        </motion.div>

        <span className="hidden sm:block text-white/30 text-sm">·</span>
        <span className="hidden sm:block text-white/50 text-sm">{greeting}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Activity tracking toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 hidden sm:block">Activity tracking</span>
          <button
            onClick={toggleActivityTracking}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              activityTrackingEnabled ? "bg-[#D4AF37]" : "bg-white/10"
            }`}
            title={activityTrackingEnabled ? "Disable activity tracking" : "Enable activity tracking (opt-in)"}
          >
            <motion.div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
              animate={{ x: activityTrackingEnabled ? 21 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <div className="text-xs text-white/30 hidden sm:block">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
