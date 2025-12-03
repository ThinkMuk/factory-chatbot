"use client";

import type { ChatMessage, ChatThread } from "@/app/types";
import { createChatRoom, sendMessage } from "@/app/_api/chat";
import { addToChatRoomList, appendMessage, replaceMessageId, upsertThread } from "@/app/_lib/storage";
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
  updatedThread?: ChatThread;
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
      title: normalizedRoomName,
      createdAt: now,
      updatedAt: now + 1,
      messages: [userMessage, assistantMessage],
    };

    // 스토리지에 저장
    upsertThread(newThread);
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
 */
export async function sendMessageToExistingChat(
  roomId: string,
  content: string,
  tempMessageId: string,
  handlers: AnswerStreamHandlers = {}
): Promise<SendMessageResult> {
  try {
    // 사용자 메시지를 임시 ID로 먼저 추가
    const userMessage: ChatMessage = {
      id: tempMessageId,
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    const updatedWithUser = appendMessage(roomId, userMessage);
    if (!updatedWithUser) {
      throw new Error('메시지를 추가할 수 없습니다. 화면을 새로고침해 주세요.');
    }

    // API 호출
    const response = await sendMessage(roomId, content, handlers);

    // 임시 ID를 서버에서 받은 ID로 교체
    const updatedWithServerUserId = replaceMessageId(roomId, tempMessageId, response.userChatId);

    // 어시스턴트 응답 추가
    const assistantMessage: ChatMessage = {
      id: response.llmChatId || crypto.randomUUID(),
      role: 'assistant',
      content: response.answer,
      createdAt: Date.now(),
    };

    const updatedWithAssistant = appendMessage(roomId, assistantMessage);

    return {
      success: true,
      updatedThread: updatedWithAssistant || updatedWithServerUserId,
    };
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    return {
      success: false,
      error,
    };
  }
}
