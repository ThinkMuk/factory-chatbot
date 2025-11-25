type UserMessageBubbleProps = {
  content: string;
};

export default function UserMessageBubble({ content }: UserMessageBubbleProps) {
  return (
    <div className="text-right">
      <div className="inline-block text-left max-w-[85%] rounded-t-3xl rounded-bl-3xl px-3 py-2 text-sm bg-[#194268] text-white">
        {content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}


