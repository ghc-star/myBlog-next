"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ArticleCard from "@/components/article/ArticleCard";
import type { ArticleSummary } from "@/lib/article";

type SearchData = {
  keyword: string;
  list: ArticleSummary[];
};

export default function SearchResults() {
  const params = useSearchParams();
  const keyword = params.get("q")?.trim() ?? "";
  const [data, setData] = useState<SearchData | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  // 结果按 keyword 标记：URL 变化时旧结果自动失效（渲染为加载态），无需在 effect 里手动清状态
  const list = data && data.keyword === keyword ? data.list : null;
  const failed = failedFor === keyword;

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        setData({
          keyword,
          list: Array.isArray(payload?.list) ? payload.list : [],
        });
        setFailedFor(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFailedFor(keyword);
      });

    return () => controller.abort();
  }, [keyword]);

  if (failed) {
    return (
      <div className="rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg) p-10 text-center text-sm text-(--text-sub)">
        搜索服务暂时不可用，请稍后重试。
      </div>
    );
  }

  if (list === null) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <ResultSkeleton />
        <ResultSkeleton />
        <ResultSkeleton />
        <ResultSkeleton />
      </div>
    );
  }

  return (
    <>
      {keyword ? (
        <div className="mb-6 flex items-baseline justify-between gap-2 text-sm">
          <p className="text-(--text-sub)">
            关键词
            <span className="mx-1 rounded bg-(--theme-accent-soft) px-1.5 py-0.5 font-medium text-(--theme-accent)">
              {keyword}
            </span>
            共找到{" "}
            <span className="font-semibold text-(--text-title)">
              {list.length}
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
        <p className="mb-6 text-sm text-(--text-sub)">
          浏览全部文章，或在上方输入关键词检索。共{" "}
          <span className="font-semibold text-(--text-title)">
            {list.length}
          </span>{" "}
          篇。
        </p>
      )}

      {keyword && list.length === 0 ? (
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
    </>
  );
}

function ResultSkeleton() {
  return (
    <div className="h-44 animate-pulse rounded-2xl border border-(--border-card) bg-(--card-bg)" />
  );
}
