"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#D4AF37] text-black hover:bg-[#E8C84A] active:bg-[#B8952A]",
    secondary:
      "border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 active:bg-[#D4AF37]/20",
    ghost:
      "text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10",
    danger:
      "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 h-7",
    md: "text-sm px-4 py-2 h-9",
    lg: "text-base px-6 py-3 h-11",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}
