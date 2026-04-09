import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { AIChatSchema } from "@/lib/schemas";
import { ok, handleError, getUserId } from "@/lib/api-helpers";
import { getAIResponse } from "@/lib/ai";

// POST /api/ai – AI chat endpoint
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { message, conversationId } = AIChatSchema.parse(body);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    // Build context
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId,
        recordedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      take: 20,
    });

    const activeFocusSession = await prisma.focusSession.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    const conversationHistory = (conversation.messages ?? []).map((m: { role: string; content: string }) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Get AI response
    const assistantContent = await getAIResponse(message, {
      tasks,
      recentActivity,
      activeFocusSession,
      conversationHistory,
    });

    // Persist messages
    await prisma.aIMessage.createMany({
      data: [
        { conversationId: conversation.id, role: "USER", content: message },
        { conversationId: conversation.id, role: "ASSISTANT", content: assistantContent },
      ],
    });

    // Update conversation title if first message
    if ((conversation.messages ?? []).length === 0) {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { title: message.slice(0, 50) },
      });
    }

    return ok({
      conversationId: conversation.id,
      message: assistantContent,
    });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/ai – get conversation history
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const conversationId = req.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      return ok(conversation);
    }

    // List recent conversations
    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return ok(conversations);
  } catch (err) {
    return handleError(err);
  }
}
