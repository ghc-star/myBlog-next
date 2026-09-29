interface SkeletonBlockProps {
  className?: string;
  children?: React.ReactNode;
}

/** 导航加载占位用的通用骨架块 */
export default function SkeletonBlock({
  className = "h-24 rounded-2xl",
  children,
}: SkeletonBlockProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse border border-[var(--border-card)] bg-[var(--card-bg)] ${className}`}
    >
      {children}
    </div>
  );
}
