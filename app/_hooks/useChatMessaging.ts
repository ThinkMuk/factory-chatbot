"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createNewChatWithMessage, getErrorMessage, sendMessageToExistingChat } from "@/app/_lib/chatOperations";
import { emitTempRoomTitle } from "@/app/_lib/chatEvents";
import { getActiveRoomId, isNewChat as isNewChatHelper } from "@/app/_lib/chatHelpers";
import type { ChatMessage } from "@/app/types";

type UseChatMessagingParams = {
  routeId?: string;
};

export function useChatMessaging({ routeId }: UseChatMessagingParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | undefined>(
    routeId && routeId !== "new" ? routeId : undefined
  );
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [pendingFinalMessages, setPendingFinalMessages] = useState<ChatMessage[] | null>(null);
  const pendingMessageIdRef = useRef(0);
  const hasUpdatedUrlRef = useRef(false);
  const sendUserMessageRef = useRef<(() => Promise<void>) | null>(null);

  const activeRoomId = getActiveRoomId(resolvedRoomId, routeId);
  const isNewChat = isNewChatHelper(resolvedRoomId, routeId);

  const handleStreamingAnimationComplete = useCallback(() => {
    setStreamingAnswer("");
    setPendingMessage("");
    if (pendingFinalMessages) {
      setMessages(pendingFinalMessages);
      setPendingFinalMessages(null);
    }
  }, [pendingFinalMessages]);

  const handleNewChatCreation = useCallback(
    async (content: string) => {
      setIsProcessing(true);
      setPendingMessage(content);
      setStreamingAnswer("");
      setIsStreamingActive(true);
      setInput("");
      hasUpdatedUrlRef.current = false;

      const revertToNewChat = () => {
        if (hasUpdatedUrlRef.current && typeof window !== "undefined") {
          window.history.replaceState(null, "", "/chat/new");
        }
        if (resolvedRoomId) {
          emitTempRoomTitle({ roomId: resolvedRoomId, title: undefined });
        }
        setIsStreamingActive(false);
        setResolvedRoomId(undefined);
        hasUpdatedUrlRef.current = false;
      };

      const result = await createNewChatWithMessage(content, {
        onAnswerChunk: ({ accumulated, roomId, roomName }) => {
          setIsStreamingActive(true);
          if (roomId) {
            setResolvedRoomId(roomId);
            if (!hasUpdatedUrlRef.current && typeof window !== "undefined") {
              window.history.replaceState(null, "", `/chat/${roomId}`);
              hasUpdatedUrlRef.current = true;
            }
            if (roomName) {
              emitTempRoomTitle({ roomId, title: roomName });
            }
          }
          setStreamingAnswer(accumulated);
        },
      });

      if (result.success && result.thread) {
        setResolvedRoomId(result.thread.id);
        setIsStreamingActive(false);
        setPendingFinalMessages(result.thread.messages);
        setIsProcessing(false);
        emitTempRoomTitle({ roomId: result.thread.id, title: undefined });
        hasUpdatedUrlRef.current = false;
        return;
      }

      if (result.shouldRetry) {
        const shouldRetry = window.confirm("응답 시간이 초과되었습니다. 다시 시도하시겠습니까?");
        if (shouldRetry) {
          revertToNewChat();
          setPendingMessage("");
          setStreamingAnswer("");
          setIsProcessing(false);
          setInput(content);
          setTimeout(() => sendUserMessageRef.current?.(), 0);
          return;
        }
      } else {
        alert(`${getErrorMessage(result.error)}\n잠시 후 다시 시도해 주세요.`);
      }

      revertToNewChat();
      setPendingMessage("");
      setStreamingAnswer("");
      setIsStreamingActive(false);
      setIsProcessing(false);
    },
    [resolvedRoomId]
  );

  const handleExistingChatMessage = useCallback(
    async (content: string) => {
      if (!activeRoomId) {
        alert("대화 정보를 찾을 수 없습니다. 목록에서 다시 선택해 주세요.");
        return;
      }

      const previousMessages = [...messages];
      const tempMessageId = `pending-${pendingMessageIdRef.current++}`;
      setInput("");
      setPendingMessage(content);
      setStreamingAnswer("");
      setIsStreamingActive(true);
      setIsProcessing(true);

      const result = await sendMessageToExistingChat(activeRoomId, content, tempMessageId, {
        onAnswerChunk: ({ accumulated }) => {
          setIsStreamingActive(true);
          setStreamingAnswer(accumulated);
        },
      });

      if (result.success && result.userMessage && result.assistantMessage) {
        const finalUserMessage: ChatMessage = {
          ...result.userMessage,
          id: result.serverUserChatId || result.userMessage.id,
        };

        setPendingFinalMessages([...messages, finalUserMessage, result.assistantMessage]);
        setIsStreamingActive(false);
      } else {
        alert(`${getErrorMessage(result.error)}\n다시 시도해 주세요.`);
        setMessages(previousMessages);
        setStreamingAnswer("");
        setIsStreamingActive(false);
        setPendingMessage("");
      }

      setIsProcessing(false);
    },
    [activeRoomId, messages]
  );

  const sendUserMessage = useCallback(async () => {
    if (isProcessing) return;
    const content = input.trim();
    if (!content) return;

    if (isNewChat) {
      await handleNewChatCreation(content);
    } else {
      await handleExistingChatMessage(content);
    }
  }, [handleExistingChatMessage, handleNewChatCreation, input, isNewChat, isProcessing]);

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isProcessing,
    pendingMessage,
    streamingAnswer,
    isStreamingActive,
    pendingFinalMessages,
    handleStreamingAnimationComplete,
    sendUserMessage,
    activeRoomId,
    isNewChat,
    setResolvedRoomId,
  };
}


