import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Task Handler AI',
  description: 'AI-powered task management dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0B0B0B', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
