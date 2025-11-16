'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type CommonModalProps = {
  isOpen: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function CommonModal({
  isOpen,
  title = '확인',
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: CommonModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    (
      <div
        className='fixed inset-0 z-[9999] bg-black/50 w-screen h-screen flex items-center justify-center'
        role='dialog'
        aria-modal='true'
        aria-labelledby='common-modal-title'
      >
        <div className='bg-white rounded-2xl shadow-lg w-[90%] max-w-[380px]'>
          <div className='px-5 py-4 border-b border-black/10'>
            <h2 id='common-modal-title' className='text-[18px] font-semibold text-[#1A1A1A]'>
              {title}
            </h2>
          </div>
          <div className='px-5 py-4'>
            {typeof description === 'string' ? (
              <p className='text-[14px] text-[#44526B]'>{description}</p>
            ) : (
              description
            )}
          </div>
          <div className='px-5 py-3 border-t border-black/10 flex items-center justify-end gap-2'>
            <button
              onClick={onCancel}
              className='px-4 py-2 rounded-md text-[14px] font-medium text-[#44526B] hover:bg-black/5'
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className='px-4 py-2 rounded-md text-[14px] font-semibold bg-[#17437C] text-white hover:bg-[#12365f]'
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}