import { NextRequest } from "next/server";
import { getUserId } from "@/lib/api-helpers";

/**
 * GET /api/realtime – Server-Sent Events stream for real-time updates.
 *
 * Clients subscribe and receive task/progress/alert change events.
 * In production, replace with a managed pub/sub (Redis, Pusher, Supabase Realtime, etc.)
 *
 * TODO: Integrate with a proper pub/sub system for multi-instance deployments.
 */
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", userId })}\n\n`
        )
      );

      // Heartbeat every 30s to keep connection alive
      interval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}\n\n`)
          );
        } catch {
          if (interval) clearInterval(interval);
        }
      }, 30_000);

      // Listen for abort (client disconnect)
      req.signal.addEventListener("abort", () => {
        if (interval) clearInterval(interval);
        controller.close();
      });
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
