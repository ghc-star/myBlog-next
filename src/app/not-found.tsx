import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[720px] items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-faint)]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--text-title)]">
          页面走丢了
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-sub)]">
          你访问的内容可能已经移动，或者这个地址本来就不存在。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[var(--theme-accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          返回首页
        </Link>
      </div>
    </section>
  );
}
