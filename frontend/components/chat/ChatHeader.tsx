"use client";

import Avatar from "@/components/ui/Avatar";
import type { Conversation } from "@/types";

interface Props {
  conversation: Conversation;
  onGroupInfoClick?: () => void;
}

function formatLastSeen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function ChatHeader({ conversation, onGroupInfoClick }: Props) {
  const isGroup = conversation.type === "group";
  const name = isGroup
    ? (conversation.name ?? "Group")
    : (conversation.other_user?.display_name ?? "Unknown");

  const subtitle = isGroup
    ? `${conversation.members.length} members`
    : conversation.other_user?.is_online
    ? "online"
    : `last seen ${formatLastSeen(conversation.other_user?.last_seen ?? "")}`;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-signal-divider bg-signal-sidebar flex-shrink-0">
      <div className="flex items-center gap-3">
        <Avatar
          name={name}
          size="md"
          isOnline={isGroup ? undefined : conversation.other_user?.is_online}
        />
        <div>
          <p className="font-semibold text-signal-text-primary">{name}</p>
          <p className="text-xs text-signal-text-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Coming soon: video call */}
        <button className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors" title="Video call">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        {/* Coming soon: voice call */}
        <button className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors" title="Voice call">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
        {isGroup && (
          <button className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors" title="Group info" onClick={onGroupInfoClick}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
