import RightSidebar from "./RightSidebar";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-transparent text-[var(--text-main)] lg:pr-[264px]">
      <main className="min-w-0 flex-1 bg-transparent p-4 sm:p-6">
        {children}
      </main>
      <RightSidebar />
    </div>
  );
}

export default MainLayout;
