export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type NewThreadPayload = {
  title: string;
};

// --- Chat Room Types ---
export interface ChatRoom {
  roomId: string;
  roomName: string | string[];
  date: string;
}

export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
}

// --- Chat API Types ---
export interface CreateChatRoomResponse {
  roomId: string;
  roomName: string | string[];
  userChatId: string;
  llmChatId: string;
  answer: string;
}

export interface SendMessageResponse {
  roomId: string;
  userChatId: string;
  llmChatId: string;
  answer: string;
}


