"use client";

import { useParams } from 'next/navigation';
import { AssistantMessageBubble, ChatInputFooter, UserMessageBubble } from '@/app/_components/chat';
import LoadingDotMotions from '@/app/_components/LoadingDotMotions';
import { useAutoScroll } from '@/app/_hooks/useAutoScroll';
import { useChatHistory } from '@/app/_hooks/useChatHistory';
import { useChatMessaging } from '@/app/_hooks/useChatMessaging';

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params?.id;

  const {
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
  } = useChatMessaging({ routeId });

  const { isLoadingHistory } = useChatHistory({
    routeId,
    activeRoomId,
    setResolvedRoomId,
    setMessages,
  });

  const { listRef, handleScroll, handleStreamingProgress } = useAutoScroll({
    messagesLength: messages.length,
    pendingMessage,
    isProcessing,
    streamingAnswer,
  });

  if (isLoadingHistory) {
    return (
      <main className='flex-1 p-4 flex items-center justify-center'>
        <LoadingDotMotions variant='text' text='채팅을 불러오는 중...' />
      </main>
    );
  }

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
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessageBubble key={message.id} content={message.content} />
          ) : (
            <AssistantMessageBubble key={message.id} content={message.content} />
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