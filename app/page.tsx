'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChatThread } from './types';
import { getThreads, deleteThread } from './lib/storage';

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
      <main className='flex-1 overflow-auto p-4'>
        {!hasThreads ? (
          <div className='h-full flex items-center justify-center'>
            <div className='text-center text-sm text-black/60'>
              대화가 없습니다. 오른쪽 하단의 + 버튼으로 새 채팅을 시작하세요.
            </div>
          </div>
        ) : (
          <ul className='space-y-2'>
            {threads.map((t) => (
              <li key={t.id} className='border border-black/10 rounded-md p-3 flex items-center justify-between'>
                <Link href={`/chat/${t.id}`} className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-medium'>{t.title}</div>
                  <div className='text-xs text-black/50 mt-1'>{new Date(t.updatedAt).toLocaleString()}</div>
                </Link>
                <button
                  className='ml-3 text-xs px-2 py-1 rounded border border-black/10 hover:bg-black/5'
                  onClick={() => handleDelete(t.id)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Link
        href='/chat'
        className='absolute bottom-20 right-4 w-[55px] h-[55px] rounded-full bg-[#194268] text-white flex items-center justify-center text-2xl'
      >
        +
      </Link>
    </div>
  );
}
