"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useFocusStore } from "@/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FocusPanel() {
  const { activeSession, elapsedSec, setSession, setElapsed } = useFocusStore();
  const [durationMin, setDurationMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch existing active session on mount
  useEffect(() => {
    fetch("/api/focus")
      .then((r) => r.json())
      .then((json) => { if (json.success && json.data) setSession(json.data); });
  }, [setSession]);

  // Timer
  useEffect(() => {
    if (activeSession) {
      const sessionDurationSec = (phase === "focus" ? activeSession.durationMin : activeSession.breakMin) * 60;

      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= sessionDurationSec) {
            // Phase complete
            if (phase === "focus") {
              setPhase("break");
              return 0;
            } else {
              setPhase("focus");
              return 0;
            }
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSession, phase, setElapsed]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMin, breakMin }),
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setElapsed(0);
        setPhase("focus");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      await fetch(`/api/focus/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      setSession(null);
      setElapsed(0);
      setPhase("focus");
    } finally {
      setLoading(false);
    }
  };

  const sessionDurationSec = activeSession
    ? (phase === "focus" ? activeSession.durationMin : activeSession.breakMin) * 60
    : durationMin * 60;

  const progressPct = activeSession ? Math.round((elapsedSec / sessionDurationSec) * 100) : 0;
  const remaining = sessionDurationSec - elapsedSec;

  return (
    <Card>
      <CardHeader
        title="Focus Mode"
        icon={<span>🎯</span>}
        subtitle={activeSession ? (phase === "focus" ? "Focus session active" : "Break time!") : "Pomodoro timer"}
      />

      {/* Timer display */}
      <div className="text-center my-4">
        <motion.div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-2 ${
            activeSession
              ? phase === "focus"
                ? "border-[#D4AF37] gold-glow pulse-gold"
                : "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
              : "border-white/10"
          }`}
        >
          <div className="text-center">
            <p className="text-xl font-mono font-bold text-[#D4AF37]">
              {activeSession ? formatTime(remaining) : formatTime(durationMin * 60)}
            </p>
            <p className="text-xs text-white/40 capitalize">{activeSession ? phase : "ready"}</p>
          </div>
        </motion.div>
      </div>

      {/* Progress */}
      {activeSession && (
        <div className="mb-4">
          <ProgressBar value={progressPct} showLabel={false} size="sm" />
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>{formatTime(elapsedSec)} elapsed</span>
            <span>{formatTime(remaining)} left</span>
          </div>
        </div>
      )}

      {/* Duration controls (only when not active) */}
      {!activeSession && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Focus (min)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDurationMin((v) => Math.max(5, v - 5))}
                className="w-7 h-7 rounded bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-mono text-white">{durationMin}</span>
              <button
                onClick={() => setDurationMin((v) => Math.min(120, v + 5))}
                className="w-7 h-7 rounded bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Break (min)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBreakMin((v) => Math.max(1, v - 1))}
                className="w-7 h-7 rounded bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-mono text-white">{breakMin}</span>
              <button
                onClick={() => setBreakMin((v) => Math.min(30, v + 1))}
                className="w-7 h-7 rounded bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <Button
        onClick={activeSession ? handleStop : handleStart}
        loading={loading}
        variant={activeSession ? "danger" : "primary"}
        className="w-full"
      >
        {activeSession ? "Stop Session" : "Start Focus"}
      </Button>

      {/* Quick presets */}
      {!activeSession && (
        <div className="flex gap-2 mt-3">
          {[
            { label: "Pomodoro", focus: 25, brk: 5 },
            { label: "Deep Work", focus: 50, brk: 10 },
            { label: "Sprint", focus: 15, brk: 3 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setDurationMin(preset.focus);
                setBreakMin(preset.brk);
              }}
              className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
