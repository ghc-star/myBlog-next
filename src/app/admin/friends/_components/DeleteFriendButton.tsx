"use client";

import { useTransition } from "react";

import { deleteFriendAction } from "../_actions";

export default function DeleteFriendButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`确认删除友链「${name}」？此操作不可撤销。`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", String(id));
      await deleteFriendAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "删除中..." : "删除"}
    </button>
  );
}
