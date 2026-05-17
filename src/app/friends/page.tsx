import type { Metadata } from "next";

import { getActiveFriends, type FriendRecord } from "@/lib/friends";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "友情链接 | My Blog",
  description: "博客的友链页面",
};

function getDomain(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** 头像 fallback：用站名首字母 + 渐变背景 */
function FallbackAvatar({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  // 用站名做哈希挑色相，同站每次同色
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${(hue + 40) % 360}, 70%, 50%))`,
      }}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function FriendCard({ friend }: { friend: FriendRecord }) {
  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex min-w-0 items-start gap-3 rounded-2xl border border-(--border-normal) bg-(--card-bg) p-4 transition hover:-translate-y-0.5 hover:border-(--theme-accent) hover:shadow-(--shadow-card)"
    >
      {friend.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={friend.avatarUrl}
          alt={`${friend.name} 头像`}
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-(--border-normal)"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <FallbackAvatar name={friend.name} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-(--text-title) transition group-hover:text-(--theme-accent)">
            {friend.name}
          </span>
        </div>
        {friend.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-(--text-sub)">
            {friend.description}
          </p>
        ) : null}
        <p className="mt-1 truncate text-xs text-(--text-faint)">
          {getDomain(friend.url)}
        </p>
      </div>
    </a>
  );
}

export default async function FriendsPage() {
  const friends = await getActiveFriends();

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-(--text-title)">友情链接</h1>
        <p className="mt-2 text-sm text-(--text-sub)">
          这里收录我互相挂链的博客和站点。
        </p>
      </header>

      {/* 友链卡片 */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-(--text-title)">
            朋友们
          </h2>
          <span className="text-xs text-(--text-faint)">
            共 {friends.length} 位
          </span>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg-soft) px-6 py-12 text-center text-sm text-(--text-sub)">
            还没有友链。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
