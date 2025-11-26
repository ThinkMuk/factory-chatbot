"use client";

import type { CreateChatRoomResponse, SendMessageResponse } from "@/app/types";

import { joinRoomNameChunks, isValidRoomNameValue } from '@/app/_lib/roomNameUtils';
import { DEFAULT_RETRY_COUNT, DEFAULT_TIMEOUT_MS, getApiBaseUrl, isRetryableError, requestWithRetry } from './client';
import { ChatApiError, buildErrorMessage, normalizeError } from './errors';
import { buildHeaders } from "./headers";
import { delay } from './utils';

type MinimalCreatePayload = {
  question: string;
};

type MinimalSendPayload = {
  roomId: string;
  question: string;
};

type CreateChatRoomOptions = {
  onAnswerChunk?: (payload: { chunk: string; accumulated: string }) => void;
};

const CREATE_CHAT_STREAM_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

//새로운 채팅방 만들기
//{roomId, roomName, userChatId, llmChatId, answer} 형식으로 리턴
export async function createChatRoom(
  question: string,
  options: CreateChatRoomOptions = {}
): Promise<CreateChatRoomResponse> {
  const sanitized = question.trim();
  if (!sanitized) {
    throw new Error('질문을 입력해 주세요.');
  }
  const payload: MinimalCreatePayload = { question: sanitized };
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= DEFAULT_RETRY_COUNT) {
    try {
      const data = await streamCreateChatRoomRequest(payload, options);
      validateCreateChatRoomResponse(data);
      return data;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < DEFAULT_RETRY_COUNT && isRetryableError(error);
      if (!canRetry) {
        throw normalizeError(error);
      }
      const backoffMs = Math.pow(2, attempt) * 500;
      await delay(backoffMs);
      attempt += 1;
    }
  }
  throw normalizeError(lastError);
}

//기존 채팅방에 메세지 전송
//{roomId, userChatId, llmChatId, answer} 형식으로 리턴
export async function sendMessage(roomId: string, question: string): Promise<SendMessageResponse> {
  const sanitized = question.trim();
  if (!roomId) {
    throw new Error('채팅방 정보가 없습니다.');
  }
  if (!sanitized) {
    throw new Error('질문을 입력해 주세요.');
  }
  const payload: MinimalSendPayload = {
    roomId,
    question: sanitized,
  };
  const raw = await requestWithRetry<string>(
    '/v2/chat',
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    },
    { responseType: 'text' }
  );
  const data = parseSendMessageResponse(raw);
  validateSendMessageResponse(data);
  return data;
}

export async function deleteChatRoom(roomId: string): Promise<void> {
  if (!roomId) {
    throw new Error('채팅방 정보가 없습니다.');
  }
  const url = `/v1/chat/room?roomId=${encodeURIComponent(roomId)}`;
  await requestWithRetry<void>(url, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
}

//채팅방 생성 응답이 올바른 형식인지 확인
function validateCreateChatRoomResponse(data: CreateChatRoomResponse) {
  if (
    !data ||
    !data.roomId ||
    !isValidRoomNameValue(data.roomName) ||
    !data.userChatId ||
    !data.llmChatId ||
    typeof data.answer !== 'string'
  ) {
    throw new Error('채팅방 생성 응답 형식이 올바르지 않습니다.');
  }
}

//메세지 전송 응답이 올바른 형식인지 확인
function validateSendMessageResponse(data: SendMessageResponse) {
  if (!data || !data.roomId || !data.userChatId || !data.llmChatId || typeof data.answer !== 'string') {
    throw new Error('메시지 응답 형식이 올바르지 않습니다.');
  }
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

type CreateChatRoomStreamAccumulator = {
  roomId?: string;
  roomName?: string;
  userChatId?: string;
  llmChatId?: string;
  answer: string;
};

async function streamCreateChatRoomRequest(
  payload: MinimalCreatePayload,
  options: CreateChatRoomOptions = {}
): Promise<CreateChatRoomResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/v1/chat/room/create/stream`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timerId = controller ? setTimeout(() => controller.abort(), CREATE_CHAT_STREAM_TIMEOUT_MS) : undefined;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeaders(),
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      const text = await response.text();
      const message = buildErrorMessage(text, response.status, response.statusText);
      throw new ChatApiError(message, response.status);
    }
    if (!response.body) {
      throw new Error('스트리밍 응답을 초기화할 수 없습니다.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const accumulator: CreateChatRoomStreamAccumulator = {
      answer: '',
    };
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }
      let nextEvent = extractNextSseEvent(buffer);
      while (nextEvent) {
        processSseEventChunk(nextEvent.event, accumulator, options);
        buffer = nextEvent.remainder;
        nextEvent = extractNextSseEvent(buffer);
      }
      if (done) {
        buffer += decoder.decode();
        nextEvent = extractNextSseEvent(buffer);
        while (nextEvent) {
          processSseEventChunk(nextEvent.event, accumulator, options);
          buffer = nextEvent.remainder;
          nextEvent = extractNextSseEvent(buffer);
        }
        if (buffer.trim()) {
          processSseEventChunk(buffer, accumulator, options);
        }
        break;
      }
    }
    return finalizeCreateChatRoomResponse(accumulator);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}

function extractNextSseEvent(buffer: string): { event: string; remainder: string } | null {
  if (!buffer) {
    return null;
  }
  const newlineIndex = buffer.indexOf('\n\n');
  const crlfIndex = buffer.indexOf('\r\n\r\n');
  let delimiterIndex = -1;
  let delimiterLength = 0;
  if (newlineIndex !== -1 && (crlfIndex === -1 || newlineIndex < crlfIndex)) {
    delimiterIndex = newlineIndex;
    delimiterLength = 2;
  } else if (crlfIndex !== -1) {
    delimiterIndex = crlfIndex;
    delimiterLength = 4;
  }
  if (delimiterIndex === -1) {
    return null;
  }
  return {
    event: buffer.slice(0, delimiterIndex),
    remainder: buffer.slice(delimiterIndex + delimiterLength),
  };
}

function processSseEventChunk(
  rawChunk: string,
  accumulator: CreateChatRoomStreamAccumulator,
  options: CreateChatRoomOptions
) {
  const payloadText = extractPayloadFromSseChunk(rawChunk);
  if (!payloadText || payloadText === '[DONE]') {
    return;
  }
  let parsed: Partial<CreateChatRoomResponse>;
  try {
    parsed = JSON.parse(normalizeIdTokens(payloadText)) as Partial<CreateChatRoomResponse>;
  } catch {
    throw new Error('SSE 응답을 파싱하지 못했습니다.');
  }
  const chunk = mergeChunkIntoAccumulator(parsed, accumulator);
  if (chunk && options.onAnswerChunk) {
    options.onAnswerChunk({ chunk, accumulated: accumulator.answer });
  }
}

function extractPayloadFromSseChunk(chunk: string): string | null {
  const normalized = chunk.replace(/\r/g, '');
  const lines = normalized.split('\n');
  const dataLines = lines.filter((line) => line.startsWith('data:')).map((line) => line.replace(/^data:\s*/, ''));
  const payload = (dataLines.length ? dataLines.join('\n') : normalized).trim();
  return payload || null;
}

function mergeChunkIntoAccumulator(
  payload: Partial<CreateChatRoomResponse>,
  accumulator: CreateChatRoomStreamAccumulator
) {
  if (payload.roomId) {
    accumulator.roomId = normalizeIdValue(payload.roomId);
  }
  if (payload.roomName) {
    const nextChunk = joinRoomNameChunks(payload.roomName);
    if (nextChunk) {
      accumulator.roomName = (accumulator.roomName ?? '') + nextChunk;
    }
  }
  if (payload.userChatId) {
    accumulator.userChatId = normalizeIdValue(payload.userChatId);
  }
  if (payload.llmChatId) {
    accumulator.llmChatId = normalizeIdValue(payload.llmChatId);
  }
  if (typeof payload.answer === 'string') {
    accumulator.answer += payload.answer;
    return payload.answer;
  }
  return undefined;
}

function finalizeCreateChatRoomResponse(accumulator: CreateChatRoomStreamAccumulator): CreateChatRoomResponse {
  return {
    roomId: accumulator.roomId ?? '',
    roomName: accumulator.roomName ?? '',
    userChatId: accumulator.userChatId ?? '',
    llmChatId: accumulator.llmChatId ?? '',
    answer: accumulator.answer,
  };
}


