'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type AssistantMessageBubbleProps = {
  content?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  onTypingComplete?: () => void;
};

const ANIMATION_CONFIG = {
  STREAMING_DELAY_MS: 20,
  FINALIZING_DELAY_MS: 1,
  STREAMING_DURATION: 0.15,
  FINALIZING_DURATION: 0.05,
} as const;

export default function AssistantMessageBubble({
  content,
  isLoading = false,
  isStreaming = false,
  onTypingComplete,
}: AssistantMessageBubbleProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(isStreaming);
  const textContent = content ?? '';

  useEffect(() => {
    if (isStreaming) {
      setShouldAnimate(true);
      return;
    }
    if (!shouldAnimate) {
      setDisplayedLength(textContent.length);
    }
  }, [isStreaming, shouldAnimate, textContent.length]);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedLength(textContent.length);
      return;
    }

    if (displayedLength >= textContent.length) {
      if (!isStreaming && shouldAnimate) {
        setShouldAnimate(false);
        onTypingComplete?.();
      }
      return;
    }

    const delay = isStreaming ? ANIMATION_CONFIG.STREAMING_DELAY_MS : ANIMATION_CONFIG.FINALIZING_DELAY_MS;
    const timer = setTimeout(() => {
      setDisplayedLength((prev) => Math.min(prev + 1, textContent.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldAnimate, displayedLength, textContent, isStreaming, onTypingComplete]);

  // 표시할 텍스트만 추출
  const isTyping = shouldAnimate && displayedLength < textContent.length;
  const displayedText = isTyping ? textContent.slice(0, displayedLength) : textContent;
  const displayLines = displayedText.split('\n');

  return (
    <div className='text-left'>
      <div className='inline-block max-w-[85%] outline-1 outline-[#DCDCDC] rounded-t-3xl rounded-br-3xl px-3 py-2 text-sm bg-[#FAFBFD] text-black'>
        {isLoading ? (
          <div className='flex gap-1 py-1'>
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce' />
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]' />
            <span className='w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]' />
          </div>
        ) : (
          <div>
            {displayLines.map((line, lineIndex) => (
              <p key={lineIndex}>
                {isTyping
                  ? line.split('').map((char, charIndex) => (
                      <motion.span
                        key={`${lineIndex}-${charIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: isStreaming ? ANIMATION_CONFIG.STREAMING_DURATION : ANIMATION_CONFIG.FINALIZING_DURATION,
                          delay: 0,
                          ease: 'easeOut',
                        }}
                      >
                        {char}
                      </motion.span>
                    ))
                  : line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
