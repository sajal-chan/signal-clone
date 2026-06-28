"use client";

import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import Avatar from "@/components/ui/Avatar";
import type { Conversation } from "@/types";

interface Props {
  conversation: Conversation;
  isActive: boolean;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationItem({ conversation, isActive }: Props) {
  const router = useRouter();
  const setActive = useChatStore((s) => s.setActiveConversation);
  const currentUser = useAuthStore((s) => s.user);

  const displayName =
    conversation.type === "direct"
      ? (conversation.other_user?.display_name ?? "Unknown")
      : (conversation.name ?? "Group");

  const avatarName = displayName;
  const isOnline =
    conversation.type === "direct" ? conversation.other_user?.is_online : undefined;

  const lastMsg = conversation.last_message;
  const preview = lastMsg
    ? lastMsg.sender_id === currentUser?.id
      ? `You: ${lastMsg.content}`
      : lastMsg.content
    : "No messages yet";

  function handleClick() {
    setActive(conversation.id);
    router.push(`/chat/${conversation.id}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
        isActive ? "bg-white/10" : ""
      }`}
    >
      <Avatar name={avatarName} size="md" isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-signal-text-primary truncate">{displayName}</span>
          <span className="text-xs text-signal-text-secondary flex-shrink-0 ml-2">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-sm text-signal-text-secondary truncate">{preview}</span>
          {conversation.unread_count > 0 && (
            <span className="ml-2 flex-shrink-0 bg-signal-online text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
