"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { fetchChatHistory } from "@/app/_api/chat";
import { transformServerMessage } from "@/app/_lib/storage";
import type { ChatMessage } from "@/app/types";

type UseChatHistoryParams = {
  routeId?: string;
  activeRoomId?: string;
  setResolvedRoomId: (id?: string) => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
};

export function useChatHistory({
  routeId,
  activeRoomId,
  setResolvedRoomId,
  setMessages,
}: UseChatHistoryParams) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const hasLoadedHistoryRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!routeId) return;
    if (routeId === "new") {
      if (!activeRoomId) {
        setMessages([]);
      }
      return;
    }

    setResolvedRoomId(routeId);
    if (hasLoadedHistoryRef.current.has(routeId)) return;
    hasLoadedHistoryRef.current.add(routeId);

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetchChatHistory(routeId);
        if (response.chattings && response.chattings.length > 0) {
          const clientMessages = response.chattings
            .reverse()
            .map((msg, index) => transformServerMessage(msg, index));
          setMessages(clientMessages);
        }
      } catch (error) {
        console.error("채팅 기록 불러오기 실패:", error);
        hasLoadedHistoryRef.current.delete(routeId);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [routeId, activeRoomId, setMessages, setResolvedRoomId]);

  return { isLoadingHistory };
}


