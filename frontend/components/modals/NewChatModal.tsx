"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useModalStore } from "@/store/modalStore";
import { useChatStore } from "@/store/chatStore";
import Avatar from "@/components/ui/Avatar";
import ModalShell from "./ModalShell";
import type { User, Contact, Conversation } from "@/types";

export default function NewChatModal() {
  const router = useRouter();
  const closeModal = useModalStore((s) => s.closeModal);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Contact[]>("/contacts").then((res) => {
      setContacts(res.data.map((c) => c.contact_user));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`).then((res) => {
        setSearchResults(res.data);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function startChat(userId: number) {
    setLoading(true);
    try {
      const { data } = await api.post<Conversation>("/conversations", {
        type: "direct",
        member_ids: [userId],
      });
      upsertConversation(data);
      closeModal();
      router.push(`/chat/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  const displayList = query.trim() ? searchResults : contacts;

  return (
    <ModalShell>
      <div className="p-4 border-b border-signal-divider flex items-center justify-between">
        <h2 className="text-lg font-semibold text-signal-text-primary">New Message</h2>
        <button onClick={closeModal} className="text-signal-text-secondary hover:text-signal-text-primary">✕</button>
      </div>
      <div className="p-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts or users…"
          className="w-full bg-signal-input rounded-lg px-4 py-2 text-sm text-signal-text-primary placeholder-signal-text-secondary focus:outline-none"
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        {displayList.length === 0 && (
          <p className="text-center text-signal-text-secondary text-sm py-6">
            {query ? "No users found" : "No contacts yet"}
          </p>
        )}
        {displayList.map((user) => (
          <button
            key={user.id}
            disabled={loading}
            onClick={() => startChat(user.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <Avatar name={user.display_name} size="sm" isOnline={user.is_online} />
            <div className="text-left">
              <p className="text-sm font-medium text-signal-text-primary">{user.display_name}</p>
              <p className="text-xs text-signal-text-secondary">@{user.username}</p>
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
