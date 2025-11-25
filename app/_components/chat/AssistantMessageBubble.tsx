type AssistantMessageBubbleProps = {
  content?: string;
  isLoading?: boolean;
};

export default function AssistantMessageBubble({ content, isLoading = false }: AssistantMessageBubbleProps) {
  return (
    <div className="text-left">
      <div className="inline-block max-w-[85%] outline-1 outline-[#DCDCDC] rounded-t-3xl rounded-br-3xl px-3 py-2 text-sm bg-[#FAFBFD] text-black">
        {isLoading ? (
          <div className='flex gap-1 py-1'>
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce' />
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]' />
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]' />
          </div>
        ) : (
          content?.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))
        )}
      </div>
    </div>
  );
}


