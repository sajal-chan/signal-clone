"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { socketManager } from "@/lib/socket";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import type { Conversation, Message } from "@/types";

interface Props {
  conversation: Conversation;
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-signal-divider" />
      <span className="text-xs text-signal-text-secondary">{label}</span>
      <div className="flex-1 h-px bg-signal-divider" />
    </div>
  );
}

function shouldShowDateSeparator(prev: Message | undefined, curr: Message) {
  if (!prev) return true;
  return new Date(prev.created_at).toDateString() !== new Date(curr.created_at).toDateString();
}

export default function MessageList({ conversation }: Props) {
  const messages = useChatStore((s) => s.messages[conversation.id] ?? []);
  const typingUsers = useChatStore((s) => s.typingUsers[conversation.id] ?? new Set());
  const currentUser = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages if already near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom || messages.length <= 50) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Mark last message as read when conversation is active
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender_id === currentUser?.id) return;
    socketManager.send({
      type: "message:read",
      conversation_id: conversation.id,
      message_id: lastMsg.id,
    });
  }, [messages.length, conversation.id]);

  const typingNames = [...typingUsers]
    .map((uid) => conversation.members.find((m) => m.user.id === uid)?.user.display_name)
    .filter(Boolean) as string[];

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
      {messages.map((msg, idx) => (
        <div key={msg.id}>
          {shouldShowDateSeparator(messages[idx - 1], msg) && (
            <DateSeparator date={msg.created_at} />
          )}
          <MessageBubble message={msg} isOwn={msg.sender_id === currentUser?.id} />
        </div>
      ))}
      <TypingIndicator names={typingNames} />
      <div ref={bottomRef} />
    </div>
  );
}
