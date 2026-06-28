"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useModalStore } from "@/store/modalStore";
import { socketManager } from "@/lib/socket";
import api from "@/lib/api";
import type { Conversation } from "@/types";
import Sidebar from "@/components/sidebar/Sidebar";
import NewChatModal from "@/components/modals/NewChatModal";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const setConversations = useChatStore((s) => s.setConversations);
  const activeModal = useModalStore((s) => s.activeModal);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    // Open WebSocket
    socketManager.connect(token);

    // Load conversations
    api.get<Conversation[]>("/conversations").then((res) => {
      setConversations(res.data);
    });

    return () => {
      socketManager.disconnect();
    };
  }, [token]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-signal-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      {activeModal === "newChat" && <NewChatModal />}
    </div>
  );
}
