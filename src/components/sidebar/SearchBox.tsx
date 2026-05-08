"use client";

import { type FormEvent } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKeyword = searchParams.get("q") ?? "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <form
      key={`${pathname}-${currentKeyword}`}
      onSubmit={handleSubmit}
      className="rounded-[8px] bg-[var(--card-bg)] px-2 py-2 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-soft)]"
    >
      <label className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] leading-none text-[var(--text-sub)]">
            搜索
          </span>
          <input
            name="q"
            className="mt-2 w-full border-0 bg-transparent p-0 text-[18px] leading-none text-[var(--text-strong)] outline-none placeholder:text-[var(--text-sub)]"
            type="text"
            defaultValue={currentKeyword}
            placeholder="输入关键词..."
          />
        </span>
        <button
          type="submit"
          aria-label="搜索"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--text-sub)] transition hover:text-[var(--text-title)]"
        >
          <Search size={31} strokeWidth={1.6} />
        </button>
      </label>
    </form>
  );
}

export default SearchBox;
