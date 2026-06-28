"use client";

import { usePathname } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useModalStore } from "@/store/modalStore";
import ConversationItem from "./ConversationItem";

export default function Sidebar() {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const openModal = useModalStore((s) => s.openModal);
  const pathname = usePathname();

  // Derive active conversation id from URL if store not set
  const activeFromUrl = pathname.startsWith("/chat/")
    ? parseInt(pathname.split("/chat/")[1], 10)
    : null;

  const currentActiveId = activeId ?? activeFromUrl;

  return (
    <aside className="w-full md:w-[360px] flex-shrink-0 bg-signal-sidebar flex flex-col border-r border-signal-divider">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-signal-divider">
        <h1 className="text-xl font-semibold text-signal-text-primary">Signal</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors"
            title="New chat"
            onClick={() => openModal("newChat")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors"
            title="New group"
            onClick={() => openModal("newGroup")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-center text-signal-text-secondary text-sm py-8">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentActiveId}
            />
          ))
        )}
      </div>

      {/* Bottom nav placeholder */}
      <div className="border-t border-signal-divider px-4 py-3 flex items-center gap-3">
        <a href="/settings" className="p-2 rounded-full hover:bg-white/10 text-signal-text-secondary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </a>
      </div>
    </aside>
  );
}
