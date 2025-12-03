"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessage, ChatThread } from '@/app/types';
import { getThread, upsertThread } from '@/app/_lib/storage';
import { createNewChatWithMessage, sendMessageToExistingChat, getErrorMessage } from '@/app/_lib/chatOperations';
import { emitTempRoomTitle } from '@/app/_lib/chatEvents';
import { AssistantMessageBubble, UserMessageBubble, ChatInputFooter } from '@/app/_components/chat';

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const [thread, setThread] = useState<ChatThread | undefined>(undefined);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | undefined>(
    params?.id && params.id !== 'new' ? params.id : undefined
  );
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingMessageIdRef = useRef(0);
  const hasUpdatedUrlRef = useRef(false);

  const activeRoomId = resolvedRoomId ?? (params?.id && params.id !== 'new' ? params.id : undefined);
  const isNewChatRoute = params?.id === 'new';
  const isNewChat = !activeRoomId && isNewChatRoute;

  const handleStreamingAnimationComplete = () => {
    setStreamingAnswer('');
  };

  // 사용자가 스크롤했는지 감지
  const handleScroll = () => {
    const element = listRef.current;
    if (!element) return;

    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
    setAutoScrollEnabled(isAtBottom);
  };

  useEffect(() => {
    if (!params?.id) return;
    if (params.id === 'new') {
      if (!activeRoomId) {
        setThread(undefined);
      }
      return;
    }
    setResolvedRoomId(params.id);
    setThread(getThread(params.id));
  }, [params?.id, activeRoomId]);

  const messages = useMemo(() => {
    if (!thread) return [];
    if (streamingAnswer && !isStreamingActive && thread.messages.length > 0) {
      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content === streamingAnswer) {
        return thread.messages.slice(0, -1);
      }
    }
    return thread.messages;
  }, [thread, streamingAnswer, isStreamingActive]);

  useEffect(() => {
    if (autoScrollEnabled) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, pendingMessage, isProcessing, streamingAnswer, autoScrollEnabled]);

  const handleStreamingProgress = useCallback(() => {
    if (!autoScrollEnabled) return;
    requestAnimationFrame(() => {
      const element = listRef.current;
      if (!element) return;
      element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
    });
  }, [autoScrollEnabled]);

  const handleNewChatCreation = async (content: string) => {
    setIsProcessing(true);
    setPendingMessage(content);
    setStreamingAnswer('');
    setIsStreamingActive(true);
    setInput('');
    hasUpdatedUrlRef.current = false;

    const revertToNewChat = () => {
      if (hasUpdatedUrlRef.current && typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/chat/new');
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
          if (!hasUpdatedUrlRef.current && typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/chat/${roomId}`);
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
      const finalAssistantMessage = result.thread.messages[result.thread.messages.length - 1];
      setResolvedRoomId(result.thread.id);
      setThread(result.thread);
      setPendingMessage('');
      setIsStreamingActive(false);
      setStreamingAnswer(finalAssistantMessage?.content ?? '');
      setIsProcessing(false);
      emitTempRoomTitle({ roomId: result.thread.id, title: undefined });
      hasUpdatedUrlRef.current = false;
      return;
    }

    // 에러 처리
    if (result.shouldRetry) {
      const shouldRetry = window.confirm('응답 시간이 초과되었습니다. 다시 시도하시겠습니까?');
      if (shouldRetry) {
        revertToNewChat();
        setPendingMessage('');
        setStreamingAnswer('');
        setIsProcessing(false);
        setInput(content); // 원본 내용 복원
        setTimeout(() => sendUserMessage(), 0);
        return;
      }
    } else {
      alert(`${getErrorMessage(result.error)}\n잠시 후 다시 시도해 주세요.`);
    }

    revertToNewChat();
    setPendingMessage('');
    setStreamingAnswer('');
    setIsStreamingActive(false);
    setIsProcessing(false);
  };

  const handleExistingChatMessage = async (content: string) => {
    if (!thread || !activeRoomId) {
      alert('대화 정보를 찾을 수 없습니다. 목록에서 다시 선택해 주세요.');
      return;
    }

    const previousThread: ChatThread = {
      ...thread,
      messages: [...thread.messages],
    };

    const tempMessageId = `pending-${pendingMessageIdRef.current++}`;
    setInput('');
    setPendingMessage(content);
    setStreamingAnswer('');
    setIsStreamingActive(true);
    setIsProcessing(true);

    const result = await sendMessageToExistingChat(activeRoomId, content, tempMessageId, {
      onAnswerChunk: ({ accumulated }) => {
        setIsStreamingActive(true);
        setStreamingAnswer(accumulated);
      },
    });

    if (result.success && result.updatedThread) {
      const finalAssistantMessage = result.updatedThread.messages[result.updatedThread.messages.length - 1];
      setThread(result.updatedThread);
      setIsStreamingActive(false);
      setStreamingAnswer(finalAssistantMessage?.content ?? '');
    } else {
      alert(`${getErrorMessage(result.error)}\n다시 시도해 주세요.`);
      upsertThread(previousThread);
      setThread(previousThread);
      setStreamingAnswer('');
      setIsStreamingActive(false);
    }

    setPendingMessage('');
    setIsProcessing(false);
  };

  const sendUserMessage = async () => {
    if (isProcessing) return;

    const content = input.trim();
    if (!content) return;

    if (isNewChat) {
      await handleNewChatCreation(content);
    } else {
      await handleExistingChatMessage(content);
    }
  };

  // 새 채팅이 아닌데 스레드가 없고 현재 처리 중이 아닐 때만 에러 표시
  if (!isNewChat && !thread && !isProcessing) {
    return (
      <main className='flex-1 p-4 flex items-center justify-center text-sm text-black/60'>
        존재하지 않는 대화입니다.
      </main>
    );
  }

  return (
    <>
      <div ref={listRef} onScroll={handleScroll} className='flex-1 overflow-auto p-4 space-y-3'>
        {messages.map((m: ChatMessage) =>
          m.role === 'user' ? (
            <UserMessageBubble key={m.id} content={m.content} />
          ) : (
            <AssistantMessageBubble key={m.id} content={m.content} />
          )
        )}
        {pendingMessage && <UserMessageBubble content={pendingMessage} />}
        {streamingAnswer && (
          <AssistantMessageBubble
            content={streamingAnswer}
            isStreaming={isStreamingActive}
            onTypingComplete={handleStreamingAnimationComplete}
            onStreamingProgress={handleStreamingProgress}
          />
        )}
        {isProcessing && !streamingAnswer && <AssistantMessageBubble isLoading={true} />}
        {/* 가능하면 차트나 그래프로 해당 내용을 시각화하여 표시 */}
      </div>
      <ChatInputFooter
        input={input}
        setInput={setInput}
        onSendMessage={sendUserMessage}
        isProcessing={isProcessing}
        isNewChat={isNewChat}
      />
    </>
  );
}