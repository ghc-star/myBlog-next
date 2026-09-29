import SkeletonBlock from "@/components/layout/Skeleton";

export default function EssayLoading() {
  return (
    <div className="px-4 pt-5 pb-16 sm:px-6">
      <div className="mx-auto w-full max-w-[880px] overflow-hidden rounded-3xl shadow-[var(--shadow-card)]">
        <SkeletonBlock className="h-[200px] rounded-none sm:h-[240px]" />
        <div className="space-y-4 border-x border-b border-(--border-card) bg-(--card-bg) px-4 py-6 sm:px-7 sm:py-8">
          <SkeletonBlock className="h-24 rounded-2xl" />
          <SkeletonBlock className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
