"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage, ChatThread } from "@/app/types";
import { upsertThread } from "@/app/lib/storage";
import { mockCreateThreadFromFirstMessage } from "@/app/mock";

export default function ChatRootPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const send = () => {
    const content = input.trim();
    if (!content) return;

    const thread: ChatThread = mockCreateThreadFromFirstMessage(content);

    // 로컬 즉시 반영
    setMessages(thread.messages);
    setInput("");
    upsertThread(thread);
    router.replace(`/chat/${thread.id}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] rounded-md px-3 py-2 text-sm " +
                (m.role === "user" ? "bg-black text-white" : "bg-black/5 text-black")
              }
            >
              {m.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="border-t border-black/10 p-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME Enter 입력은 무시 (부분 문자열 전송 방지)
              if ((e.nativeEvent as KeyboardEvent).isComposing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="메시지를 입력하세요"
            className="flex-1 border border-black/10 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
          <button onClick={send} className="h-10 px-4 rounded-md bg-black text-white text-sm">
            보내기
          </button>
        </div>
      </footer>
    </div>
  );
}


