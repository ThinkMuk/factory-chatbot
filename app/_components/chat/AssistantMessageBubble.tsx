'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import LoadingDotMotions from '@/app/_components/LoadingDotMotions';

type AssistantMessageBubbleProps = {
  content?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  onTypingComplete?: () => void;
  onStreamingProgress?: () => void;
};

const ANIMATION_CONFIG = {
  STREAMING_DELAY_MS: 20,
  FINALIZING_DELAY_MS: 1,
  STREAMING_DURATION: 0.15,
  FINALIZING_DURATION: 0.05,
} as const;

type TextSegment = {
  text: string;
  shouldAnimate: boolean;
};

export default function AssistantMessageBubble({
  content,
  isLoading = false,
  isStreaming = false,
  onTypingComplete,
  onStreamingProgress,
}: AssistantMessageBubbleProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(isStreaming);
  const [prevDisplayedLength, setPrevDisplayedLength] = useState(0);
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
      setPrevDisplayedLength(displayedLength);
      setDisplayedLength((prev) => Math.min(prev + 1, textContent.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldAnimate, displayedLength, textContent, isStreaming, onTypingComplete]);

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    onStreamingProgress?.();
  }, [displayedLength, shouldAnimate, onStreamingProgress]);

  // 표시할 텍스트만 추출
  const isTyping = shouldAnimate && displayedLength < textContent.length;

  // 고정된 부분과 새로운 글자 분리
  const segments = useMemo<TextSegment[]>(() => {
    if (!isTyping) {
      return [{ text: textContent.slice(0, displayedLength), shouldAnimate: false }];
    }

    const fixedText = textContent.slice(0, prevDisplayedLength);
    const newChar = textContent.slice(prevDisplayedLength, displayedLength);

    const result: TextSegment[] = [];
    if (fixedText) {
      result.push({ text: fixedText, shouldAnimate: false });
    }
    if (newChar) {
      result.push({ text: newChar, shouldAnimate: true });
    }
    return result;
  }, [isTyping, textContent, prevDisplayedLength, displayedLength]);

  return (
    <div className='text-left'>
      <div className='inline-block max-w-[85%] outline-1 outline-[#DCDCDC] rounded-t-3xl rounded-br-3xl px-3 py-2 text-sm bg-[#FAFBFD] text-black'>
        {isLoading ? (
          <LoadingDotMotions size="md" className="py-1" />
        ) : (
          <div className="whitespace-pre-wrap">
            {segments.map((segment, segmentIndex) =>
              segment.shouldAnimate ? (
                <motion.span
                  key={`anim-${segmentIndex}-${prevDisplayedLength}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: isStreaming
                      ? ANIMATION_CONFIG.STREAMING_DURATION
                      : ANIMATION_CONFIG.FINALIZING_DURATION,
                    ease: 'easeOut',
                  }}
                >
                  {segment.text}
                </motion.span>
              ) : (
                <span key={`fixed-${segmentIndex}`}>{segment.text}</span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
