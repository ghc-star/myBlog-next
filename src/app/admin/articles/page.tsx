import Link from "next/link";

import { getArticles } from "@/lib/article";
import { getIndexStats } from "@/lib/ai/admin-index";
import DeleteArticleButton from "./_components/DeleteArticleButton";
import ReindexArticleButton from "./_components/ReindexArticleButton";
import IndexPanel from "./_components/IndexPanel";
import ArticleSearchInput from "./_components/ArticleSearchInput";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [all, indexStats] = await Promise.all([
    getArticles(),
    getIndexStats(),
  ]);
  const keyword = (q ?? "").trim().toLowerCase();
  const articles = keyword
    ? all.filter((a) => {
        const haystack = [
          a.title,
          a.desc,
          a.category,
          a.categorySlug,
          ...a.tags,
          a.id,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      })
    : all;

  return (
    <div className="space-y-4">
      <IndexPanel stats={indexStats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            文章管理
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            共 {all.length} 篇{keyword ? `，匹配 ${articles.length} 篇` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ArticleSearchInput defaultValue={keyword} />
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-(--theme-accent) px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            + 新建文章
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--border-normal) bg-(--card-bg) shadow-(--shadow-card)">
        {articles.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-(--text-sub)">
            {keyword ? "没有匹配的文章" : "还没有文章"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-(--card-bg-soft) text-(--text-sub)">
              <tr>
                <th className="px-4 py-3 text-left font-medium">标题</th>
                <th className="px-4 py-3 text-left font-medium">分类</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  日期
                </th>
                <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                  浏览
                </th>
                <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                  评论
                </th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-normal)">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="transition hover:bg-(--card-bg-soft)"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 flex-none rounded-full"
                        style={{ backgroundColor: article.color }}
                      />
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="font-medium text-(--text-title) hover:text-(--theme-accent)"
                      >
                        {article.title}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-(--text-faint)">
                      {article.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-(--text-strong)">
                    {article.category}
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums text-(--text-sub) md:table-cell">
                    {article.date}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-(--text-sub) md:table-cell">
                    {article.visits}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-(--text-sub) md:table-cell">
                    {article.comments}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/article/${article.id}`}
                        target="_blank"
                        className="rounded-md border border-(--border-normal) px-2.5 py-1 text-xs text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--text-title)"
                      >
                        预览
                      </Link>
                      <ReindexArticleButton id={article.id} />
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="rounded-md border border-(--border-normal) bg-(--card-bg) px-2.5 py-1 text-xs text-(--text-strong) transition hover:border-(--theme-accent) hover:text-(--theme-accent)"
                      >
                        编辑
                      </Link>
                      <DeleteArticleButton
                        id={article.id}
                        title={article.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
