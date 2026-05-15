import Link from "next/link";

import { getArticleStats, getCategorySummaries } from "@/lib/article";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-(--border-normal) bg-(--card-bg) p-5 shadow-(--shadow-card)">
      <div className="text-xs text-(--text-sub)">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-(--text-title)">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-(--text-faint)">{hint}</div>
      ) : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, categories] = await Promise.all([
    getArticleStats(),
    getCategorySummaries(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="文章总数" value={stats.total} />
        <StatCard
          label="累计浏览"
          value={stats.totalVisits.toLocaleString()}
        />
        <StatCard
          label="累计评论"
          value={stats.totalComments.toLocaleString()}
        />
        <StatCard label="分类数" value={categories.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-(--border-normal) bg-(--card-bg) shadow-(--shadow-card) lg:col-span-2">
          <header className="flex items-center justify-between border-b border-(--border-normal) px-5 py-3">
            <h2 className="text-sm font-semibold text-(--text-title)">
              最近文章
            </h2>
            <Link
              href="/admin/articles"
              className="text-xs text-(--theme-accent) hover:underline"
            >
              查看全部
            </Link>
          </header>

          {stats.recentArticles.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-(--text-sub)">
              还没有文章。
              <Link
                href="/admin/articles/new"
                className="ml-2 font-medium text-(--theme-accent) hover:underline"
              >
                去创建一篇
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-(--border-normal)">
              {stats.recentArticles.map((article) => (
                <li
                  key={article.id}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <span
                    className="inline-block h-2 w-2 flex-none rounded-full"
                    style={{ backgroundColor: article.color }}
                  />
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-(--text-title) hover:text-(--theme-accent)"
                  >
                    {article.title}
                  </Link>
                  <span className="hidden text-xs text-(--text-sub) sm:inline">
                    {article.category}
                  </span>
                  <span className="text-xs tabular-nums text-(--text-faint)">
                    {article.date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-(--border-normal) bg-(--card-bg) shadow-(--shadow-card)">
          <header className="border-b border-(--border-normal) px-5 py-3">
            <h2 className="text-sm font-semibold text-(--text-title)">
              分类统计
            </h2>
          </header>
          {categories.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-(--text-sub)">
              暂无分类
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {categories.map((cat) => (
                <li
                  key={cat.slug}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-(--card-bg-soft)"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="flex min-w-0 items-center gap-2 text-sm text-(--text-strong) hover:text-(--theme-accent)"
                  >
                    <span
                      className="inline-block h-2 w-2 flex-none rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </Link>
                  <span className="text-xs tabular-nums text-(--text-sub)">
                    {cat.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
