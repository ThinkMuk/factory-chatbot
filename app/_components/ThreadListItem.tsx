'use client';

import Link from 'next/link';
import { MessagesSquare, Trash2 } from 'lucide-react';

export type ThreadListItemProps = {
  id: string;
  title: string;
  updatedAt: number;
  onDelete: (id: string) => void;
};

export default function ThreadListItem({ id, title, updatedAt, onDelete }: ThreadListItemProps) {
  return (
    <li className='border border-[#DCDCDC] bg-[#FAFBFD] rounded-2xl p-3 my-3 flex items-center justify-between transition-colors has-[a:hover]:bg-[#e8f0fa] has-[a:hover]:border-[#C7D2E1]'>
      <Link href={`/chat/${id}`} className='min-w-0 flex-1 flex items-center gap-4'>
        <MessagesSquare className='w-[32px] h-[32px] text-[#1A466D]' />
        <div className='min-w-0 flex-1'>
          <div className='truncate text-[18px] font-medium text-[#44526B]'>{title}</div>
          <div className='text-[12px] text-[#A8B3C8] font-bold mt-1'>{new Date(updatedAt).toLocaleString()}</div>
        </div>
      </Link>
      <button
        onClick={() => onDelete(id)}
        className='text-[#DE7373]/80 hover:text-[#DE7373] p-1 rounded-md hover:bg-black/5'
      >
        <Trash2 className='w-[24px] h-[24px]' />
      </button>
    </li>
  );
}


