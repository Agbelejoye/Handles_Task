import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export interface Task {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
  deadline: string
  tags: string[]
  type: 'Daily' | 'One-time' | 'Recurring'
  completed: boolean
  createdAt: string
}

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
}

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Review project proposal',
    description: 'Go through the Q4 project proposal and provide feedback',
    priority: 'High',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    tags: ['work', 'review'],
    type: 'One-time',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Morning workout',
    description: '30 minutes cardio + strength training',
    priority: 'Medium',
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    tags: ['health', 'fitness'],
    type: 'Daily',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update the API docs for the new endpoints',
    priority: 'Low',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tags: ['work', 'docs'],
    type: 'One-time',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Weekly team sync',
    description: 'Prepare agenda and run the weekly team meeting',
    priority: 'High',
    deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    tags: ['work', 'meeting'],
    type: 'Recurring',
    completed: false,
    createdAt: new Date().toISOString(),
  },
]

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: sampleTasks,
  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  toggleComplete: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
}))
