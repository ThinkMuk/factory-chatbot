"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatRoom } from "@/app/types";
import { ChatApiConstants, fetchChatRooms } from "@/app/_lib/chatRoomList";
import { clearChatRooms, loadChatRooms, saveChatRooms } from "@/app/_lib/chatRoomsStorage";

type UseChatRoomListReturn = {
  rooms: ChatRoom[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setCachedThreads: (updater: (prev: ChatRoom[]) => ChatRoom[]) => void;
};

export function useChatRoomList(): UseChatRoomListReturn {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  // 로컬 헬퍼 함수
  const saveToLocal = useCallback((next: ChatRoom[]) => {
    saveChatRooms(next);
  }, []);

  const loadFromLocal = useCallback((): ChatRoom[] => {
    return loadChatRooms();
  }, []);

  const setCachedThreads = useCallback(
    (updater: (prev: ChatRoom[]) => ChatRoom[]) => {
      setRooms((prev) => {
        const next = updater(prev);
        saveToLocal(next);
        return next;
      });
    },
    [saveToLocal]
  );

  const initChatRoomList = useCallback(async () => {
    // 먼저 로컬 저장소에서 불러오기
    const local = loadFromLocal();
    if (local.length === 0) {
      setIsLoading(true);
      try {
        const res = await fetchChatRooms({ size: ChatApiConstants.DEFAULT_PAGE_SIZE });
        const next = res.chatRooms;
        if (!isMountedRef.current) return;
        setRooms(next);
        setHasMore(next.length === ChatApiConstants.DEFAULT_PAGE_SIZE);
        saveToLocal(next);
      } catch (err) {
        console.error(err);
        alert("네트워크 오류가 발생했습니다. 나중에 다시 시도해주세요.");
        // 오류가 나도 로컬(비어 있어도 됨)을 계속 표시
        setRooms([]);
        setHasMore(true);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    } else {
      setRooms(local);
      // 더 있는지는 알 수 없으므로 추가 로딩 허용
      setHasMore(true);
    }
  }, [loadFromLocal, saveToLocal]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    if (rooms.length === 0) {
      // 아직 방이 없으면 초기화 로직으로 대체 실행
      await initChatRoomList();
      return;
    }
    // 무한스크롤은 과거 방향으로 불러오기 (목록의 마지막 roomId 사용)
    const oldestRoomId = rooms[rooms.length - 1]?.roomId;
    if (!oldestRoomId) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchChatRooms({
        lastRoomId: oldestRoomId,
        size: ChatApiConstants.DEFAULT_PAGE_SIZE,
      });
      // roomId 기준으로 중복 제거
      const existingIds = new Set(rooms.map((r) => r.roomId));
      const newItems = res.chatRooms.filter((r: ChatRoom) => !existingIds.has(r.roomId));
      // 과거 방향이므로 기존 목록 뒤에 추가
      const next = rooms.concat(newItems);
      if (!isMountedRef.current) return;
      setRooms(next);
      // 로컬 저장은 saveChatRooms가 자동으로 최신 10개만 저장
      saveToLocal(next);
      setHasMore(res.chatRooms.length === ChatApiConstants.DEFAULT_PAGE_SIZE);
    } catch (err) {
      console.error(err);
      alert("더 불러오기에 실패했습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      if (isMountedRef.current) setIsLoadingMore(false);
    }
  }, [hasMore, initChatRoomList, isLoading, isLoadingMore, rooms, saveToLocal]);

  const refresh = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetchChatRooms({ size: ChatApiConstants.DEFAULT_PAGE_SIZE });
      const next = res.chatRooms;
      if (!isMountedRef.current) return;
      setRooms(next);
      setHasMore(next.length === ChatApiConstants.DEFAULT_PAGE_SIZE);
      clearChatRooms();
      saveToLocal(next);
    } catch (err) {
      console.error(err);
      alert("새로고침에 실패했습니다. 네트워크 상태를 확인해주세요.");
      // 기존 목록은 그대로 유지
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [isLoading, saveToLocal]);

  useEffect(() => {
    isMountedRef.current = true;
    initChatRoomList();
    return () => {
      isMountedRef.current = false;
    };
  }, [initChatRoomList]);

  return useMemo(
    () => ({
      rooms,
      isLoading,
      isLoadingMore,
      hasMore,
      loadMore,
      refresh,
      setCachedThreads,
    }),
    [rooms, isLoading, isLoadingMore, hasMore, loadMore, refresh, setCachedThreads]
  );
}

export type { UseChatRoomListReturn };


