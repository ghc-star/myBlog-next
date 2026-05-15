"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ArticleSearchInput({
  defaultValue,
}: {
  defaultValue?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) {
        next.set("q", value.trim());
      } else {
        next.delete("q");
      }
      const qs = next.toString();
      router.replace(qs ? `/admin/articles?${qs}` : "/admin/articles");
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="搜索标题、分类、标签..."
      className="w-56 rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm text-(--text-strong) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
    />
  );
}
