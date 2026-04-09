export function formatDeadline(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff < 0) return 'Overdue'
  if (diff < 60 * 60 * 1000) {
    const mins = Math.round(diff / (60 * 1000))
    return `${mins}m left`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.round(diff / (60 * 60 * 1000))
    return `${hours}h left`
  }
  const days = Math.round(diff / (24 * 60 * 60 * 1000))
  return `${days}d left`
}

export function getPriorityColor(priority: 'Low' | 'Medium' | 'High'): string {
  switch (priority) {
    case 'High':
      return 'text-red-400 bg-red-400/10 border-red-400/30'
    case 'Medium':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    case 'Low':
      return 'text-green-400 bg-green-400/10 border-green-400/30'
  }
}

export function sortTasks<T extends { priority: 'Low' | 'Medium' | 'High'; deadline: string; completed: boolean }>(
  tasks: T[]
): T[] {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 }
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })
}
