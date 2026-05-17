"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import {
  clearIndexAction,
  reindexAllAction,
  type IndexActionState,
} from "../_actions";
import type { CollectionStats } from "@/lib/ai";

const initial: IndexActionState = {};

function StatusDot({ status, reachable }: { status: string; reachable: boolean }) {
  const color = !reachable
    ? "bg-rose-500"
    : status === "green"
      ? "bg-emerald-500"
      : status === "yellow"
        ? "bg-amber-500"
        : status === "red"
          ? "bg-rose-500"
          : "bg-gray-400";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={status}
    />
  );
}

export default function IndexPanel({
  stats: initialStats,
}: {
  stats: CollectionStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [reindexState, reindexAct] = useActionState(reindexAllAction, initial);
  const [clearState, clearAct] = useActionState(clearIndexAction, initial);
  const [pendingClear, startClearTransition] = useTransition();
  const [pendingReindex, startReindexTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // action 执行后，刷新统计数字
  useEffect(() => {
    if (!reindexState.ts && !clearState.ts) return;
    let cancelled = false;
    setRefreshing(true);
    fetch("/api/admin/index-stats", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CollectionStats | null) => {
        if (cancelled || !data) return;
        setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reindexState.ts, clearState.ts]);

  const lastState = (clearState.ts ?? 0) > (reindexState.ts ?? 0)
    ? clearState
    : reindexState;

  return (
    <section className="rounded-2xl border border-(--border-normal) bg-(--card-bg) p-4 shadow-(--shadow-card)">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-(--text-title)">
            AI 向量索引
          </h2>
          <p className="mt-1 text-xs text-(--text-sub)">
            发布 / 编辑 / 删除会自动同步。出现问题时可以手动重建。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-(--text-sub)">
            <StatusDot status={stats.status} reachable={stats.reachable} />
            <span className="font-mono text-[11px]">
              {stats.collection}
            </span>
          </div>
          <div className="text-(--text-sub)">
            向量块{" "}
            <span className="font-semibold tabular-nums text-(--text-title)">
              {stats.pointsCount}
            </span>
          </div>
          <div className="text-(--text-faint)">
            已索引{" "}
            <span className="tabular-nums">{stats.indexedVectorsCount}</span>
          </div>
          {refreshing ? (
            <span className="text-(--text-faint)">刷新中…</span>
          ) : null}
        </div>
      </header>

      {!stats.reachable ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Qdrant 不可达：{stats.error ?? "请检查 QDRANT_URL 或服务状态"}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form
          action={(fd) => startReindexTransition(() => reindexAct(fd))}
        >
          <button
            type="submit"
            disabled={pendingReindex || !stats.reachable}
            className="inline-flex items-center gap-1.5 rounded-md bg-(--theme-accent) px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingReindex ? "重建中…" : "重建全部索引"}
          </button>
        </form>

        {confirming ? (
          <form
            action={(fd) => {
              setConfirming(false);
              startClearTransition(() => clearAct(fd));
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-xs text-rose-600">确定清空？</span>
            <button
              type="submit"
              disabled={pendingClear}
              className="rounded-md bg-rose-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              是，清空
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md border border-(--border-normal) px-2.5 py-1 text-xs text-(--text-sub) transition hover:text-(--text-title)"
            >
              取消
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pendingClear || !stats.reachable}
            className="rounded-md border border-(--border-normal) px-3 py-1.5 text-xs text-(--text-sub) transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            清空索引
          </button>
        )}
      </div>

      {lastState.message ? (
        <div
          className={`mt-3 rounded-md px-3 py-2 text-xs ${
            lastState.ok === false
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {lastState.message}
          {lastState.detail?.errors?.length ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px]">
              {lastState.detail.errors.slice(0, 5).map((err) => (
                <li key={err.id}>
                  {err.title}（{err.id}）：{err.message}
                </li>
              ))}
              {lastState.detail.errors.length > 5 ? (
                <li>…还有 {lastState.detail.errors.length - 5} 篇失败</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
