export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

//서버 에러 응답을 메시지로 변환
export function buildErrorMessage(body: string, status: number, fallback: string): string {
  if (!body) {
    return `요청 실패 (${status}): ${fallback || "서버 오류가 발생했습니다."}`;
  }
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    if (parsed.message) return parsed.message;
    if (parsed.error) return parsed.error;
  } catch {
    // JSON을 파싱하지 못하면 본문 문자열을 그대로 사용
  }
  return `요청 실패 (${status}): ${body}`;
}

//다양한 에러를 가독성 있게 메시지로 변환
export function normalizeError(error: unknown): Error {
  if (error instanceof ChatApiError) {
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch")) {
      return new Error("네트워크 연결에 실패했습니다. 인터넷 상태를 확인해 주세요.");
    }
    return error;
  }
  return new Error("알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
}

