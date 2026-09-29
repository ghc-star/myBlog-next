import SkeletonBlock from "@/components/layout/Skeleton";

export default function ArchiveLoading() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <SkeletonBlock className="rounded-md px-6 py-8">
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-1/3 rounded-md" />
          <SkeletonBlock className="h-6 w-2/3 rounded-md" />
          <SkeletonBlock className="h-6 w-1/2 rounded-md" />
          <SkeletonBlock className="h-6 w-3/5 rounded-md" />
        </div>
      </SkeletonBlock>
    </div>
  );
}
