"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadChatRooms } from "@/app/_lib/chatRoomsStorage";
import { Undo2 } from "lucide-react";
import { TEMP_ROOM_TITLE_EVENT, TempRoomTitleDetail } from '@/app/_lib/chatEvents';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [tempTitles, setTempTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanGoBack(pathname !== '/' && window.history.length > 1);
    }
  }, [pathname]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TempRoomTitleDetail>).detail;
      if (!detail?.roomId) return;
      setTempTitles((prev) => {
        if (detail.title) {
          if (prev[detail.roomId] === detail.title) return prev;
          return {
            ...prev,
            [detail.roomId]: detail.title,
          };
        }
        if (!(detail.roomId in prev)) return prev;
        const next = { ...prev };
        delete next[detail.roomId];
        return next;
      });
    };
    window.addEventListener(TEMP_ROOM_TITLE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TEMP_ROOM_TITLE_EVENT, handler as EventListener);
    };
  }, []);

  const title = useMemo(() => {
    if (!pathname) return 'Factory Chatbot';
    if (pathname.startsWith('/chat/')) {
      const id = pathname.split('/')[2];
      if (id === 'new') return '새 채팅';
      const tempTitle = id ? tempTitles[id] : undefined;
      // Defer localStorage access until after hydration to avoid SSR mismatch
      if (!hasMounted) return tempTitle ?? '채팅';
      const chatRooms = loadChatRooms();
      const room = id ? chatRooms.find(r => r.roomId === id) : undefined;
      const roomName = room?.roomName;
      const displayName = Array.isArray(roomName) ? roomName.join('') : roomName;
      return displayName ?? tempTitle ?? '채팅';
    }
    return 'Factory Chatbot';
  }, [pathname, hasMounted, tempTitles]);

  return (
    <header className='h-12 flex items-center bg-[#323233] justify-between border-b border-black/10 px-4'>
      <div className='w-10'>
        {canGoBack ? (
          <button className='text-sm text-white cursor-pointer' onClick={() => router.push('/')}>
            <Undo2 className='w-[18px] h-[18px]' />
          </button>
        ) : null}
      </div>
      <h1 className='text-base text-white font-semibold truncate max-w-[220px]'>{title}</h1>
      <div className='w-10' />
    </header>
  );
}


