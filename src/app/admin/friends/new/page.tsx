import Link from "next/link";

import FriendEditor from "../_components/FriendEditor";
import { createFriendAction } from "../_actions";

export const dynamic = "force-dynamic";

export default function NewFriendPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--text-title)">
            添加友链
          </h1>
          <p className="mt-1 text-xs text-(--text-sub)">
            录入一个互相挂链的站点。
          </p>
        </div>
        <Link
          href="/admin/friends"
          className="text-sm text-(--text-sub) hover:text-(--text-title)"
        >
          ← 返回列表
        </Link>
      </div>

      <FriendEditor mode="create" action={createFriendAction} />
    </div>
  );
}
