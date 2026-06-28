"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useModalStore } from "@/store/modalStore";
import { socketManager } from "@/lib/socket";
import api from "@/lib/api";
import type { Conversation } from "@/types";
import Sidebar from "@/components/sidebar/Sidebar";
import NewChatModal from "@/components/modals/NewChatModal";
import NewGroupModal from "@/components/modals/NewGroupModal";
import ComingSoonModal from "@/components/modals/ComingSoonModal";
import ToastContainer from "@/components/ui/Toast";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const setConversations = useChatStore((s) => s.setConversations);
  const activeModal = useModalStore((s) => s.activeModal);
  const router = useRouter();
  const pathname = usePathname();

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

  const isInChat = pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen overflow-hidden bg-signal-bg">
      <div className={isInChat ? "hidden md:flex" : "flex w-full md:w-auto"}>
        <Sidebar />
      </div>
      <main key={pathname} className={`flex-1 flex-col overflow-hidden animate-in fade-in ${isInChat ? "flex" : "hidden md:flex"}`}>
        {children}
      </main>
      {activeModal === "newChat" && <NewChatModal />}
      {activeModal === "newGroup" && <NewGroupModal />}
      {activeModal === "comingSoon" && <ComingSoonModal />}
      <ToastContainer />
    </div>
  );
}
