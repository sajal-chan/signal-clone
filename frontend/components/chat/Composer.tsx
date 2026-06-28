"use client";

import { useState, useRef, useEffect } from "react";
import { socketManager } from "@/lib/socket";

interface Props {
  conversationId: number;
  replyTo?: { id: number; content: string; senderName: string } | null;
  onClearReply?: () => void;
}

export default function Composer({ conversationId, replyTo, onClearReply }: Props) {
  const [content, setContent] = useState("");
  const typingRef = useRef(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);

    // Typing indicator
    if (!typingRef.current) {
      typingRef.current = true;
      socketManager.send({ type: "typing:start", conversation_id: conversationId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
      socketManager.send({ type: "typing:stop", conversation_id: conversationId });
    }, 2000);
  }

  function send() {
    const text = content.trim();
    if (!text) return;
    socketManager.send({
      type: "message:send",
      conversation_id: conversationId,
      content: text,
      reply_to_id: replyTo?.id ?? null,
    });
    setContent("");
    onClearReply?.();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingRef.current = false;
    socketManager.send({ type: "typing:stop", conversation_id: conversationId });
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [content]);

  return (
    <div className="flex-shrink-0 border-t border-signal-divider bg-signal-sidebar px-4 py-3">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-signal-bg rounded-lg border-l-4 border-signal-accent">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-signal-accent">{replyTo.senderName}</p>
            <p className="text-xs text-signal-text-secondary truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onClearReply}
            className="text-signal-text-secondary hover:text-signal-text-primary"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          className="flex-1 bg-signal-input resize-none rounded-2xl px-4 py-2.5 text-sm text-signal-text-primary placeholder-signal-text-secondary focus:outline-none max-h-[120px] overflow-y-auto"
        />
        <button
          onClick={send}
          disabled={!content.trim()}
          className="p-2.5 bg-signal-accent rounded-full disabled:opacity-40 hover:bg-blue-500 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
