"use client";

import { useTransition } from "react";

import { deleteArticleAction } from "../_actions";

export default function DeleteArticleButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`确认删除文章「${title}」？此操作不可撤销。`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      await deleteArticleAction(fd);
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
