import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleById, getCategorySummaries } from "@/lib/article";
import ArticleEditor from "../../_components/ArticleEditor";
import { updateArticleAction } from "../../_actions";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    getArticleById(id),
    getCategorySummaries(),
  ]);

  if (!article) {
    notFound();
  }

  const action = updateArticleAction.bind(null, id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            编辑文章
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            ID：<span className="font-mono">{article.id}</span> · 创建于{" "}
            {article.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/article/${article.id}`}
            target="_blank"
            className="text-sm text-(--text-sub) hover:text-(--text-title)"
          >
            预览 ↗
          </Link>
          <Link
            href="/admin/articles"
            className="text-sm text-(--text-sub) hover:text-(--text-title)"
          >
            ← 返回列表
          </Link>
        </div>
      </div>

      <ArticleEditor
        mode="edit"
        initial={{
          id: article.id,
          title: article.title,
          desc: article.desc,
          category: article.category,
          categorySlug: article.categorySlug,
          tags: article.tags,
          cover: article.cover,
          color: article.color,
          content: article.content,
        }}
        categoryOptions={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
        }))}
        action={action}
      />
    </div>
  );
}
