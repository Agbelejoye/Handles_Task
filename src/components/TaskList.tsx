'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Check, Clock, Tag } from 'lucide-react'
import { useTaskStore, Task } from '@/store/taskStore'
import { formatDeadline, getPriorityColor, sortTasks } from '@/lib/utils'
import TaskForm from './TaskForm'

export default function TaskList() {
  const { tasks, deleteTask, toggleComplete } = useTaskStore()
  const [filter, setFilter] = useState<'All' | 'Daily' | 'Completed'>('All')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filtered = sortTasks(
    tasks.filter((t) => {
      if (filter === 'Daily') return t.type === 'Daily'
      if (filter === 'Completed') return t.completed
      return true
    })
  )

  return (
    <>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <div className="flex gap-1 text-xs">
            {(['All', 'Daily', 'Completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  filter === f
                    ? 'bg-gold text-black-deep font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500 text-sm"
              >
                No tasks here. Add one!
              </motion.div>
            )}
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => {
                  setEditTask(task)
                  setIsFormOpen(true)
                }}
                onDelete={() => deleteTask(task.id)}
                onToggle={() => toggleComplete(task.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditTask(null)
        }}
        editTask={editTask}
      />
    </>
  )
}

interface TaskCardProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

function TaskCard({ task, onEdit, onDelete, onToggle }: TaskCardProps) {
  const priorityClass = getPriorityColor(task.priority)
  const isOverdue = new Date(task.deadline) < new Date() && !task.completed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.005 }}
      className="group relative bg-black-card rounded-xl p-4 border border-black-border hover:border-gold/30 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? 'bg-gold border-gold'
              : 'border-gray-600 hover:border-gold/60'
          }`}
        >
          {task.completed && <Check size={10} className="text-black-deep" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-medium leading-snug ${
                task.completed ? 'line-through text-gray-500' : 'text-white'
              }`}
            >
              {task.title}
            </h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gold hover:bg-gold/10 transition-all"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityClass}`}
            >
              {task.priority}
            </span>
            <span className="text-[11px] text-gray-500 px-2 py-0.5 rounded-full bg-white/5">
              {task.type}
            </span>
            <span
              className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}
            >
              <Clock size={10} />
              {formatDeadline(task.deadline)}
            </span>
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[11px] text-gray-600 flex items-center gap-0.5">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
