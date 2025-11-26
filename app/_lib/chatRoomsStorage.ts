"use client";

import type { ChatRoom } from "@/app/types";

const STORAGE_KEY = "chatRooms";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveChatRooms(rooms: ChatRoom[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function loadChatRooms(): ChatRoom[] {
  if (typeof window === "undefined") return [];
  return safeParse<ChatRoom[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function clearChatRooms(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}






