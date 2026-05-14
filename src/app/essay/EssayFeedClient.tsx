"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";

import EssayCard from "./EssayCard";
import EssayComposer from "./EssayComposer";
import type { CurrentEssayUser, EssayDTO } from "./types";
import { redirectToGithubLogin } from "./utils";

type EssayFeedClientProps = {
  initialEssays: EssayDTO[];
  initialNextCursor: number | null;
  isLoggedIn: boolean;
  currentUser: CurrentEssayUser;
};

export default function EssayFeedClient({
  initialEssays,
  initialNextCursor,
  isLoggedIn,
  currentUser,
}: EssayFeedClientProps) {
  const [essays, setEssays] = useState<EssayDTO[]>(initialEssays);
  const [cursor, setCursor] = useState<number | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublished = useCallback((created: EssayDTO) => {
    setEssays((prev) => [created, ...prev]);
  }, []);

  const handleUpdate = useCallback((updated: EssayDTO) => {
    setEssays((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    );
  }, []);

  const handleDelete = useCallback((id: number) => {
    setEssays((prev) => prev.filter((item) => item.id !== id));
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const res = await fetch(`/api/essays?cursor=${cursor}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "加载失败");

      setEssays((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const next = (data.essays as EssayDTO[]).filter(
          (item) => !known.has(item.id),
        );
        return [...prev, ...next];
      });
      setCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <EssayComposer
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onPublished={handlePublished}
      />

      {!isLoggedIn ? (
        <p className="mt-6 text-sm text-gray-500">
          想发布随笔或参与互动？
          <button
            type="button"
            onClick={redirectToGithubLogin}
            className="ml-2 font-semibold text-(--theme-accent) hover:underline"
          >
            使用 GitHub 登录
          </button>
        </p>
      ) : null}

      <div className="mt-6 space-y-10">
        <AnimatePresence initial={false}>
          {essays.length === 0 ? (
            <p
              key="empty"
              className="py-12 text-center text-sm text-gray-500"
            >
              还没有随笔，写下第一段想法吧。
            </p>
          ) : (
            essays.map((essay, index) => (
              <EssayCard
                key={essay.id}
                essay={essay}
                isLoggedIn={isLoggedIn}
                isLast={index === essays.length - 1}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {cursor ? (
        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-md border border-gray-200 bg-white px-5 py-2 text-sm text-gray-600 transition hover:border-(--theme-accent) hover:text-(--text-title) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-xs text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
