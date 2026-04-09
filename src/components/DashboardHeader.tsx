'use client'

import { useTaskStore } from '@/store/taskStore'

export default function DashboardHeader() {
  const tasks = useTaskStore((state) => state.tasks)
  const completed = tasks.filter((t) => t.completed).length
  const pending = tasks.filter((t) => !t.completed).length

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mb-6">
      <h1
        className="text-3xl font-bold mb-1"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Task Handler AI
      </h1>
      <p className="text-gray-400 text-sm mb-4">{today}</p>
      <div className="flex gap-4 flex-wrap">
        <div className="glass rounded-xl px-4 py-3 flex-1 min-w-[80px] text-center">
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-xs text-gray-400 mt-1">Total</div>
        </div>
        <div className="glass rounded-xl px-4 py-3 flex-1 min-w-[80px] text-center">
          <div className="text-2xl font-bold text-gold">{completed}</div>
          <div className="text-xs text-gray-400 mt-1">Completed</div>
        </div>
        <div className="glass rounded-xl px-4 py-3 flex-1 min-w-[80px] text-center">
          <div className="text-2xl font-bold text-white">{pending}</div>
          <div className="text-xs text-gray-400 mt-1">Pending</div>
        </div>
      </div>
    </div>
  )
}
