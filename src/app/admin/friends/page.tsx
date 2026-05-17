import Link from "next/link";

import { getAllFriends } from "@/lib/friends";
import DeleteFriendButton from "./_components/DeleteFriendButton";

export const dynamic = "force-dynamic";

function getDomain(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default async function AdminFriendsPage() {
  const friends = await getAllFriends();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            友链管理
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            共 {friends.length} 条
          </p>
        </div>
        <Link
          href="/admin/friends/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-(--theme-accent) px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + 添加友链
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--border-normal) bg-(--card-bg) shadow-(--shadow-card)">
        {friends.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-(--text-sub)">
            还没有友链
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-(--card-bg-soft) text-(--text-sub)">
              <tr>
                <th className="px-4 py-3 text-left font-medium">站名</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  简介
                </th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  域名
                </th>
                <th className="px-4 py-3 text-right font-medium">权重</th>
                <th className="px-4 py-3 text-center font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-normal)">
              {friends.map((friend) => (
                <tr
                  key={friend.id}
                  className="transition hover:bg-(--card-bg-soft)"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/friends/${friend.id}/edit`}
                      className="font-medium text-(--text-title) hover:text-(--theme-accent)"
                    >
                      {friend.name}
                    </Link>
                  </td>
                  <td className="hidden max-w-[320px] truncate px-4 py-3 text-(--text-strong) md:table-cell">
                    {friend.description || (
                      <span className="text-(--text-faint)">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-(--text-sub) md:table-cell">
                    {getDomain(friend.url)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-(--text-sub)">
                    {friend.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {friend.status === "active" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
                        显示
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                        隐藏
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={friend.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded-md border border-(--border-normal) px-2.5 py-1 text-xs text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--text-title)"
                      >
                        访问
                      </a>
                      <Link
                        href={`/admin/friends/${friend.id}/edit`}
                        className="rounded-md border border-(--border-normal) bg-(--card-bg) px-2.5 py-1 text-xs text-(--text-strong) transition hover:border-(--theme-accent) hover:text-(--theme-accent)"
                      >
                        编辑
                      </Link>
                      <DeleteFriendButton id={friend.id} name={friend.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
