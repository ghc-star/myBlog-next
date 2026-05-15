import { Suspense } from "react";
import Link from "next/link";

import ArticleCard from "@/components/article/ArticleCard";
import { getArticles, type ArticleRecord } from "@/lib/article";

import SearchPageInput from "./_components/SearchPageInput";

export const dynamic = "force-dynamic";

type ScoredArticle = {
  article: ArticleRecord;
  score: number;
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function searchArticles(
  articles: ArticleRecord[],
  keyword: string,
): ScoredArticle[] {
  const q = normalize(keyword);
  if (!q) return [];

  const scored: ScoredArticle[] = [];

  for (const article of articles) {
    const title = article.title.toLowerCase();
    const desc = article.desc.toLowerCase();
    const category = article.category.toLowerCase();
    const tags = article.tags.map((t) => t.toLowerCase());
    const content = article.content.toLowerCase();

    let score = 0;
    if (title.includes(q)) score += 10;
    if (desc.includes(q)) score += 5;
    if (category.includes(q)) score += 4;
    if (tags.some((t) => t.includes(q))) score += 4;
    if (content.includes(q)) score += 1;

    if (score > 0) {
      scored.push({ article, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.article.visits !== a.article.visits) {
      return b.article.visits - a.article.visits;
    }
    return (
      new Date(b.article.publishedAt).getTime() -
      new Date(a.article.publishedAt).getTime()
    );
  });

  return scored;
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
  const browseList = [...articles].sort((a, b) => {
    if (b.visits !== a.visits) return b.visits - a.visits;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
  const list = keyword ? results.map((r) => r.article) : browseList;

  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-3">
        <Suspense fallback={<div className="h-14 rounded-xl bg-(--card-bg)" />}>
          <SearchPageInput />
        </Suspense>

        {keyword ? (
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <p className="text-(--text-sub)">
              关键词
              <span className="mx-1 rounded bg-(--theme-accent-soft) px-1.5 py-0.5 font-medium text-(--theme-accent)">
                {keyword}
              </span>
              共找到{" "}
              <span className="font-semibold text-(--text-title)">
                {results.length}
              </span>{" "}
              条结果
            </p>
            <Link
              href="/search"
              scroll={false}
              className="text-xs text-(--text-sub) hover:text-(--theme-accent) hover:underline"
            >
              清除筛选
            </Link>
          </div>
        ) : (
          <p className="text-sm text-(--text-sub)">
            浏览全部文章，或在上方输入关键词检索。共{" "}
            <span className="font-semibold text-(--text-title)">
              {articles.length}
            </span>{" "}
            篇。
          </p>
        )}
      </header>

      {keyword && results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg) p-10 text-center">
          <p className="text-sm text-(--text-sub)">
            没有匹配的内容。试试更换关键词，或
            <Link
              href="/search"
              scroll={false}
              className="ml-1 font-medium text-(--theme-accent) hover:underline"
            >
              浏览全部文章
            </Link>
            。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
