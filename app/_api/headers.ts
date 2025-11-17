import { generateUUID } from "./utils";

export const CLIENT_ID_STORAGE_KEY = "factory-chatbot.clientId";

//사용자 식별용 고유ID 생성/관리
export function getClientId(): string {
  if (typeof window === "undefined") {
    return generateUUID();
  }
  const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const created = generateUUID();
  window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
  return created;
}

//요청에 필요한 헤더 생성
export function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Client-Id": getClientId(),
  };
}

