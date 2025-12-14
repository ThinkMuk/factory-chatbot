'use client';

import Link from 'next/link';
import ChatRoomList from '@/app/_components/ChatRoomList';

export default function Home() {
  return (
    <div className='h-full flex flex-col relative'>
      <main className='flex-1 min-h-0'>
        <ChatRoomList useLink />
      </main>
      <Link
        href='/chat/new'
        className='absolute bottom-5 left-4 w-[50px] h-[50px] rounded-full bg-[#194268] text-white flex items-center justify-center text-3xl shadow-lg pb-1'
        aria-label='새 채팅 시작'
      >
        +
      </Link>
    </div>
  );
}

