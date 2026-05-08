import AuthorCard from "../sidebar/AuthorCard";
import DesktopSidebarControls from "./DesktopSidebarControls";
import MobileSidebarMenu from "./MobileSidebarMenu";

function LeftSidebar() {
  return (
    <aside className="relative w-full shrink-0 border-b border-[var(--border-normal)] p-4 sm:sticky sm:top-0 sm:h-screen sm:w-[200px] sm:overflow-hidden sm:border-b-0">
      <div className="flex items-center justify-between sm:hidden">
        <AuthorCard />
        <MobileSidebarMenu />
      </div>

      <div className="hidden sm:block">
        <AuthorCard />
        <DesktopSidebarControls />
      </div>
    </aside>
  );
}

export default LeftSidebar;
