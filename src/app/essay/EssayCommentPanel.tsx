"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import type { EssayCommentDTO } from "./types";
import { formatEssayDate, redirectToGithubLogin } from "./utils";

const MAX_COMMENT = 500;

type EssayCommentPanelProps = {
  essayId: number;
  isLoggedIn: boolean;
  onCountChange?: (count: number) => void;
};

export default function EssayCommentPanel({
  essayId,
  isLoggedIn,
  onCountChange,
}: EssayCommentPanelProps) {
  const [comments, setComments] = useState<EssayCommentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 让 onCountChange 不参与 useCallback 依赖，避免父组件每次 re-render 触发死循环
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  // 仅当数量真的变化时才通知父组件
  const lastReportedCountRef = useRef<number | null>(null);
  const reportCount = useCallback((count: number) => {
    if (lastReportedCountRef.current === count) return;
    lastReportedCountRef.current = count;
    onCountChangeRef.current?.(count);
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/essay-comments?essayId=${essayId}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "加载评论失败");
      const list: EssayCommentDTO[] = data.comments ?? [];
      setComments(list);
      reportCount(list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载评论失败");
    } finally {
      setLoading(false);
    }
  }, [essayId, reportCount]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchComments();
    });
  }, [fetchComments]);

  async function handleSubmit() {
    if (!isLoggedIn) {
      redirectToGithubLogin();
      return;
    }

    const content = draft.trim();
    if (!content) {
      setError("评论内容不能为空");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/essay-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayId, content }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "评论失败");

      const list: EssayCommentDTO[] = data.comments ?? [];
      setComments(list);
      reportCount(list.length);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-(--border-normal) bg-(--card-bg-soft) p-4">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {loading && comments.length === 0 ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-(--text-sub)"
            >
              加载评论中...
            </motion.p>
          ) : comments.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-(--text-faint)"
            >
              暂无评论，来留下第一句话吧。
            </motion.p>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                {comment.avatarUrl ? (
                  <Image
                    src={comment.avatarUrl}
                    alt={comment.author}
                    width={28}
                    height={28}
                    className="h-7 w-7 flex-none rounded-full bg-(--card-bg) object-cover ring-1 ring-(--border-normal)"
                  />
                ) : (
                  <div className="h-7 w-7 flex-none rounded-full bg-(--card-bg) ring-1 ring-(--border-normal)" />
                )}

                <div className="min-w-0 flex-1 rounded-xl bg-(--card-bg) px-3 py-2 ring-1 ring-(--border-normal)">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-(--text-title)">
                      {comment.author}
                    </span>
                    <span className="text-(--text-sub)">
                      {formatEssayDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-(--text-strong)">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          maxLength={MAX_COMMENT}
          rows={2}
          placeholder={isLoggedIn ? "回复一句..." : "登录后参与评论"}
          className="min-w-0 flex-1 resize-none rounded-xl border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm leading-6 text-(--text-strong) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex h-9 items-center gap-1 self-end rounded-xl bg-(--theme-accent) px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={13} />
          {submitting ? "发送中" : isLoggedIn ? "发送" : "登录"}
        </motion.button>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-(--text-sub)">
        <span>{error ?? ""}</span>
        <span>
          {draft.length}/{MAX_COMMENT}
        </span>
      </div>
    </div>
  );
}
