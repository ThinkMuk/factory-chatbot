"use client";

import { loadChatRooms, saveChatRooms } from '@/app/_lib/chatRoomsStorage';
import { ChatRoom, ChatThread, ChatMessage, ServerChatMessage } from '@/app/types';

type MinimalChatRoom = Pick<ChatRoom, 'roomId' | 'roomName' | 'date'>;

export function addToChatRoomList(newRoom: MinimalChatRoom) {
  const existing = loadChatRooms();
  const next = [newRoom, ...existing.filter((room) => room.roomId !== newRoom.roomId)];
  saveChatRooms(next);
}

export function transformServerMessage(serverMessage: ServerChatMessage, index: number = 0): ChatMessage {
  return {
    id: serverMessage.chatId,
    role: serverMessage.isChatbot ? "assistant" : "user",
    content: serverMessage.content,
    createdAt: Date.now() + index, // 서버에서 createdAt을 제공하지 않으므로 현재 시간 사용, 순서 유지를 위해 index 추가
  };
}

export function createThreadWithMessages(threadId: string, serverMessages: ServerChatMessage[]): ChatThread {
  const now = Date.now();
  // 서버에서 최신 메시지가 먼저 오므로 reverse()로 오래된 메시지부터 정렬
  const clientMessages = serverMessages.reverse().map((msg, index) => transformServerMessage(msg, index));

  const newThread: ChatThread = {
    id: threadId,
    createdAt: now,
    updatedAt: now,
    messages: clientMessages,
  };

  // 로컬에 저장하지 않고 반환만
  return newThread;
}


