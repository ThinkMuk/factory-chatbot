"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage, ChatThread } from "@/app/types";
import { getThread, upsertThread } from '@/app/_lib/storage';
import { createNewChatWithMessage, sendMessageToExistingChat, getErrorMessage } from '@/app/_lib/chatOperations';
import { AssistantMessageBubble, UserMessageBubble, ChatInputFooter } from '@/app/_components/chat';

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<ChatThread | undefined>(undefined);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingMessageIdRef = useRef(0);

  const isNewChat = params?.id === 'new';

  useEffect(() => {
    if (!params?.id || isNewChat) return;
    setThread(getThread(params.id));
  }, [params?.id, isNewChat]);

  const messages = useMemo(() => thread?.messages ?? [], [thread]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, pendingMessage, isProcessing]);

  const handleNewChatCreation = async (content: string) => {
    setIsProcessing(true);
    setPendingMessage(content);
    setInput('');

    const result = await createNewChatWithMessage(content);

    if (result.success && result.thread) {
      setThread(result.thread);
      setPendingMessage('');
      router.replace(`/chat/${result.thread.id}`);
      setIsProcessing(false);
      return;
    }

    // 에러 처리
    if (result.shouldRetry) {
      const shouldRetry = window.confirm('응답 시간이 초과되었습니다. 다시 시도하시겠습니까?');
      if (shouldRetry) {
        setPendingMessage('');
        setIsProcessing(false);
        setInput(content); // 원본 내용 복원
        setTimeout(() => sendUserMessage(), 0);
        return;
      }
    } else {
      alert(`${getErrorMessage(result.error)}\n잠시 후 다시 시도해 주세요.`);
    }

    setPendingMessage('');
    setIsProcessing(false);
  };

  const handleExistingChatMessage = async (content: string) => {
    if (!thread || !params?.id) {
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
    setIsProcessing(true);

    const result = await sendMessageToExistingChat(params.id, content, tempMessageId);

    if (result.success && result.updatedThread) {
      setThread(result.updatedThread);
    } else {
      alert(`${getErrorMessage(result.error)}\n다시 시도해 주세요.`);
      upsertThread(previousThread);
      setThread(previousThread);
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

  // 새 채팅이 아닌데 스레드가 없는 경우에만 에러 표시
  if (!isNewChat && !thread) {
    return (
      <main className='flex-1 p-4 flex items-center justify-center text-sm text-black/60'>
        존재하지 않는 대화입니다.
      </main>
    );
  }

  return (
    <>
      <div ref={listRef} className='flex-1 overflow-auto p-4 space-y-3'>
        {messages.map((m: ChatMessage) =>
          m.role === 'user' ? (
            <UserMessageBubble key={m.id} content={m.content} />
          ) : (
            <AssistantMessageBubble key={m.id} content={m.content} />
          )
        )}
        {pendingMessage && <UserMessageBubble content={pendingMessage} />}
        {isProcessing && <AssistantMessageBubble isLoading={true} />}
        {/* visualization placeholder */}
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