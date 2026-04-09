'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTaskStore, Task } from '@/store/taskStore'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  editTask?: Task | null
}

export default function TaskForm({ isOpen, onClose, editTask }: TaskFormProps) {
  const { addTask, updateTask } = useTaskStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [deadline, setDeadline] = useState('')
  const [tags, setTags] = useState('')
  const [type, setType] = useState<'Daily' | 'One-time' | 'Recurring'>('One-time')

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description)
      setPriority(editTask.priority)
      setDeadline(editTask.deadline ? editTask.deadline.slice(0, 16) : '')
      setTags(editTask.tags.join(', '))
      setType(editTask.type)
    } else {
      setTitle('')
      setDescription('')
      setPriority('Medium')
      setDeadline('')
      setTags('')
      setType('One-time')
    }
  }, [editTask, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      type,
      completed: editTask?.completed ?? false,
    }

    if (editTask) {
      updateTask(editTask.id, taskData)
    } else {
      addTask(taskData)
    }
    onClose()
  }

  const inputClass =
    'w-full bg-black-deep border border-black-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60 transition-colors placeholder-gray-600'
  const labelClass = 'block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative glass rounded-2xl p-6 w-full max-w-md z-10"
            style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    className={inputClass}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    className={inputClass}
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Daily' | 'One-time' | 'Recurring')}
                  >
                    <option value="One-time">One-time</option>
                    <option value="Daily">Daily</option>
                    <option value="Recurring">Recurring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Deadline</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Tags (comma-separated)</label>
                <input
                  className={inputClass}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, urgent, review..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)', color: '#0B0B0B' }}
              >
                {editTask ? 'Save Changes' : 'Create Task'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
