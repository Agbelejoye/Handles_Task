'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Coffee, Bell } from 'lucide-react'
import { useAlertStore, Alert } from '@/store/alertStore'

const ALERT_DURATION = 8000

const alertConfig = {
  deadline: {
    color: 'border-red-500',
    bg: 'bg-red-500/10',
    icon: Clock,
    iconColor: 'text-red-400',
  },
  focus: {
    color: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    icon: Bell,
    iconColor: 'text-yellow-400',
  },
  break: {
    color: 'border-blue-500',
    bg: 'bg-blue-500/10',
    icon: Coffee,
    iconColor: 'text-blue-400',
  },
  sleep: {
    color: 'border-purple-500',
    bg: 'bg-purple-500/10',
    icon: Bell,
    iconColor: 'text-purple-400',
  },
}

function AlertItem({ alert, index }: { alert: Alert; index: number }) {
  const { dismissAlert } = useAlertStore()
  const [progress, setProgress] = useState(100)
  const config = alertConfig[alert.type]
  const Icon = config.icon

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / ALERT_DURATION) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        dismissAlert(alert.id)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [alert.id, dismissAlert])

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{ top: `${index * 100 + 16}px` }}
      className={`fixed right-4 w-80 glass rounded-xl overflow-hidden border-l-4 ${config.color} z-50`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${config.bg} flex-shrink-0`}>
            <Icon size={14} className={config.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight">{alert.title}</h4>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{alert.message}</p>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => dismissAlert(alert.id)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors font-medium"
          >
            Dismiss
          </button>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="flex-1 text-xs py-1.5 rounded-lg text-black-deep font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            Snooze
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-black-border">
        <motion.div
          className={`h-full ${config.bg.replace('/10', '/60')}`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
    </motion.div>
  )
}

export default function AlertPopup() {
  const alerts = useAlertStore((state) => state.alerts)

  return (
    <AnimatePresence>
      {alerts.map((alert, index) => (
        <AlertItem key={alert.id} alert={alert} index={index} />
      ))}
    </AnimatePresence>
  )
}
