"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage, ChatThread } from "@/app/types";
import { appendMessage, getThread, upsertThread } from '@/app/_lib/storage';
import { mockAssistantReply, mockCreateThreadFromFirstMessage } from '@/app/_mock';
import { AssistantMessageBubble, UserMessageBubble } from '@/app/_components/chat';

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<ChatThread | undefined>(undefined);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  // id가 'new'인 경우 스레드가 없는 상태로 시작
  const isNewChat = params?.id === 'new';

  useEffect(() => {
    if (!params?.id || isNewChat) return;
    setThread(getThread(params.id));
  }, [params?.id, isNewChat]);

  const messages = useMemo(() => thread?.messages ?? [], [thread]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendUserMessage = () => {
    const content = input.trim();
    if (!content) return;

    // 새 채팅인 경우: 첫 메시지로 스레드 생성
    if (isNewChat) {
      const newThread: ChatThread = mockCreateThreadFromFirstMessage(content);
      setThread(newThread);
      setInput('');
      upsertThread(newThread);
      router.replace(`/chat/${newThread.id}`);
      return;
    }

    // 기존 스레드에 메시지 추가
    if (!thread || !params?.id) return;
    const updated = appendMessage(params.id, { role: 'user', content });
    setThread(updated);
    setInput('');

    // mock assistant reply
    setTimeout(() => {
      const reply = mockAssistantReply(content);
      const after = appendMessage(params.id!, { role: 'assistant', content: reply });
      setThread(after);
    }, 400);
  };

  // 새 채팅이 아닌데 스레드가 없는 경우에만 에러 표시
  if (!isNewChat && !thread) {
    return (
      <div className='h-full flex flex-col'>
        <main className='flex-1 p-4 flex items-center justify-center text-sm text-black/60'>
          존재하지 않는 대화입니다.
        </main>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      <div ref={listRef} className='flex-1 overflow-auto p-4 space-y-3'>
        {messages.map((m: ChatMessage) =>
          m.role === 'user' ? (
            <UserMessageBubble key={m.id} content={m.content} />
          ) : (
            <AssistantMessageBubble key={m.id} content={m.content} />
          )
        )}
        {/* visualization placeholder */}
        {/* 가능하면 차트나 그래프로 해당 내용을 시각화하여 표시 */}
      </div>
      <footer className='p-2'>
        <div className='flex gap-2'>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter 입력은 무시
              if ((e.nativeEvent as KeyboardEvent).isComposing) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
              }
            }}
            placeholder='메시지를 입력하세요'
            className='flex-1 h-[110px] border bg-[#FAFBFD] border-[#DCDCDC] rounded-2xl p-3 text-sm outline-none focus:ring-1 focus:ring-[#d0cfcf] resize-none'
          />
          <button
            onClick={sendUserMessage}
            className='h-[110px] px-4 rounded-2xl bg-[#194268] text-white cursor-pointer text-base font-bold hover:bg-[#103453] transition-colors duration-200'
          >
            전송
          </button>
        </div>
      </footer>
    </div>
  );
}


