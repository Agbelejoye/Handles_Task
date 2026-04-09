import { Task } from '@/store/taskStore'

export function getAIResponse(userMessage: string, tasks: Task[]): string {
  const msg = userMessage.toLowerCase()

  const incompleteTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)
  const todayTasks = tasks.filter((t) => {
    const deadline = new Date(t.deadline)
    const today = new Date()
    return (
      deadline.getDate() === today.getDate() &&
      deadline.getMonth() === today.getMonth() &&
      deadline.getFullYear() === today.getFullYear()
    )
  })

  if (msg.includes('next') || msg.includes('do next') || msg.includes('should i do')) {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 }
    const sorted = [...incompleteTasks].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    if (sorted.length === 0) {
      return "🎉 Amazing! You have no pending tasks. Take a moment to celebrate your productivity!"
    }
    const top = sorted[0]
    return `🎯 Your next priority should be **"${top.title}"** — it's marked as ${top.priority} priority${top.deadline ? ` and due ${new Date(top.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}. Focus on this first!`
  }

  if (msg.includes('plan') || msg.includes('my day') || msg.includes('today')) {
    if (todayTasks.length === 0) {
      return "📅 You have no tasks scheduled for today. This is a great time to plan ahead or tackle something from your backlog!"
    }
    const taskSummary = todayTasks
      .map((t) => `• ${t.title} (${t.priority}) ${t.completed ? '✅' : '⏳'}`)
      .join('\n')
    return `📋 Here's your plan for today:\n\n${taskSummary}\n\nYou have ${completedTasks.length} completed and ${incompleteTasks.length} remaining. Keep it up!`
  }

  if (msg.includes('break') || msg.includes('behind') || msg.includes('overwhelm') || msg.includes('stress')) {
    return "💪 It's okay to feel overwhelmed sometimes. Remember: progress, not perfection. Take a 5-minute break, breathe deeply, and then tackle one task at a time. You've got this!"
  }

  if (msg.includes('steps') || msg.includes('breakdown') || msg.includes('how to') || msg.includes('break down')) {
    const recentTask = incompleteTasks[0]
    const taskName = recentTask ? recentTask.title : 'your task'
    return `📝 Here's how to break down "${taskName}":\n\n1. **Define the goal** — clarify exactly what "done" looks like\n2. **Gather resources** — collect everything you need before starting\n3. **Start small** — tackle the easiest sub-task first to build momentum\n4. **Review progress** — check in halfway through to adjust your approach\n5. **Finalize & document** — wrap up and note any lessons learned\n\nWant me to help with a specific step?`
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `👋 Hello! I'm here to help you stay productive. You currently have ${incompleteTasks.length} pending tasks. Would you like to know what to tackle next, or would you like to plan your day?`
  }

  if (msg.includes('progress') || msg.includes('how am i doing') || msg.includes('stats')) {
    const total = tasks.length
    const completed = completedTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return `📊 Here's your progress report:\n\n• Total tasks: ${total}\n• Completed: ${completed}\n• Pending: ${incompleteTasks.length}\n• Completion rate: ${percentage}%\n\n${percentage >= 50 ? "🌟 You're doing great! Over halfway there!" : "🚀 Keep pushing — you can do this!"}`
  }

  const motivational = [
    "🌟 Stay focused! Every small step brings you closer to your goals. What task can you complete in the next 25 minutes?",
    "⚡ The secret to getting ahead is getting started. Pick your next task and dive in!",
    "🎯 Focus on progress, not perfection. One completed task at a time builds unstoppable momentum.",
    "🔥 You're capable of more than you think. Let's channel that energy into your next priority task!",
    "💡 Pro tip: Try the Pomodoro technique — 25 minutes focused work, 5 minute break. It's game-changing!",
    "🚀 Productivity isn't about doing more — it's about doing what matters most. What's your top priority right now?",
  ]
  return motivational[Math.floor(Math.random() * motivational.length)]
}
