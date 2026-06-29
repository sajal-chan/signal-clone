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
  onReply: (msg: Message) => void;
}

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING: number[] = [];

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

export default function MessageList({ conversation, onReply }: Props) {
  const messages = useChatStore((s) => s.messages[conversation.id] ?? EMPTY_MESSAGES);
  const typingUsers = useChatStore((s) => s.typingUsers[conversation.id] ?? EMPTY_TYPING);
  const currentUser = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Tracks whether the user was at the bottom BEFORE a new message rendered
  const isAtBottomRef = useRef(true);

  // Keep isAtBottomRef up to date as the user scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      isAtBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // Jump to bottom instantly when switching conversations
  useEffect(() => {
    isAtBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [conversation.id]);

  // Scroll to bottom on new message if the user was already at the bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
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
          <MessageBubble message={msg} isOwn={msg.sender_id === currentUser?.id} onReply={onReply} />
        </div>
      ))}
      <TypingIndicator names={typingNames} />
      <div ref={bottomRef} />
    </div>
  );
}
