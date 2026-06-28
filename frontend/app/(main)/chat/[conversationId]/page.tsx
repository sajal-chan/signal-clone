"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { notFound } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import Composer from "@/components/chat/Composer";
import GroupInfoPanel from "@/components/modals/GroupInfoPanel";
import type { Message, Conversation } from "@/types";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ChatPage({ params }: Props) {
  const { conversationId } = use(params);
  const convId = parseInt(conversationId, 10);

  const conversations = useChatStore((s) => s.conversations);
  const setMessages = useChatStore((s) => s.setMessages);
  const setActive = useChatStore((s) => s.setActiveConversation);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const user = useAuthStore((s) => s.user);

  const conversation: Conversation | undefined = conversations.find((c) => c.id === convId);
  const messages = useChatStore((s) => s.messages[convId]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    setActive(convId);
    clearUnread(convId);
    if (!messages) {
      api.get<Message[]>(`/conversations/${convId}/messages`).then((res) => {
        setMessages(convId, res.data);
        // Seed initial "sent" status for own messages (real upgrades come via WS events)
        if (user) {
          const { updateMessageStatus } = useChatStore.getState();
          for (const msg of res.data) {
            if (msg.sender_id === user.id) {
              updateMessageStatus(msg.id, "sent");
            }
          }
        }
      });
    }
    return () => setActive(null);
  }, [convId]);

  if (!conversation) {
    // Conversations may still be loading; show nothing until ready
    if (conversations.length === 0) return null;
    return notFound();
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          conversation={conversation}
          onGroupInfoClick={() => setShowGroupInfo((v) => !v)}
        />
        <MessageList conversation={conversation} />
        <Composer conversationId={convId} />
      </div>
      {showGroupInfo && conversation.type === "group" && (
        <GroupInfoPanel
          conversation={conversation}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
}
