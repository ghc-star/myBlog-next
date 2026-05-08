import { Suspense } from "react";
import ArchivePanel from "../sidebar/ArchivePanel";
import CategoryPanel from "../sidebar/CategoryPanel";
import SearchBox from "../sidebar/SearchBox";

function RightSidebar() {
  return (
    <aside className="hidden lg:fixed lg:bottom-6 lg:right-6 lg:top-6 lg:block lg:w-[240px] lg:overflow-y-auto lg:p-4">
      <Suspense fallback={<div className="h-16 rounded-xl bg-[var(--card-bg)]" />}>
        <SearchBox />
      </Suspense>
      <ArchivePanel />
      <CategoryPanel />
    </aside>
  );
}

export default RightSidebar;
