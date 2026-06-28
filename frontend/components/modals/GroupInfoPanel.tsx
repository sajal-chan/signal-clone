"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import Avatar from "@/components/ui/Avatar";
import type { Conversation } from "@/types";

interface Props {
  conversation: Conversation;
  onClose: () => void;
}

export default function GroupInfoPanel({ conversation, onClose }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.name ?? "");
  const [loading, setLoading] = useState(false);

  const isAdmin = conversation.members.find(
    (m) => m.user.id === currentUser?.id
  )?.role === "admin";

  async function saveName() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.patch<Conversation>(`/conversations/${conversation.id}`, {
        name: newName.trim(),
      });
      upsertConversation(data);
      setEditingName(false);
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(userId: number) {
    try {
      await api.delete(`/conversations/${conversation.id}/members/${userId}`);
      const { data } = await api.get<Conversation>(`/conversations/${conversation.id}`);
      upsertConversation(data);
    } catch {
      // silently ignore — no toast system yet
    }
  }

  async function leaveGroup() {
    if (!currentUser) return;
    try {
      await api.delete(`/conversations/${conversation.id}/members/${currentUser.id}`);
      router.push("/");
      onClose();
    } catch {
      // silently ignore — no toast system yet
    }
  }

  return (
    <div className="w-80 flex-shrink-0 bg-signal-sidebar border-l border-signal-divider flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-signal-divider">
        <h2 className="font-semibold text-signal-text-primary">Group Info</h2>
        <button onClick={onClose} className="text-signal-text-secondary hover:text-signal-text-primary">✕</button>
      </div>

      <div className="flex flex-col items-center gap-3 py-6 px-4 border-b border-signal-divider">
        <Avatar name={conversation.name ?? "Group"} size="lg" />
        {editingName ? (
          <div className="flex gap-2 w-full">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 bg-signal-input rounded-lg px-3 py-1.5 text-signal-text-primary text-sm focus:outline-none"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={loading}
              className="text-signal-accent text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-signal-text-primary">{conversation.name}</span>
            {isAdmin && (
              <button onClick={() => { setNewName(conversation.name ?? ""); setEditingName(true); }} className="text-signal-text-secondary hover:text-signal-text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        )}
        <p className="text-sm text-signal-text-secondary">{conversation.members.length} members</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs font-medium text-signal-text-secondary uppercase tracking-wide">Members</p>
        {conversation.members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={member.user.display_name} size="sm" isOnline={member.user.is_online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-signal-text-primary truncate">{member.user.display_name}</p>
              {member.role === "admin" && (
                <p className="text-xs text-signal-accent">Admin</p>
              )}
            </div>
            {isAdmin && member.user.id !== currentUser?.id && (
              <button
                onClick={() => removeMember(member.user.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-signal-divider">
        <button
          onClick={leaveGroup}
          className="w-full py-2.5 rounded-lg border border-red-500 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
        >
          Leave Group
        </button>
      </div>
    </div>
  );
}
