export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
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

// --- Server Chat Message Type ---
export interface ServerChatMessage {
  chatId: string;
  content: string;
  isChatbot: boolean;
}

export interface ChatHistoryResponse {
  roomId: string;
  chattings: ServerChatMessage[];
}


