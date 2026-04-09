/**
 * Prisma seed – creates demo data for local development.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo-user-001";

async function main() {
  console.log("🌱 Seeding database…");

  // Upsert demo user
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@taskhandler.ai",
      name: "Demo User",
      activityTrackingOptIn: true,
    },
  });

  // Clear existing demo data
  await prisma.task.deleteMany({ where: { userId: DEMO_USER_ID } });
  await prisma.alert.deleteMany({ where: { userId: DEMO_USER_ID } });
  await prisma.activityLog.deleteMany({ where: { userId: DEMO_USER_ID } });

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Review AI research papers",
        description: "Read and summarize 3 papers on LLM architectures",
        type: "DAILY",
        priority: "HIGH",
        tags: ["research", "ai"],
        estimatedMinutes: 90,
        status: "IN_PROGRESS",
        deadline: todayEnd,
      },
    }),
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Write project proposal",
        description: "Draft the Q2 project proposal doc",
        type: "ONE_TIME",
        priority: "HIGH",
        tags: ["work"],
        estimatedMinutes: 60,
        status: "PENDING",
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      },
    }),
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Morning workout",
        type: "RECURRING",
        priority: "MEDIUM",
        tags: ["health"],
        estimatedMinutes: 30,
        status: "COMPLETED",
        recurringDays: [1, 2, 3, 4, 5],
        completedAt: new Date(),
      },
    }),
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Update task handler codebase",
        description: "Implement new features from the PRD",
        type: "ONE_TIME",
        priority: "HIGH",
        tags: ["development"],
        estimatedMinutes: 180,
        status: "IN_PROGRESS",
      },
    }),
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Read 30 pages",
        type: "DAILY",
        priority: "LOW",
        tags: ["personal", "learning"],
        estimatedMinutes: 45,
        status: "PENDING",
      },
    }),
    prisma.task.create({
      data: {
        userId: DEMO_USER_ID,
        title: "Team standup notes",
        type: "RECURRING",
        priority: "MEDIUM",
        tags: ["work"],
        estimatedMinutes: 15,
        status: "COMPLETED",
        recurringDays: [1, 2, 3, 4, 5],
        completedAt: new Date(),
      },
    }),
  ]);

  // Add an AI conversation
  const conv = await prisma.aIConversation.create({
    data: {
      userId: DEMO_USER_ID,
      title: "Plan my day",
    },
  });

  await prisma.aIMessage.createMany({
    data: [
      {
        conversationId: conv.id,
        role: "USER",
        content: "Plan my day",
      },
      {
        conversationId: conv.id,
        role: "ASSISTANT",
        content:
          "Looking at your current workload:\n\nI suggest tackling these first:\n1. **Write project proposal** 🔴\n2. **Review AI research papers** 🔴\n3. **Update task handler codebase** 🔴\n\nYou're at **33%** for the day. There's still a good chunk to go — break tasks into 25-min focus blocks.",
      },
    ],
  });

  // Add sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        domain: "github.com",
        title: "Handles_Task repository",
        durationSec: 1800,
        taskId: tasks[3].id,
      },
      {
        userId: DEMO_USER_ID,
        domain: "arxiv.org",
        title: "Attention Is All You Need",
        durationSec: 2400,
        taskId: tasks[0].id,
      },
      {
        userId: DEMO_USER_ID,
        domain: "notion.so",
        title: "Project proposal",
        durationSec: 900,
        taskId: tasks[1].id,
      },
      {
        userId: DEMO_USER_ID,
        domain: "youtube.com",
        title: "Music playlist",
        durationSec: 600,
      },
    ],
  });

  // Add a break reminder alert
  await prisma.alert.create({
    data: {
      userId: DEMO_USER_ID,
      type: "BREAK_REMINDER",
      title: "Break Time ⏸",
      message: "You've been working for a while. Take a 5-minute break to recharge.",
    },
  });

  console.log(`✅ Seeded ${tasks.length} tasks, 1 conversation, 4 activity logs, 1 alert.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
