import { Suspense } from "react";
import ArticleCard from "@/components/article/ArticleCard";
import SearchBox from "@/components/sidebar/SearchBox";
import { getArticles, type ArticleRecord } from "@/lib/article";

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function searchArticles(articles: ArticleRecord[], keyword: string) {
  const q = normalize(keyword);
  if (!q) return [];

  return articles.filter((article) => {
    const haystack = [article.title, article.desc, article.category, ...article.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";
  const articles = await getArticles();
  const results = searchArticles(articles, keyword);

  return (
    <section className="mx-auto w-full max-w-[900px] px-4 py-10">
      <Suspense fallback={<div className="h-16 rounded-xl bg-[var(--card-bg)]" />}>
        <SearchBox />
      </Suspense>

      {keyword ? (
        <p className="mb-6 text-[var(--text-sub)]">
          关键词“{keyword}”，共找到 {results.length} 条结果
        </p>
      ) : (
        <p className="mb-6 text-[var(--text-sub)]">
          输入标题、分类或标签开始检索。
        </p>
      )}

      <div className="grid gap-4">
        {results.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
