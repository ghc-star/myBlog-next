"use client";

import { useState, useTransition } from "react";

import { reindexArticleAction } from "../_actions";

export default function ReindexArticleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [hint, setHint] = useState<{ ok: boolean; text: string } | null>(null);

  function run() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      const result = await reindexArticleAction({}, fd);
      setHint({ ok: !!result.ok, text: result.message ?? "" });
      window.setTimeout(() => setHint(null), 2400);
    });
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        title="重新索引到向量库"
        className="rounded-md border border-(--border-normal) bg-(--card-bg) px-2.5 py-1 text-xs text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--theme-accent) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "索引中…" : "索引"}
      </button>

      {hint ? (
        <span
          className={`pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-md ring-1 ${
            hint.ok
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-rose-200"
          }`}
        >
          {hint.text}
        </span>
      ) : null}
    </span>
  );
}
