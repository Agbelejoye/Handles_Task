"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskList } from "@/components/tasks/TaskList";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { AIChat } from "@/components/ai-chat/AIChat";
import { FocusPanel } from "@/components/focus/FocusPanel";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { ActivityInsights } from "@/components/activity/ActivityInsights";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0B]">
      <DashboardHeader />

      <main className="flex-1 p-4 lg:p-6 overflow-hidden">
        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full max-w-[1600px] mx-auto">
          {/* Left column – Tasks (large) */}
          <div className="lg:col-span-4 min-h-[400px] lg:min-h-0 lg:h-[calc(100vh-120px)]">
            <TaskList />
          </div>

          {/* Center column – Progress + Focus + Activity */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <ProgressOverview />
            <FocusPanel />
            <ActivityInsights />
          </div>

          {/* Right column – AI Chat + Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex-1 min-h-[350px] lg:min-h-0 lg:h-[calc(60vh-60px)]">
              <AIChat />
            </div>
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
