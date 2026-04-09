import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatStore {
  messages: Message[]
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearChat: () => void
}

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI productivity assistant. I can help you prioritize tasks, plan your day, or break down complex tasks into steps. What would you like to do?",
  timestamp: new Date().toISOString(),
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [welcomeMessage],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  clearChat: () => set({ messages: [welcomeMessage] }),
}))
