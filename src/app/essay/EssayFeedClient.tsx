"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PenLine } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import EssayCard from "./EssayCard";
import EssayComposer from "./EssayComposer";
import type { CurrentEssayUser, EssayDTO } from "./types";

type EssayFeedClientProps = {
  /** 服务端预置的首屏数据（旧用法）。缺省时组件挂载后自行请求 /api/essays */
  initialEssays?: EssayDTO[];
  initialNextCursor?: number | null;
  isLoggedIn?: boolean;
  currentUser?: CurrentEssayUser | null;
};

/** 首屏加载占位 */
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-(--border-normal) bg-(--card-bg-soft)"
        />
      ))}
    </div>
  );
}

export default function EssayFeedClient({
  initialEssays,
  initialNextCursor,
  isLoggedIn: initialIsLoggedIn = false,
  currentUser: initialCurrentUser = null,
}: EssayFeedClientProps) {
  const hasServerData = initialEssays !== undefined;

  const [essays, setEssays] = useState<EssayDTO[]>(initialEssays ?? []);
  const [cursor, setCursor] = useState<number | null>(
    initialNextCursor ?? null,
  );
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [currentUser, setCurrentUser] = useState<CurrentEssayUser | null>(
    initialCurrentUser,
  );
  const [booting, setBooting] = useState(!hasServerData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 页面是静态壳时，首屏数据在挂载后拉取（接口已带登录态与当前用户）
  useEffect(() => {
    if (hasServerData) return;

    let cancelled = false;
    fetch("/api/essays", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "加载失败");
        if (cancelled) return;
        setEssays(data.essays ?? []);
        setCursor(data.nextCursor ?? null);
        setIsLoggedIn(Boolean(data.isLoggedIn));
        setCurrentUser(data.currentUser ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasServerData]);

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

  if (booting) {
    return (
      <div className="space-y-5" aria-busy>
        <FeedSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <EssayComposer
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onPublished={handlePublished}
      />

      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold text-(--text-title)">最新随笔</h2>
        <span className="text-xs text-(--text-faint)">共 {essays.length} 条</span>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {error && essays.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg-soft) px-6 py-14 text-center">
              <p className="text-sm font-medium text-(--text-strong)">
                随笔加载失败
              </p>
              <p className="mt-1 text-xs text-(--text-faint)">{error}</p>
            </div>
          ) : essays.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg-soft) px-6 py-14 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--card-bg) text-(--text-faint) ring-1 ring-(--border-normal)">
                <PenLine size={18} />
              </div>
              <p className="mt-4 text-sm font-medium text-(--text-strong)">
                还没有随笔
              </p>
              <p className="mt-1 text-xs text-(--text-faint)">
                写下第一段想法吧。
              </p>
            </motion.div>
          ) : (
            essays.map((essay) => (
              <EssayCard
                key={essay.id}
                essay={essay}
                isLoggedIn={isLoggedIn}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {cursor ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-(--border-normal) bg-(--card-bg) px-5 py-2 text-sm text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--theme-accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-center text-xs text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
