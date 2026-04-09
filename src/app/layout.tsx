import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Handler AI – Intelligent Task Management",
  description:
    "Real-time AI-powered task management. Track tasks, chat with AI, monitor focus sessions, and stay on top of your day.",
  keywords: ["task management", "AI assistant", "productivity", "focus", "pomodoro"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0B0B0B] text-white">
        {children}
      </body>
    </html>
  );
}
