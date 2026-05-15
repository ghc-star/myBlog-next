"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

export default function SearchPageInput() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";

  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedRef = useRef(initial);

  // 外部 URL 变化（如点击"清除筛选"）时同步到输入框
  useEffect(() => {
    const next = params.get("q") ?? "";
    if (next !== lastSyncedRef.current) {
      lastSyncedRef.current = next;
      setValue(next);
    }
  }, [params]);

  // 防抖把当前输入写回 URL
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastSyncedRef.current) {
      setPending(false);
      return;
    }

    setPending(true);
    const handle = window.setTimeout(() => {
      lastSyncedRef.current = trimmed;
      const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
      router.replace(`/search${qs}`, { scroll: false });
      setPending(false);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function clearInput() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-xl bg-(--card-bg) px-3 py-2 shadow-(--shadow-card) ring-1 ring-(--ring-soft)">
      <label className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-(--text-sub)">
          {pending ? (
            <Loader2 size={20} className="animate-spin text-(--theme-accent)" />
          ) : (
            <Search size={20} strokeWidth={1.6} />
          )}
        </span>

        <input
          ref={inputRef}
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          placeholder="输入标题、分类、标签或正文关键词..."
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-(--text-strong) outline-none placeholder:text-(--text-faint)"
        />

        {value ? (
          <button
            type="button"
            onClick={clearInput}
            aria-label="清空"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--text-sub) transition hover:bg-(--card-bg-soft) hover:text-(--text-title)"
          >
            <X size={16} />
          </button>
        ) : null}
      </label>
    </div>
  );
}
