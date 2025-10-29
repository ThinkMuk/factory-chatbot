export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number; // epoch ms
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  messages: ChatMessage[];
};

export type NewThreadPayload = {
  title: string;
};


