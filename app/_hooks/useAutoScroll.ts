"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseAutoScrollParams = {
  messagesLength: number;
  pendingMessage: string;
  isProcessing: boolean;
  streamingAnswer: string;
};

export function useAutoScroll({
  messagesLength,
  pendingMessage,
  isProcessing,
  streamingAnswer,
}: UseAutoScrollParams) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const handleScroll = useCallback(() => {
    const element = listRef.current;
    if (!element) return;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
    setAutoScrollEnabled(isAtBottom);
  }, []);

  useEffect(() => {
    if (!autoScrollEnabled) return;
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messagesLength, pendingMessage, isProcessing, streamingAnswer, autoScrollEnabled]);

  const handleStreamingProgress = useCallback(() => {
    if (!autoScrollEnabled) return;
    requestAnimationFrame(() => {
      const element = listRef.current;
      if (!element) return;
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
    });
  }, [autoScrollEnabled]);

  return { listRef, handleScroll, handleStreamingProgress };
}


