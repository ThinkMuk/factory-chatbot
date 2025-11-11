'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChatThread } from './types';
import { getThreads, deleteThread } from './lib/storage';
import ThreadListItem from '@/app/components/ThreadListItem';

export default function Home() {
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    setThreads(getThreads());
  }, []);

  const hasThreads = useMemo(() => threads.length > 0, [threads]);

  const handleDelete = (id: string) => {
    deleteThread(id);
    setThreads(getThreads());
  };

  return (
    <div className='h-full flex flex-col'>
      <main className='flex-1 overflow-auto px-4'>
        {!hasThreads ? (
          <div className='h-full flex items-center justify-center'>
            <div className='text-center text-sm text-black/60'>
              대화가 없습니다. 오른쪽 하단의 + 버튼으로 새 채팅을 시작하세요.
            </div>
          </div>
        ) : (
          <ul className='space-y-2'>
            {threads.map((t) => (
              <ThreadListItem key={t.id} id={t.id} title={t.title} updatedAt={t.updatedAt} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </main>
      <Link
        href='/chat/new'
        className='absolute bottom-20 left-4 w-[50px] h-[50px] rounded-full bg-[#194268] text-white flex items-center justify-center text-2xl'
      >
        +
      </Link>
    </div>
  );
}
