// Next.js App Router 的「Streaming + Suspense」约定：
// 这个文件会在导航到 /article/[id] 期间自动显示，覆盖服务端响应的等待时间。
// 用骨架屏让用户立刻看到「点中了」，避免点击后 UI 冻结无反馈。

export default function ArticleLoading() {
  return (
    <div className="mx-auto my-6 grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 min-[900px]:grid-cols-[minmax(0,1fr)_240px] min-[900px]:items-start min-[900px]:py-0 sm:px-6 lg:px-8">
      <main className="article-detail-main min-w-0 rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-6 py-8 shadow-sm sm:px-8 lg:px-10">
        <header className="mb-8 border-b border-[var(--border-normal)] pb-6">
          <div className="skeleton-line mb-3 h-8 w-3/4 rounded-md" />
          <div className="flex flex-wrap gap-3">
            <div className="skeleton-line h-4 w-20 rounded-md" />
            <div className="skeleton-line h-4 w-16 rounded-md" />
            <div className="skeleton-line h-4 w-12 rounded-md" />
          </div>
        </header>

        <div className="space-y-3">
          <div className="skeleton-line h-5 w-2/3 rounded-md" />
          <div className="skeleton-line h-4 w-full rounded-md" />
          <div className="skeleton-line h-4 w-full rounded-md" />
          <div className="skeleton-line h-4 w-5/6 rounded-md" />

          <div className="skeleton-line my-6 h-32 w-full rounded-xl" />

          <div className="skeleton-line h-5 w-1/2 rounded-md" />
          <div className="skeleton-line h-4 w-full rounded-md" />
          <div className="skeleton-line h-4 w-11/12 rounded-md" />
          <div className="skeleton-line h-4 w-full rounded-md" />

          <div className="skeleton-line my-6 h-40 w-full rounded-xl" />

          <div className="skeleton-line h-4 w-full rounded-md" />
          <div className="skeleton-line h-4 w-4/5 rounded-md" />
        </div>
      </main>

      <aside className="hidden self-start min-[900px]:sticky min-[900px]:top-6 min-[900px]:block">
        <div className="rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
          <div className="skeleton-line mb-4 h-4 w-12 rounded-md" />
          <div className="space-y-2">
            <div className="skeleton-line h-4 w-full rounded-md" />
            <div className="skeleton-line h-4 w-5/6 rounded-md" />
            <div className="skeleton-line h-4 w-4/6 rounded-md" />
            <div className="skeleton-line h-4 w-5/6 rounded-md" />
            <div className="skeleton-line h-4 w-3/5 rounded-md" />
          </div>
        </div>
      </aside>

      <style>{`
        .skeleton-line {
          background: linear-gradient(
            90deg,
            var(--card-bg-soft) 0%,
            color-mix(in srgb, var(--card-bg-soft) 50%, transparent) 50%,
            var(--card-bg-soft) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
