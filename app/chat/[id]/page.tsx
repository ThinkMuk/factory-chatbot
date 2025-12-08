"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessage } from '@/app/types';
import { createNewChatWithMessage, sendMessageToExistingChat, getErrorMessage } from '@/app/_lib/chatOperations';
import { emitTempRoomTitle } from '@/app/_lib/chatEvents';
import { AssistantMessageBubble, UserMessageBubble, ChatInputFooter } from '@/app/_components/chat';
import { fetchChatHistory } from '@/app/_api/chat';
import { transformServerMessage } from '@/app/_lib/storage';
import LoadingDotMotions from '@/app/_components/LoadingDotMotions';

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | undefined>(
    params?.id && params.id !== 'new' ? params.id : undefined
  );
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [pendingFinalMessages, setPendingFinalMessages] = useState<ChatMessage[] | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingMessageIdRef = useRef(0);
  const hasUpdatedUrlRef = useRef(false);
  const hasLoadedHistoryRef = useRef<Set<string>>(new Set());

  const activeRoomId = resolvedRoomId ?? (params?.id && params.id !== 'new' ? params.id : undefined);
  const isNewChatRoute = params?.id === 'new';
  const isNewChat = !activeRoomId && isNewChatRoute;

  const handleStreamingAnimationComplete = useCallback(() => {
    setStreamingAnswer('');
    setPendingMessage('');
    if (pendingFinalMessages) {
      setMessages(pendingFinalMessages);
      setPendingFinalMessages(null);
    }
  }, [pendingFinalMessages]);

  // 사용자가 스크롤했는지 감지
  const handleScroll = () => {
    const element = listRef.current;
    if (!element) return;

    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
    setAutoScrollEnabled(isAtBottom);
  };

  // 서버에서 채팅 기록 불러오기
  useEffect(() => {
    if (!params?.id) return;
    if (params.id === 'new') {
      if (!activeRoomId) {
        setMessages([]);
      }
      return;
    }
    setResolvedRoomId(params.id);

    // 서버에서 채팅 기록 불러오기
    if (params.id && !hasLoadedHistoryRef.current.has(params.id)) {
      hasLoadedHistoryRef.current.add(params.id);

      const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const response = await fetchChatHistory(params.id);
          if (response.chattings && response.chattings.length > 0) {
            // 서버에서 최신 메시지가 먼저 오므로 reverse()로 오래된 메시지부터 정렬
            const clientMessages = response.chattings.reverse().map((msg, index) => transformServerMessage(msg, index));
            setMessages(clientMessages);
          }
        } catch (error) {
          console.error('채팅 기록 불러오기 실패:', error);
          hasLoadedHistoryRef.current.delete(params.id);
        } finally {
          setIsLoadingHistory(false);
        }
      };

      loadHistory();
    }
  }, [params?.id, activeRoomId]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollEnabled) {
      // DOM 렌더링 완료 후 스크롤 실행
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
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
      setResolvedRoomId(result.thread.id);
      setIsStreamingActive(false);
      setPendingFinalMessages(result.thread.messages);
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
        setInput(content);
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
    if (!activeRoomId) {
      alert('대화 정보를 찾을 수 없습니다. 목록에서 다시 선택해 주세요.');
      return;
    }

    const previousMessages = [...messages];
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

    if (result.success && result.userMessage && result.assistantMessage) {
      // 임시 ID를 서버 ID로 교체한 사용자 메시지
      const finalUserMessage: ChatMessage = {
        ...result.userMessage,
        id: result.serverUserChatId || result.userMessage.id,
      };

      setPendingFinalMessages([...messages, finalUserMessage, result.assistantMessage]);
      setIsStreamingActive(false);
    } else {
      alert(`${getErrorMessage(result.error)}\n다시 시도해 주세요.`);
      setMessages(previousMessages);
      setStreamingAnswer('');
      setIsStreamingActive(false);
      setPendingMessage('');
    }

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

  // 히스토리 로딩 중일 때
  if (isLoadingHistory) {
    return (
      <main className='flex-1 p-4 flex items-center justify-center'>
        <LoadingDotMotions variant='text' text='채팅을 불러오는 중...' />
      </main>
    );
  }

  // 새 채팅이 아닌데 메시지가 없고 현재 처리 중이 아닐 때만 에러 표시
  if (
    !isNewChat &&
    messages.length === 0 &&
    !isProcessing &&
    !pendingMessage &&
    !streamingAnswer &&
    !pendingFinalMessages
  ) {
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