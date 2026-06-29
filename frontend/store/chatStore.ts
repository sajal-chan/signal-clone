import { create } from "zustand";
import type { Conversation, Message, Reaction } from "@/types";

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>; // conversationId → messages array
  typingUsers: Record<number, number[]>; // conversationId → array of user IDs
  activeConversationId: number | null;

  setConversations: (convs: Conversation[]) => void;
  upsertConversation: (conv: Conversation) => void;
  setActiveConversation: (id: number | null) => void;
  setMessages: (conversationId: number, msgs: Message[]) => void;
  appendMessage: (msg: Message, currentUserId?: number) => void;
  updateMessageReactions: (conversationId: number, messageId: number, reactions: Reaction[]) => void;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  setUserOnline: (userId: number, isOnline: boolean, lastSeen: string) => void;
  incrementUnread: (conversationId: number) => void;
  clearUnread: (conversationId: number) => void;
  messageStatuses: Record<number, "sent" | "delivered" | "read">; // messageId → status
  updateMessageStatus: (messageId: number, status: "sent" | "delivered" | "read") => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  typingUsers: {},
  activeConversationId: null,
  messageStatuses: {},

  setConversations: (convs) => set({ conversations: convs }),

  // Issue 8: sort after every upsert so the list order is always consistent
  upsertConversation: (conv) =>
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conv.id);
      const list =
        idx >= 0
          ? state.conversations.map((c, i) => (i === idx ? conv : c))
          : [conv, ...state.conversations];
      list.sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
      return { conversations: list };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  // Issue 1: merge server snapshot with any WS messages that arrived concurrently
  setMessages: (conversationId, msgs) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const serverIds = new Set(msgs.map((m) => m.id));
      const wsOnly = existing.filter((m) => !serverIds.has(m.id));
      const merged = [...msgs, ...wsOnly];
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return { messages: { ...state.messages, [conversationId]: merged } };
    }),

  // Issues 4, 5, 9 consolidated here
  appendMessage: (msg, currentUserId) =>
    set((state) => {
      // Issue 5: unknown conversation — don't silently produce orphan messages
      const convExists = state.conversations.some((c) => c.id === msg.conversation_id);
      if (!convExists) {
        console.warn(`appendMessage: unknown conversation ${msg.conversation_id}`);
        return state;
      }

      const existing = state.messages[msg.conversation_id] ?? [];
      if (existing.some((m) => m.id === msg.id)) return state;
      const updated = [...existing, msg];

      // Issue 4: own messages and active-conversation messages don't increment unread
      const isOwnMessage = currentUserId !== undefined && msg.sender_id === currentUserId;
      const isActiveConv = msg.conversation_id === state.activeConversationId;
      const shouldIncrementUnread = !isOwnMessage && !isActiveConv;

      const convs = state.conversations.map((c) =>
        c.id === msg.conversation_id
          ? {
              ...c,
              // Issue 9: don't leak deleted message content into the preview
              last_message: {
                id: msg.id,
                content: msg.is_deleted ? "" : msg.content,
                sender_id: msg.sender_id,
                created_at: msg.created_at,
              },
              last_message_at: msg.created_at,
              // Issue 2: guard against undefined unread_count
              unread_count: shouldIncrementUnread ? (c.unread_count ?? 0) + 1 : c.unread_count,
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

  // Issue 6: conversationId param makes this O(1) instead of O(n×m)
  updateMessageReactions: (conversationId, messageId, reactions) =>
    set((state) => {
      const msgs = state.messages[conversationId];
      if (!msgs) return state;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx < 0) return state;
      const updated = [...msgs];
      updated[idx] = { ...updated[idx], reactions };
      return { messages: { ...state.messages, [conversationId]: updated } };
    }),

  // Issue 3: plain array instead of Set — serializable and middleware-compatible
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: next } };
    }),

  // Issue 7: guard against null members from partial API responses
  setUserOnline: (userId, isOnline, lastSeen) =>
    set((state) => {
      const convs = state.conversations.map((c) => ({
        ...c,
        members: (c.members ?? []).map((m) =>
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

  // Issue 2: ?? 0 prevents NaN when server omits the field
  incrementUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: (c.unread_count ?? 0) + 1 } : c
      ),
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),

  updateMessageStatus: (messageId, status) =>
    set((state) => {
      const current = state.messageStatuses[messageId];
      const order: Record<string, number> = { sent: 0, delivered: 1, read: 2 };
      if (!current || order[status] > order[current]) {
        return { messageStatuses: { ...state.messageStatuses, [messageId]: status } };
      }
      return state;
    }),
}));
