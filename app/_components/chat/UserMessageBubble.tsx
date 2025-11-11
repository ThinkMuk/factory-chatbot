type UserMessageBubbleProps = {
  content: string;
};

export default function UserMessageBubble({ content }: UserMessageBubbleProps) {
  return (
    <div className="text-right">
      <div className="inline-block max-w-[85%] rounded-md px-3 py-2 text-sm bg-black text-white">
        {content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}


