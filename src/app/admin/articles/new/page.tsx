import Link from "next/link";

import { getCategorySummaries } from "@/lib/article";
import ArticleEditor from "../_components/ArticleEditor";
import { createArticleAction } from "../_actions";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const categories = await getCategorySummaries();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            新建文章
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            填写元信息后即可发布到博客。
          </p>
        </div>
        <Link
          href="/admin/articles"
          className="text-sm text-(--text-sub) hover:text-(--text-title)"
        >
          ← 返回列表
        </Link>
      </div>

      <ArticleEditor
        mode="create"
        categoryOptions={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
        }))}
        action={createArticleAction}
      />
    </div>
  );
}
