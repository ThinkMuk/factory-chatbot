'use client';

interface ChatInputFooterProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  isProcessing: boolean;
  isNewChat?: boolean;
}

export default function ChatInputFooter({
  input,
  setInput,
  onSendMessage,
  isProcessing,
  isNewChat = false,
}: ChatInputFooterProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 IME 조합 중 Enter 입력은 무시
    if ((e.nativeEvent as KeyboardEvent).isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <footer className='p-2'>
      <div className='flex gap-2'>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='메시지를 입력하세요'
          disabled={isProcessing}
          className='flex-1 h-[110px] border bg-[#FAFBFD] border-[#DCDCDC] rounded-2xl p-3 text-base leading-5 outline-none focus:ring-1 focus:ring-[#d0cfcf] resize-none disabled:opacity-75 disabled:cursor-not-allowed'
        />
        <button
          onClick={onSendMessage}
          disabled={isProcessing || !input.trim()}
          className='h-[110px] px-4 rounded-2xl bg-[#194268] text-white cursor-pointer text-base font-bold hover:bg-[#103453] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isProcessing ? (isNewChat ? '생성 중...' : '전송 중...') : '전송'}
        </button>
      </div>
    </footer>
  );
}
