import AiTrigger from "../ai/AiTrigger";
import PageViewTracker from "../analytics/PageViewTracker";
import LeftSidebar from "./LeftSidebar";
import ShellEffects from "./ShellEffects";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <ShellEffects />
      <PageViewTracker />
      <div className="app-content flex min-h-screen flex-col text-[var(--text-main)] sm:flex-row">
        <LeftSidebar />
        <main className="min-w-0 flex-1">{children}</main>
        <AiTrigger />
      </div>
    </>
  );
}
