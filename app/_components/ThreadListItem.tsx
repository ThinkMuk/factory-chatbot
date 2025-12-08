'use client';

import Link from 'next/link';
import { MessagesSquare, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CommonModal from './CommonModal';

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Seoul',
});

function formatUpdatedAt(timestamp?: number) {
  if (!timestamp) {
    return '';
  }
  try {
    return UPDATED_AT_FORMATTER.format(new Date(timestamp));
  } catch {
    return '';
  }
}

export type ThreadListItemProps = {
  id: string;
  title: string;
  updatedAt?: number;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  onDelete?: (id: string) => Promise<void>;
  hideDeleteButton?: boolean;
  isDeleting?: boolean;
};

export default function ThreadListItem({
  id,
  title,
  updatedAt,
  subtitle,
  href,
  onClick,
  onDelete,
  hideDeleteButton,
  isDeleting,
}: ThreadListItemProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const normalizedHref = useMemo(() => {
    if (href) return href;
    if (onClick) return undefined;
    return `/chat/${id}`;
  }, [href, id, onClick]);
  const formattedUpdatedAt = useMemo(() => formatUpdatedAt(updatedAt), [updatedAt]);
  const secondaryText = subtitle ?? formattedUpdatedAt;
  const showDeleteButton = !hideDeleteButton;
  const hasDelete = typeof onDelete === 'function';
  const interactiveClass = 'min-w-0 flex-1 flex items-center gap-4';

  const content = (
    <>
      <MessagesSquare className='w-[32px] h-[32px] text-[#1A466D]' />
      <div className='min-w-0 flex-1'>
        <div className='truncate text-[18px] font-medium text-[#44526B]'>{title}</div>
        {secondaryText && <div className='text-[12px] text-[#A8B3C8] font-bold mt-1'>{secondaryText}</div>}
      </div>
    </>
  );

  return (
    <>
      <li className='border border-[#DCDCDC] bg-[#FAFBFD] rounded-2xl p-3 my-3 flex items-center justify-between transition-colors has-[a:hover]:bg-[#e8f0fa] has-[a:hover]:border-[#C7D2E1] has-[button:hover]:bg-[#e8f0fa] has-[button:hover]:border-[#C7D2E1]'>
        {normalizedHref ? (
          <Link href={normalizedHref} className={interactiveClass}>
            {content}
          </Link>
        ) : (
          <button type='button' onClick={onClick} className={`${interactiveClass} text-left`}>
            {content}
          </button>
        )}
        {showDeleteButton && (
          <button
            type='button'
            disabled={isDeleting}
            onClick={() => {
              if (!hasDelete) {
                console.warn('ThreadListItem: onDelete 핸들러가 설정되지 않았습니다. 모달만 표시합니다.');
              }
              setIsConfirmOpen(true);
            }}
            className='text-[#DE7373]/80 hover:text-[#DE7373] p-1 rounded-md hover:bg-black/5 ml-3 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Trash2 className='w-[24px] h-[24px]' />
          </button>
        )}
      </li>

      {showDeleteButton && (
        <CommonModal
          isOpen={isConfirmOpen}
          title='삭제 확인'
          description={
            <div className='space-y-1'>
              <p>해당 대화를 삭제하시겠습니까?</p>
              <p className='text-[12px] text-[#A8B3C8]'>제목: {title}</p>
            </div>
          }
          confirmDisabled={isDeleting}
          cancelText='취소'
          confirmText={isDeleting ? '삭제 중...' : '확인'}
          onConfirm={async () => {
            if (!hasDelete || !onDelete) {
              setIsConfirmOpen(false);
              return;
            }
            try {
              await onDelete(id);
              setIsConfirmOpen(false);
            } catch (error) {
              console.error('채팅방 삭제 실패:', error);
            }
          }}
          onCancel={() => {
            setIsConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}


