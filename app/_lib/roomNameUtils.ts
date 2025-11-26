export type RoomNameValue = string | string[] | undefined | null;

export function joinRoomNameChunks(value: RoomNameValue): string {
  if (Array.isArray(value)) {
    return value.join("");
  }
  return typeof value === "string" ? value : "";
}

export function isValidRoomNameValue(value: unknown): value is string | string[] {
  if (typeof value === "string") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((chunk) => typeof chunk === "string");
  }
  return false;
}

