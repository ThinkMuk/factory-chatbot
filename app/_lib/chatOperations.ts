"use client";

import type { ChatMessage, ChatThread } from "@/app/types";
import { createChatRoom, sendMessage } from "@/app/_api/chat";
import { addToChatRoomList } from "@/app/_lib/storage";
import { getErrorMessage, isTimeoutError } from "@/app/_api/errors";
import { formatKoreanDate } from "@/app/_lib/dateUtils";
import { joinRoomNameChunks } from "@/app/_lib/roomNameUtils";

//재사용 편의성을 위해 re-export 진행
export { getErrorMessage };

export type CreateNewChatResult = {
  success: boolean;
  thread?: ChatThread;
  shouldRetry?: boolean;
  error?: unknown;
};

export type SendMessageResult = {
  success: boolean;
  userMessage?: ChatMessage;
  assistantMessage?: ChatMessage;
  serverUserChatId?: string;
  error?: unknown;
};

type AnswerStreamHandlers = {
  onAnswerChunk?: (payload: {
    chunk: string;
    accumulated: string;
    roomId?: string;
    roomName?: string;
  }) => void;
};

/*
 * 새로운 채팅방을 생성하고 첫 메시지를 전송
 */
export async function createNewChatWithMessage(
  content: string,
  handlers: AnswerStreamHandlers = {}
): Promise<CreateNewChatResult> {
  try {
    const response = await createChatRoom(content, handlers);
    const normalizedRoomId = String(response.roomId);
    const normalizedRoomName = joinRoomNameChunks(response.roomName) || '새 채팅';
    const now = Date.now();

    const userMessage: ChatMessage = {
      id: response.userChatId || crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: now,
    };

    const assistantMessage: ChatMessage = {
      id: response.llmChatId || crypto.randomUUID(),
      role: 'assistant',
      content: response.answer,
      createdAt: now + 1,
    };

    const newThread: ChatThread = {
      id: normalizedRoomId,
      createdAt: now,
      updatedAt: now + 1,
      messages: [userMessage, assistantMessage],
    };

    // ChatRoom 목록에만 추가 (ChatThread는 로컬 저장 안 함)
    addToChatRoomList({
      roomId: normalizedRoomId,
      roomName: normalizedRoomName,
      date: formatKoreanDate(new Date(now)),
    });

    return {
      success: true,
      thread: newThread,
    };
  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    return {
      success: false,
      shouldRetry: isTimeoutError(error),
      error,
    };
  }
}

/*
 * 기존 채팅방에 메시지를 전송
 * 로컬 저장 없이 메시지 객체만 반환
 */
export async function sendMessageToExistingChat(
  roomId: string,
  content: string,
  tempMessageId: string,
  handlers: AnswerStreamHandlers = {}
): Promise<SendMessageResult> {
  try {
    const now = Date.now();

    // 사용자 메시지 (임시 ID 사용)
    const userMessage: ChatMessage = {
      id: tempMessageId,
      role: 'user',
      content,
      createdAt: now,
    };

    // API 호출
    const response = await sendMessage(roomId, content, handlers);

    // 어시스턴트 응답 메시지
    const assistantMessage: ChatMessage = {
      id: response.llmChatId || crypto.randomUUID(),
      role: 'assistant',
      content: response.answer,
      createdAt: now + 1,
    };

    return {
      success: true,
      userMessage,
      assistantMessage,
      serverUserChatId: response.userChatId,
    };
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    return {
      success: false,
      error,
    };
  }
}
