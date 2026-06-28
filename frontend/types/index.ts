export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  status_message: string | null;
  is_online: boolean;
  last_seen: string; // ISO string
}

export interface UserPrivate extends User {
  phone_number: string | null;
  created_at: string;
}

export interface Contact {
  id: number;
  contact_user: User;
  nickname: string | null;
}

export interface Reaction {
  id: number;
  user_id: number;
  emoji: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: User;
  content: string;
  type: "text" | "image" | "file" | "system";
  reply_to_id: number | null;
  reply_to: Pick<Message, "id" | "content" | "sender_id" | "sender"> | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  reactions: Reaction[];
}

export interface Member {
  id: number;
  user: User;
  role: "member" | "admin";
  joined_at: string;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  last_message: {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
  } | null;
  unread_count: number;
  other_user: User | null; // populated for DMs
  members: Member[];
}

// WebSocket event types — Client → Server
export type WsClientEvent =
  | { type: "message:send"; conversation_id: number; content: string; reply_to_id: number | null }
  | { type: "typing:start"; conversation_id: number }
  | { type: "typing:stop"; conversation_id: number }
  | { type: "message:read"; conversation_id: number; message_id: number }
  | { type: "reaction:add"; message_id: number; emoji: string }
  | { type: "reaction:remove"; message_id: number; emoji: string };

// WebSocket event types — Server → Client
export type WsServerEvent =
  | { type: "message:new"; message: Message }
  | { type: "message:status"; message_id: number; user_id: number; status: "sent" | "delivered" | "read" }
  | { type: "typing:update"; conversation_id: number; user_id: number; is_typing: boolean }
  | { type: "presence:update"; user_id: number; is_online: boolean; last_seen: string }
  | { type: "reaction:update"; message_id: number; reactions: Reaction[] };
