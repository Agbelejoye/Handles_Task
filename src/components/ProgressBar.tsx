'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  label?: string
  showPercentage?: boolean
}

export default function ProgressBar({ value, label, showPercentage = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-gold">{clamped}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-black-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #D4AF37, #F0D060)',
            boxShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
