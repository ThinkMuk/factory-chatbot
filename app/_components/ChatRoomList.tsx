"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ChatRoom } from "@/app/types";
import { deleteChatRoom as deleteChatRoomApi } from "@/app/_api/chat";
import { useChatRoomList } from "@/app/_hooks/useChatRoomList";
import { deleteThread } from "@/app/_lib/storage";
import { joinRoomNameChunks } from "@/app/_lib/roomNameUtils";
import ThreadListItem from "@/app/_components/ThreadListItem";

type ChatRoomListProps = {
  onRoomClick?: (room: ChatRoom) => void;
  useLink?: boolean; // true면 "chat/:roomId" 로 이동
};

export default function ChatRoomList({ onRoomClick, useLink = false }: ChatRoomListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { rooms, isLoading, loadMore, refresh, setCachedThreads } = useChatRoomList();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const uniqueRooms = useMemo(() => {
    const seen = new Set<string>();
    return rooms.filter((room) => {
      const id = String(room.roomId);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [rooms]);

  const hasRooms = uniqueRooms.length > 0;

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [loadMore]);

  const handleDeleteChatRoom = useCallback(
    async (roomId: string) => {
      setDeletingRoomId(roomId);
      try {
        await deleteChatRoomApi(roomId);
        setCachedThreads((prev) => prev.filter((room) => room.roomId !== roomId));
        deleteThread(roomId);
        if (pathname === `/chat/${roomId}`) {
          router.push("/");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        alert(message);
        throw error;
      } finally {
        setDeletingRoomId(null);
      }
    },
    [pathname, router, setCachedThreads]
  );

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between px-4 py-2'>
        <div className='text-[16px] font-semibold text-[#44526B]'>채팅방 목록</div>
        <button
          onClick={() => refresh()}
          className='text-[12px] px-3 py-1 rounded-md bg-[#194268] text-white disabled:opacity-60'
          disabled={isLoading}
        >
          새로고침
        </button>
      </div>

      <div className='flex-1 overflow-auto px-4'>
        {!hasRooms ? (
          <div className='h-full flex items-center justify-center'>
            {isLoading ? (
              <div className='text-sm text-black/60'>불러오는 중...</div>
            ) : (
              <div className='text-sm text-black/60'>표시할 채팅방이 없습니다.</div>
            )}
          </div>
        ) : (
          <ul className='space-y-2'>
            {uniqueRooms.map((room) => {
              const normalizedRoomName = joinRoomNameChunks(room.roomName) || "새 채팅";
              return (
                <ThreadListItem
                  key={room.roomId}
                  id={room.roomId}
                  title={normalizedRoomName}
                  subtitle={room.date}
                  href={useLink ? `/chat/${room.roomId}` : undefined}
                  onClick={!useLink ? () => (onRoomClick ? onRoomClick(room) : console.log("room click", room)) : undefined}
                  onDelete={handleDeleteChatRoom}
                  isDeleting={deletingRoomId === room.roomId}
                />
              );
            })}
          </ul>
        )}
        <div ref={sentinelRef} className='h-8' />
      </div>
    </div>
  );
}


