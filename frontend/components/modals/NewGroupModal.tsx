"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useModalStore } from "@/store/modalStore";
import { useChatStore } from "@/store/chatStore";
import Avatar from "@/components/ui/Avatar";
import ModalShell from "./ModalShell";
import type { User, Contact, Conversation } from "@/types";

export default function NewGroupModal() {
  const router = useRouter();
  const closeModal = useModalStore((s) => s.closeModal);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [step, setStep] = useState<"members" | "name">("members");
  const [contacts, setContacts] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Contact[]>("/contacts").then((res) => {
      setContacts(res.data.map((c) => c.contact_user));
    });
  }, []);

  function toggleUser(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createGroup() {
    if (!groupName.trim() || selected.size === 0) return;
    setLoading(true);
    try {
      const { data } = await api.post<Conversation>("/conversations", {
        type: "group",
        name: groupName.trim(),
        member_ids: [...selected],
      });
      upsertConversation(data);
      closeModal();
      router.push(`/chat/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell>
      <div className="p-4 border-b border-signal-divider flex items-center justify-between">
        <h2 className="text-lg font-semibold text-signal-text-primary">
          {step === "members" ? "Add Members" : "Group Name"}
        </h2>
        <button onClick={closeModal} className="text-signal-text-secondary hover:text-signal-text-primary">✕</button>
      </div>

      {step === "members" ? (
        <>
          <div className="max-h-72 overflow-y-auto">
            {contacts.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <Avatar name={user.display_name} size="sm" />
                <span className="flex-1 text-left text-sm text-signal-text-primary">{user.display_name}</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected.has(user.id)
                      ? "bg-signal-accent border-signal-accent"
                      : "border-signal-text-secondary"
                  }`}
                >
                  {selected.has(user.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-signal-divider">
            <button
              onClick={() => setStep("name")}
              disabled={selected.size === 0}
              className="w-full bg-signal-accent hover:bg-blue-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Next ({selected.size} selected)
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-4">
          <input
            autoFocus
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            placeholder="Group name"
            className="w-full bg-signal-input rounded-lg px-4 py-3 text-signal-text-primary placeholder-signal-text-secondary focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStep("members")}
              className="flex-1 border border-signal-divider text-signal-text-secondary hover:text-signal-text-primary py-2.5 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || loading}
              className="flex-1 bg-signal-accent hover:bg-blue-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
