"use client";

import type { ChatRoomListResponse } from "@/app/types";

const CLIENT_ID_STORAGE_KEY = "factory-chatbot.clientId";
const DEFAULT_PAGE_SIZE = 10;

function generateUUID(): string {
  // 가능하면 보안성이 높은 randomUUID 우선 사용
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // 대체용 UUID v4 생성기
  const hex: string[] = [];
  for (let i = 0; i < 256; i++) {
    hex[i] = (i < 16 ? "0" : "") + i.toString(16);
  }
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 16; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // 버전 비트 설정
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 비트 설정
  const b = randomBytes;
  return (
    hex[b[0]] +
    hex[b[1]] +
    hex[b[2]] +
    hex[b[3]] +
    "-" +
    hex[b[4]] +
    hex[b[5]] +
    "-" +
    hex[b[6]] +
    hex[b[7]] +
    "-" +
    hex[b[8]] +
    hex[b[9]] +
    "-" +
    hex[b[10]] +
    hex[b[11]] +
    hex[b[12]] +
    hex[b[13]] +
    hex[b[14]] +
    hex[b[15]]
  );
}

function getOrCreateClientId(): string {
  if (typeof window === "undefined") {
    // SSR 안전성 확보: 서버에서 호출되면 임시 ID 생성
    return generateUUID();
  }
  const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing && existing.length > 0) {
    return existing;
  }
  const created = generateUUID();
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
  return created;
}

function buildUrl(baseUrl: string, lastRoomId?: string, size: number = DEFAULT_PAGE_SIZE): string {
  const url = new URL("/v1/chat/room/list", baseUrl);
  url.searchParams.set("size", String(size));
  if (lastRoomId) {
    url.searchParams.set("lastRoomId", lastRoomId);
  }
  return url.toString();
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function fetchChatRooms(params: { lastRoomId?: string; size: number }): Promise<ChatRoomListResponse> {
  const { lastRoomId, size } = params;
  const clientId = getOrCreateClientId();

  if (!API_BASE_URL) {
    throw new Error("API Base URL이 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL 환경변수를 설정하세요.");
  }

  const url = buildUrl(API_BASE_URL, lastRoomId, size);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": clientId,
    },
  });

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(formatErrorMessage(res.status, res.statusText, rawText));
  }

  return parseChatRoomListResponse(rawText);
}

function formatErrorMessage(status: number, statusText: string, rawBody: string): string {
  const trimmed = rawBody?.trim();
  return `요청 실패 (${status}): ${trimmed || statusText}`;
}

function parseChatRoomListResponse(raw: string): ChatRoomListResponse {
  const normalized = raw.replace(/("roomId"\s*:\s*)(\d+)/g, (_match, prefix, digits) => `${prefix}"${digits}"`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error("서버 응답을 파싱할 수 없습니다.");
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { chatRooms?: unknown }).chatRooms)) {
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }

  const chatRooms = (parsed as ChatRoomListResponse).chatRooms.map((room) => ({
    ...room,
    roomId: normalizeRoomId(room.roomId),
  }));

  return { chatRooms };
}

function normalizeRoomId(roomId: unknown): string {
  if (typeof roomId === "bigint") {
    return roomId.toString();
  }
  if (typeof roomId === "string") {
    try {
      return BigInt(roomId).toString();
    } catch {
      return roomId;
    }
  }
  if (typeof roomId === "number") {
    try {
      return BigInt(roomId).toString();
    } catch {
      return String(roomId);
    }
  }
  return "";
}

export const ChatApiConstants = {
  DEFAULT_PAGE_SIZE,
};


