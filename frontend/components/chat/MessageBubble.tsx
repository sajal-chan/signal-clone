"use client";

import type { Message } from "@/types";
import TickMark from "./TickMark";
import { useChatStore } from "@/store/chatStore";

interface Props {
  message: Message;
  isOwn: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwn }: Props) {
  const status = useChatStore((s) => s.messageStatuses[message.id]);

  if (message.type === "system") {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-signal-text-secondary bg-signal-sidebar px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-1`}>
      {/* Quoted reply */}
      {message.reply_to && (
        <div
          className={`max-w-xs mb-1 px-3 py-1 rounded-lg border-l-4 border-signal-accent bg-black/20 text-xs text-signal-text-secondary ${
            isOwn ? "mr-2" : "ml-2"
          }`}
        >
          <p className="font-medium text-signal-accent">{message.reply_to.sender.display_name}</p>
          <p className="truncate">{message.reply_to.content}</p>
        </div>
      )}

      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-3 py-2 rounded-2xl ${
          isOwn
            ? "bg-signal-bubble-outgoing rounded-br-sm"
            : "bg-signal-bubble-incoming rounded-bl-sm"
        }`}
      >
        {/* Sender name (groups only, shown for others) */}
        {!isOwn && (
          <p className="text-xs font-semibold text-signal-accent mb-0.5">
            {message.sender.display_name}
          </p>
        )}

        <p className="text-sm text-signal-text-primary break-words whitespace-pre-wrap">
          {message.is_deleted ? (
            <span className="italic text-signal-text-secondary">This message was deleted</span>
          ) : (
            message.content
          )}
        </p>

        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className="text-xs text-signal-text-secondary opacity-70">
            {formatTime(message.created_at)}
          </span>
          {isOwn && status && <TickMark status={status} />}
        </div>
      </div>

      {/* Reactions */}
      {message.reactions.length > 0 && (
        <div className={`flex gap-1 flex-wrap mt-1 ${isOwn ? "mr-2" : "ml-2"}`}>
          {Object.entries(
            message.reactions.reduce<Record<string, number>>((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
              return acc;
            }, {})
          ).map(([emoji, count]) => (
            <span
              key={emoji}
              className="text-xs bg-signal-sidebar rounded-full px-2 py-0.5 border border-signal-divider cursor-pointer hover:bg-white/10"
            >
              {emoji} {count > 1 ? count : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
