import SkeletonBlock from "@/components/layout/Skeleton";

export default function Loading() {
  return (
    <div className="my-3 flex flex-col gap-5">
      <SkeletonBlock className="h-44 rounded-2xl" />
      <SkeletonBlock className="h-44 rounded-2xl" />
      <SkeletonBlock className="h-44 rounded-2xl" />
    </div>
  );
}
