import Link from "next/link";
import { notFound } from "next/navigation";

import FriendEditor from "../../_components/FriendEditor";
import { updateFriendAction } from "../../_actions";
import { getFriendById } from "@/lib/friends";

export const dynamic = "force-dynamic";

export default async function EditFriendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }
  const friend = await getFriendById(numericId);
  if (!friend) {
    notFound();
  }

  const action = updateFriendAction.bind(null, numericId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            编辑友链
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            ID：<span className="font-mono">{friend.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={friend.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-(--text-sub) hover:text-(--text-title)"
          >
            访问 ↗
          </a>
          <Link
            href="/admin/friends"
            className="text-sm text-(--text-sub) hover:text-(--text-title)"
          >
            ← 返回列表
          </Link>
        </div>
      </div>

      <FriendEditor
        mode="edit"
        initial={{
          name: friend.name,
          description: friend.description,
          url: friend.url,
          avatarUrl: friend.avatarUrl,
          sortOrder: friend.sortOrder,
          status: friend.status,
        }}
        action={action}
      />
    </div>
  );
}
