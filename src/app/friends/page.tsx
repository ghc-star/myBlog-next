import { Metadata } from "next";

const friends = [
  {
    name: "ghc-star",
    desc: "作者的 GitHub 主页，主要记录博客和练手项目。",
    href: "https://github.com/ghc-star",
  },
  {
    name: "Next.js",
    desc: "这次重构所使用的核心框架官方站点。",
    href: "https://nextjs.org",
  },
];
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `随笔 | My Blog`,
    description: "这是我的随笔页面",
  };
}

export default function FriendsPage() {
  return (
    <section className="mx-auto w-full max-w-[900px] px-4 py-10">
      <div className="rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-3xl font-bold text-[var(--text-title)]">
          友情链接
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-sub)]">
          这里先保留博客常用的站点入口，后续可以继续扩展成正式友链页。
        </p>

        <div className="mt-8 grid gap-4">
          {friends.map((friend) => (
            <a
              key={friend.name}
              href={friend.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg-soft)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="text-lg font-semibold text-[var(--text-title)]">
                {friend.name}
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-sub)]">
                {friend.desc}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
