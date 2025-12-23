export const getActiveRoomId = (resolvedRoomId?: string, routeId?: string) => {
  if (resolvedRoomId) return resolvedRoomId;
  if (routeId && routeId !== 'new') return routeId;
  return undefined;
};

export const isNewChatRoute = (routeId?: string) => routeId === 'new';

export const isNewChat = (resolvedRoomId?: string, routeId?: string) => {
  return !getActiveRoomId(resolvedRoomId, routeId) && isNewChatRoute(routeId);
};


