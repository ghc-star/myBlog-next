import SkeletonBlock from "@/components/layout/Skeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
      <SkeletonBlock className="mb-6 h-14 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-44 rounded-2xl" />
        <SkeletonBlock className="h-44 rounded-2xl" />
        <SkeletonBlock className="h-44 rounded-2xl" />
        <SkeletonBlock className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}
