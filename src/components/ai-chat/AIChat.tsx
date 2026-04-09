"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SUGGESTIONS = [
  "What should I do next?",
  "Plan my day",
  "How am I doing?",
  "Should I take a break?",
];

export function AIChat() {
  const { messages, sending, conversationId, addMessage, setConversationId, setSending } =
    useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    // Optimistic add
    addMessage({
      id: `tmp-${Date.now()}`,
      role: "USER",
      content,
      createdAt: new Date(),
    });

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversationId }),
      });
      const json = await res.json();
      if (json.success) {
        if (!conversationId) setConversationId(json.data.conversationId);
        addMessage({
          id: `ai-${Date.now()}`,
          role: "ASSISTANT",
          content: json.data.message,
          createdAt: new Date(),
        });
      }
    } catch {
      addMessage({
        id: `err-${Date.now()}`,
        role: "ASSISTANT",
        content: "⚠ I'm having trouble connecting. Please try again.",
        createdAt: new Date(),
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="AI Assistant"
        icon={<span>🤖</span>}
        subtitle={process.env.NEXT_PUBLIC_AI_MODE === "mock" ? "Mock AI" : "Powered by AI"}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 mb-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-2xl">
              🤖
            </div>
            <p className="text-white/50 text-sm text-center">
              Ask me anything about your tasks, schedule, or productivity.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#D4AF37]/20 text-[#D4AF37]/70 hover:bg-[#D4AF37]/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "USER"
                      ? "bg-[#D4AF37]/20 text-white border border-[#D4AF37]/20"
                      : "bg-white/5 text-white/90 border border-white/10"
                  }`}
                >
                  {msg.role === "ASSISTANT" ? (
                    <MarkdownMessage content={msg.content} />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/60 resize-none"
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          loading={sending}
          size="md"
          className="self-end"
        >
          Send
        </Button>
      </div>
    </Card>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-[#D4AF37]/60 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, delay, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// Very simple markdown-like renderer (bold + newlines)
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-[#D4AF37]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
