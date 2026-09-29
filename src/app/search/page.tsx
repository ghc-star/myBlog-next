import { Suspense } from "react";

import SearchPageInput from "./_components/SearchPageInput";
import SearchResults from "./SearchResults";

// 静态壳：不再读 searchParams 查库，结果由客户端请求 /api/search 获取，
// 输入关键词只发生前端请求，不触发服务端重新渲染
export default function SearchPage() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-3">
        <Suspense fallback={<div className="h-14 rounded-xl bg-(--card-bg)" />}>
          <SearchPageInput />
        </Suspense>
      </header>

      <Suspense fallback={<SearchResultsFallback />}>
        <SearchResults />
      </Suspense>
    </section>
  );
}

function SearchResultsFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ResultSkeleton />
      <ResultSkeleton />
      <ResultSkeleton />
      <ResultSkeleton />
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="h-44 animate-pulse rounded-2xl border border-(--border-card) bg-(--card-bg)" />
  );
}
