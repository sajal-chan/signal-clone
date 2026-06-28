import { useChatStore } from "@/store/chatStore";
import type { WsClientEvent, WsServerEvent } from "@/types";

class SocketManager {
  private ws: WebSocket | null = null;
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    // Next.js rewrites don't cover WebSocket — connect directly to backend
    this.ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

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
    const { activeConversationId } = store;

    switch (event.type) {
      case "message:new": {
        store.appendMessage(event.message);
        if (event.message.conversation_id !== activeConversationId) {
          store.incrementUnread(event.message.conversation_id);
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
        store.updateMessageReactions(event.message_id, event.reactions);
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
