'use client';

type LoadingDotMotionsProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots' | 'text';
  text?: string;
  className?: string;
};

const sizeClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

export default function LoadingDotMotions({
  size = 'md',
  variant = 'dots',
  text = '불러오는 중...',
  className = ''
}: LoadingDotMotionsProps) {
  if (variant === 'text') {
    return (
      <div className={`text-sm text-black/60 ${className}`}>
        {text}
      </div>
    );
  }

  // dots variant
  const dotSize = sizeClasses[size];

  return (
    <div className={`flex gap-1 ${className}`}>
      <span className={`${dotSize} rounded-full bg-gray-400 animate-bounce`} />
      <span className={`${dotSize} rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]`} />
      <span className={`${dotSize} rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]`} />
    </div>
  );
}
