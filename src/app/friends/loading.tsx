import SkeletonBlock from "@/components/layout/Skeleton";

export default function FriendsLoading() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-10 sm:px-6">
      <SkeletonBlock className="mb-6 h-20 rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
