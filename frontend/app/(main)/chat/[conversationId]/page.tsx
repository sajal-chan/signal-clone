"use client";

import { useEffect } from "react";
import { use } from "react";
import { notFound } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import api from "@/lib/api";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import Composer from "@/components/chat/Composer";
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

  const conversation: Conversation | undefined = conversations.find((c) => c.id === convId);
  const messages = useChatStore((s) => s.messages[convId]);

  useEffect(() => {
    setActive(convId);
    if (!messages) {
      api.get<Message[]>(`/conversations/${convId}/messages`).then((res) => {
        setMessages(convId, res.data);
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
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} />
      <MessageList conversation={conversation} />
      <Composer conversationId={convId} />
    </div>
  );
}
