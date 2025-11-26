import { ChatApiError, buildErrorMessage, normalizeError } from "./errors";
import { delay } from "./utils";

export const DEFAULT_TIMEOUT_MS = 60000; // 60초 (AI 응답 생성을 위해 증가)
export const DEFAULT_RETRY_COUNT = 2;

export type RequestOptions = {
  timeoutMs?: number;
  retries?: number;
  responseType?: "json" | "text";
};

//실패하면 자동으로 재시도하는 HTTP 요청 래퍼
export async function requestWithRetry<T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRY_COUNT, responseType = "json" } = options;
  const baseUrl = getApiBaseUrl();
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fetchWithTimeout<T>(`${baseUrl}${path}`, init, timeoutMs, responseType);
    } catch (error) {
      const canRetry = attempt < retries && isRetryableError(error);
      if (!canRetry) {
        throw normalizeError(error);
      }
      lastError = error;
      const backoffMs = Math.pow(2, attempt) * 500;
      await delay(backoffMs);
      attempt += 1;
    }
  }
  throw normalizeError(lastError);
}

//타임아웃을 적용한 HTTP 요청 생성
export async function fetchWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  responseType: "json" | "text"
): Promise<T> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timerId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller?.signal,
      cache: "no-store",
    });
    const text = await response.text();
    if (!response.ok) {
      const message = buildErrorMessage(text, response.status, response.statusText);
      throw new ChatApiError(message, response.status);
    }
    if (responseType === "text") {
      return text as T;
    }
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}

//환경변수에서 API 서버 주소 가져오기
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }
  return base;
}

export function isRetryableError(error: unknown): boolean {
  if (isTimeoutError(error)) {
    return false;
  }
  if (error instanceof ChatApiError) {
    return error.status === 502 || error.status === 503;
  }
  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();
    return lowerMessage.includes('failed to fetch') || lowerMessage.includes('network error');
  }
  return false;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("시간 초과");
}

