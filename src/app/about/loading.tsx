import SkeletonBlock from "@/components/layout/Skeleton";

export default function AboutLoading() {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-10 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
