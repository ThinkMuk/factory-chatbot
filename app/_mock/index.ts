import { ChatMessage, ChatThread } from "@/app/types";

export function mockSummarizeTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "새 채팅";
  const oneLine = trimmed.replace(/\s+/g, " ");
  return oneLine.length > 20 ? oneLine.slice(0, 20) + "…" : oneLine;
}

export function mockAssistantReply(userContent: string): string {
  const summary = `요청하신 내용("${userContent}")을 WISE-PaaS 데이터로 요약한 결과입니다.`;
  const vizHint = "[시각화] 막대/선형 차트 예시 영역";
  return `${summary}\n\n${vizHint}`;
}

export function mockCreateThreadFromFirstMessage(content: string): ChatThread {
  const now = Date.now();
  const threadId = crypto.randomUUID();
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: now,
  };
  const assistantMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: mockAssistantReply(content),
    createdAt: now + 1,
  };
  return {
    id: threadId,
    title: mockSummarizeTitle(content),
    createdAt: now,
    updatedAt: now + 1,
    messages: [userMsg, assistantMsg],
  };
}


