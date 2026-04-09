'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import TaskList from '@/components/TaskList'
import ChatPanel from '@/components/ChatPanel'
import ProgressBar from '@/components/ProgressBar'
import AlertPopup from '@/components/AlertPopup'
import TaskForm from '@/components/TaskForm'
import { useTaskStore } from '@/store/taskStore'

export default function Dashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const tasks = useTaskStore((state) => state.tasks)
  const completed = tasks.filter((t) => t.completed).length
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <AlertPopup />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 lg:w-[60%] space-y-4">
          <DashboardHeader />
          <div className="glass rounded-2xl p-5">
            <ProgressBar
              value={progress}
              label="Daily Progress"
              showPercentage
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              {completed} of {tasks.length} tasks completed today
            </p>
          </div>
          <TaskList />
        </div>

        {/* Right column */}
        <div className="lg:w-[40%] lg:sticky lg:top-8 lg:self-start lg:h-[calc(100vh-4rem)]">
          <ChatPanel />
        </div>
      </div>

      {/* Floating Add Task Button */}
      <motion.button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
          boxShadow: '0 0 24px rgba(212, 175, 55, 0.4)',
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 32px rgba(212, 175, 55, 0.6)' }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={24} className="text-black-deep" strokeWidth={2.5} />
      </motion.button>

      <TaskForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </main>
  )
}
