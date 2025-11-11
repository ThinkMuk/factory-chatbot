type ReplyMessageBubbleProps = {
  content: string;
};

export default function AssistantMessageBubble({ content }: ReplyMessageBubbleProps) {
  return (
    <div className="text-left">
      <div className="inline-block max-w-[85%] outline-1 outline-[#DCDCDC] rounded-t-3xl rounded-br-3xl px-3 py-2 text-sm bg-[#FAFBFD] text-black">
        {content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}


