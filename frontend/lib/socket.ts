import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { WsClientEvent, WsServerEvent, Conversation } from "@/types";

class SocketManager {
  private ws: WebSocket | null = null;
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    // Next.js rewrites don't cover WebSocket — connect directly to backend
    const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3277";
    this.ws = new WebSocket(`${wsBase}/ws?token=${token}`);

    this.ws.onmessage = (event) => {
      let data: WsServerEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      this.dispatch(data);
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  send(event: WsClientEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  private dispatch(event: WsServerEvent) {
    const store = useChatStore.getState();

    switch (event.type) {
      case "message:new": {
        const currentUserId = useAuthStore.getState().user?.id;
        store.appendMessage(event.message, currentUserId);
        const convId = event.message.conversation_id;
        const convExists = store.conversations.some((c) => c.id === convId);
        if (!convExists) {
          api.get<Conversation>(`/conversations/${convId}`)
            .then((res) => useChatStore.getState().upsertConversation(res.data))
            .catch(() => {});
        }
        break;
      }
      case "typing:update": {
        store.setTyping(event.conversation_id, event.user_id, event.is_typing);
        const timerKey = `${event.conversation_id}:${event.user_id}`;
        const existing = this.typingTimers.get(timerKey);
        if (existing !== undefined) {
          clearTimeout(existing);
          this.typingTimers.delete(timerKey);
        }
        if (event.is_typing) {
          const timer = setTimeout(() => {
            useChatStore.getState().setTyping(event.conversation_id, event.user_id, false);
            this.typingTimers.delete(timerKey);
          }, 3000);
          this.typingTimers.set(timerKey, timer);
        }
        break;
      }
      case "presence:update": {
        store.setUserOnline(event.user_id, event.is_online, event.last_seen);
        break;
      }
      case "reaction:update": {
        store.updateMessageReactions(event.conversation_id, event.message_id, event.reactions);
        break;
      }
      case "message:status": {
        store.updateMessageStatus(event.message_id, event.status);
        break;
      }
    }
  }
}

export const socketManager = new SocketManager();
