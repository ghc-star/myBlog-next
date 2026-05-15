import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import AdminNav from "./_components/AdminNav";

export const metadata: Metadata = {
  title: "后台管理 | My Blog",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-(--background) text-(--text-main)">
      <header className="sticky top-0 z-30 border-b border-(--border-normal) bg-(--card-bg)/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-(--theme-accent) text-xs font-bold text-white">
              A
            </span>
            <span className="text-sm font-semibold text-(--text-title)">
              后台管理
            </span>
          </Link>

          <AdminNav />

          <div className="ml-auto flex items-center gap-3 text-xs text-(--text-sub)">
            <Link
              href="/"
              className="rounded-md border border-(--border-normal) px-2.5 py-1 transition hover:border-(--theme-accent) hover:text-(--text-title)"
            >
              返回站点
            </Link>
            <span className="hidden sm:inline">{user.github_login}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
