import { create } from "zustand";
import type { Conversation, Message, Reaction } from "@/types";

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>; // conversationId → messages array
  typingUsers: Record<number, Set<number>>; // conversationId → set of user IDs
  activeConversationId: number | null;

  setConversations: (convs: Conversation[]) => void;
  upsertConversation: (conv: Conversation) => void;
  setActiveConversation: (id: number | null) => void;
  setMessages: (conversationId: number, msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  updateMessageReactions: (messageId: number, reactions: Reaction[]) => void;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  setUserOnline: (userId: number, isOnline: boolean, lastSeen: string) => void;
  incrementUnread: (conversationId: number) => void;
  clearUnread: (conversationId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  typingUsers: {},
  activeConversationId: null,

  setConversations: (convs) => set({ conversations: convs }),

  upsertConversation: (conv) =>
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conv.id);
      if (idx >= 0) {
        const updated = [...state.conversations];
        updated[idx] = conv;
        return { conversations: updated };
      }
      return { conversations: [conv, ...state.conversations] };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: msgs } })),

  appendMessage: (msg) =>
    set((state) => {
      const existing = state.messages[msg.conversation_id] ?? [];
      // Deduplicate by id
      if (existing.some((m) => m.id === msg.id)) return state;
      const updated = [...existing, msg];
      // Update conversation last_message + sort
      const convs = state.conversations.map((c) =>
        c.id === msg.conversation_id
          ? {
              ...c,
              last_message: {
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                created_at: msg.created_at,
              },
              last_message_at: msg.created_at,
            }
          : c
      );
      convs.sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
      return {
        messages: { ...state.messages, [msg.conversation_id]: updated },
        conversations: convs,
      };
    }),

  updateMessageReactions: (messageId, reactions) =>
    set((state) => {
      const updatedMessages = { ...state.messages };
      for (const convId of Object.keys(updatedMessages)) {
        const msgs = updatedMessages[Number(convId)];
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx >= 0) {
          const updated = [...msgs];
          updated[idx] = { ...updated[idx], reactions };
          updatedMessages[Number(convId)] = updated;
          break;
        }
      }
      return { messages: updatedMessages };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingUsers[conversationId] ?? []);
      if (isTyping) {
        current.add(userId);
      } else {
        current.delete(userId);
      }
      return { typingUsers: { ...state.typingUsers, [conversationId]: current } };
    }),

  setUserOnline: (userId, isOnline, lastSeen) =>
    set((state) => {
      const convs = state.conversations.map((c) => ({
        ...c,
        members: c.members.map((m) =>
          m.user.id === userId
            ? { ...m, user: { ...m.user, is_online: isOnline, last_seen: lastSeen } }
            : m
        ),
        other_user:
          c.other_user?.id === userId
            ? { ...c.other_user, is_online: isOnline, last_seen: lastSeen }
            : c.other_user,
      }));
      return { conversations: convs };
    }),

  incrementUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),
}));
