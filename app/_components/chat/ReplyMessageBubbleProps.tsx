type ReplyMessageBubbleProps = {
  content: string;
};

export default function AssistantMessageBubble({ content }: ReplyMessageBubbleProps) {
  return (
    <div className="text-left">
      <div className="inline-block max-w-[85%] rounded-md px-3 py-2 text-sm bg-black/5 text-black">
        {content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}


