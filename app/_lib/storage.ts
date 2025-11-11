"use client";

import { ChatThread, ChatMessage, NewThreadPayload } from "@/app/types";

const STORAGE_KEY = "factory-chatbot.threads";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  return safeParse<ChatThread[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createThread(payload: NewThreadPayload): ChatThread {
  const now = Date.now();
  const newThread: ChatThread = {
    id: crypto.randomUUID(),
    title: payload.title.trim() || "새 채팅",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const threads = getThreads();
  threads.unshift(newThread);
  saveThreads(threads);
  return newThread;
}

export function deleteThread(threadId: string) {
  const threads = getThreads().filter((t) => t.id !== threadId);
  saveThreads(threads);
}

export function getThread(threadId: string): ChatThread | undefined {
  return getThreads().find((t) => t.id === threadId);
}

export function appendMessage(
  threadId: string,
  message: Omit<ChatMessage, "id" | "createdAt"> & Partial<Pick<ChatMessage, "id" | "createdAt">>
): ChatThread | undefined {
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx === -1) return undefined;
  const now = Date.now();
  const fullMsg: ChatMessage = {
    id: message.id ?? crypto.randomUUID(),
    createdAt: message.createdAt ?? now,
    role: message.role,
    content: message.content,
  };
  const updated: ChatThread = {
    ...threads[idx],
    updatedAt: now,
    messages: [...threads[idx].messages, fullMsg],
  };
  threads[idx] = updated;
  saveThreads(threads);
  return updated;
}

export function upsertThread(thread: ChatThread) {
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx === -1) {
    threads.unshift(thread);
  } else {
    threads[idx] = thread;
  }
  saveThreads(threads);
}


