"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressBar({
  value,
  className,
  showLabel = true,
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-white/60">Progress</span>
          <span className="text-xs font-semibold text-[#D4AF37]">{clampedValue}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-white/5 overflow-hidden", heights[size])}>
        <motion.div
          className={cn(
            "h-full rounded-full",
            animated ? "progress-bar-animated" : "bg-[#D4AF37]"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
