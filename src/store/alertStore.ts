import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export interface Alert {
  id: string
  type: 'deadline' | 'focus' | 'break' | 'sleep'
  title: string
  message: string
  taskId?: string
}

interface AlertStore {
  alerts: Alert[]
  addAlert: (alert: Omit<Alert, 'id'>) => void
  dismissAlert: (id: string) => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [
    {
      id: 'sample-alert-1',
      type: 'deadline',
      title: 'Deadline Approaching',
      message: 'Your task "Review project proposal" is due in 2 hours.',
      taskId: '1',
    },
  ],
  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id: generateId() }],
    })),
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}))
