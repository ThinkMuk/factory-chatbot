"use client";

import type { CreateChatRoomResponse, SendMessageResponse } from "@/app/types";

import { requestWithRetry } from "./client";
import { buildHeaders } from "./headers";

type MinimalCreatePayload = {
  question: string;
};

type MinimalSendPayload = {
  roomId: string;
  question: string;
};

//새로운 채팅방 만들기
//{roomId, roomName, userChatId, llmChatId, answer} 형식으로 리턴
export async function createChatRoom(question: string): Promise<CreateChatRoomResponse> {
  const sanitized = question.trim();
  if (!sanitized) {
    throw new Error("질문을 입력해 주세요.");
  }
  const payload: MinimalCreatePayload = { question: sanitized };
  const raw = await requestWithRetry<string>(
    "/v1/chat/room/create",
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    },
    { responseType: "text" }
  );
  const data = parseCreateChatRoomResponse(raw);
  validateCreateChatRoomResponse(data);
  return data;
}

//기존 채팅방에 메세지 전송
//{roomId, userChatId, llmChatId, answer} 형식으로 리턴
export async function sendMessage(roomId: string, question: string): Promise<SendMessageResponse> {
  const sanitized = question.trim();
  if (!roomId) {
    throw new Error("채팅방 정보가 없습니다.");
  }
  if (!sanitized) {
    throw new Error("질문을 입력해 주세요.");
  }
  const payload: MinimalSendPayload = {
    roomId,
    question: sanitized,
  };
  const raw = await requestWithRetry<string>(
    "/v2/chat",
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    },
    { responseType: "text" }
  );
  const data = parseSendMessageResponse(raw);
  validateSendMessageResponse(data);
  return data;
}

export async function deleteChatRoom(roomId: string): Promise<void> {
  if (!roomId) {
    throw new Error("채팅방 정보가 없습니다.");
  }
  const url = `/v1/chat/room?roomId=${encodeURIComponent(roomId)}`;
  await requestWithRetry<void>(url, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

//채팅방 생성 응답이 올바른 형식인지 확인
function validateCreateChatRoomResponse(data: CreateChatRoomResponse) {
  if (!data || !data.roomId || !data.roomName || !data.userChatId || !data.llmChatId || typeof data.answer !== "string") {
    throw new Error("채팅방 생성 응답 형식이 올바르지 않습니다.");
  }
}

//메세지 전송 응답이 올바른 형식인지 확인
function validateSendMessageResponse(data: SendMessageResponse) {
  if (!data || !data.roomId || !data.userChatId || !data.llmChatId || typeof data.answer !== "string") {
    throw new Error("메시지 응답 형식이 올바르지 않습니다.");
  }
}

function parseCreateChatRoomResponse(raw: string): CreateChatRoomResponse {
  const parsed = JSON.parse(normalizeIdTokens(raw)) as CreateChatRoomResponse;
  return {
    ...parsed,
    roomId: normalizeIdValue(parsed.roomId),
    userChatId: normalizeIdValue(parsed.userChatId),
    llmChatId: normalizeIdValue(parsed.llmChatId),
  };
}

function parseSendMessageResponse(raw: string): SendMessageResponse {
  const parsed = JSON.parse(normalizeIdTokens(raw)) as SendMessageResponse;
  return {
    ...parsed,
    roomId: normalizeIdValue(parsed.roomId),
    userChatId: normalizeIdValue(parsed.userChatId),
    llmChatId: normalizeIdValue(parsed.llmChatId),
  };
}

function normalizeIdTokens(raw: string): string {
  return raw.replace(/("(?:roomId|userChatId|llmChatId)"\s*:\s*)(\d+)/g, (_match, prefix, digits) => `${prefix}"${digits}"`);
}

function normalizeIdValue(value: unknown): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "string") {
    try {
      return BigInt(value).toString();
    } catch {
      return value;
    }
  }
  if (typeof value === "number") {
    try {
      return BigInt(value).toString();
    } catch {
      return String(value);
    }
  }
  return "";
}


