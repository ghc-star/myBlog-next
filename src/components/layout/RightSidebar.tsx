import { Suspense } from "react";
import ArchivePanel from "../sidebar/ArchivePanel";
import CategoryPanel from "../sidebar/CategoryPanel";
import SearchBox from "../sidebar/SearchBox";
import GitHub from "../sidebar/GitHub";

function RightSidebar() {
  return (
    <aside className="hidden lg:fixed lg:bottom-6 lg:right-6 lg:top-6 lg:block lg:w-[240px] lg:overflow-y-auto lg:p-4 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
      <Suspense
        fallback={<div className="h-16 rounded-xl bg-[var(--card-bg)]" />}
      >
        <SearchBox />
      </Suspense>
      <ArchivePanel />
      <CategoryPanel />
      <GitHub></GitHub>
    </aside>
  );
}

export default RightSidebar;
