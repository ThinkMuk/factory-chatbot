"use client";

export const TEMP_ROOM_TITLE_EVENT = 'chat:temp-room-title';

export type TempRoomTitleDetail = {
  roomId: string;
  title?: string;
};

export function emitTempRoomTitle(detail: TempRoomTitleDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<TempRoomTitleDetail>(TEMP_ROOM_TITLE_EVENT, { detail }));
}

