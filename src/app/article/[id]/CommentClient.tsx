"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CommentComposer } from "./comments/CommentComposer";
import { CommentItem } from "./comments/CommentItem";
import { CommentStatsBar, ReactionSummary } from "./comments/CommentSummary";
import { fadeUpMotion } from "./comments/motion";
import type { ApiComment, CommentSort } from "./comments/types";
import {
  buildDouyinCommentTree,
  redirectToGithubLogin,
  sortComments,
} from "./comments/utils";

type CommentClientProps = {
  articleId: string;
  commentCount?: number;
  replyCount?: number;
};

export default function CommentClient({ articleId }: CommentClientProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"input" | "preview">("input");
  const [sort, setSort] = useState<CommentSort>("latest");
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldLoadComments, setShouldLoadComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fetchComments = useCallback(async () => {
    if (!articleId) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/comments?articleId=${encodeURIComponent(articleId)}`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok) {
        throw new Error("获取评论失败");
      }

      const data = await res.json();
      setComments(data.comments ?? []);
      setIsLoggedIn(Boolean(data.isLoggedIn));
    } catch (error) {
      console.error("Fetch comments error:", error);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || shouldLoadComments) return;

    if (!("IntersectionObserver" in window)) {
      queueMicrotask(() => {
        setShouldLoadComments(true);
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setShouldLoadComments(true);
        observer.disconnect();
      },
      {
        rootMargin: "450px 0px",
        threshold: 0,
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoadComments]);

  useEffect(() => {
    if (!shouldLoadComments) return;

    queueMicrotask(() => {
      void fetchComments();
    });
  }, [fetchComments, shouldLoadComments]);

  const commentTree = useMemo(() => {
    const tree = buildDouyinCommentTree(comments);
    return sortComments(tree, sort);
  }, [comments, sort]);

  const commentCount = comments.filter(
    (item) => item.parent_id === null,
  ).length;
  const replyCount = comments.filter((item) => item.parent_id !== null).length;

  async function submitComment() {
    if (!articleId) return;

    const content = draft.trim();

    if (!content) {
      alert("评论内容不能为空");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          content,
          parentId: null,
        }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "发表评论失败");
      }

      setDraft("");
      setMode("input");
      setShouldLoadComments(true);
      await fetchComments();
    } catch (error) {
      console.error("Create comment error:", error);
      alert(error instanceof Error ? error.message : "发表评论失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.36, ease: "easeOut" }}
      className="mt-12"
    >
      <motion.div
        layout
        className="rounded-3xl border border-[var(--border-normal)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82))] p-5 shadow-sm backdrop-blur sm:p-7"
      >
        <ReactionSummary articleId={articleId} />

        <CommentStatsBar
          commentCount={commentCount}
          replyCount={replyCount}
          sort={sort}
          onSortChange={setSort}
        />

        <CommentComposer
          mode={mode}
          draft={draft}
          submitting={submitting}
          isLoggedIn={isLoggedIn}
          onModeChange={setMode}
          onDraftChange={setDraft}
          onLogin={redirectToGithubLogin}
          onSubmit={submitComment}
        />

        <motion.div layout className="mt-8 space-y-7">
          <AnimatePresence initial={false}>
            {!shouldLoadComments || loading ? (
              <motion.p
                key="loading"
                {...fadeUpMotion}
                className="text-sm text-[var(--text-sub)]"
              >
                评论加载中...
              </motion.p>
            ) : commentTree.length > 0 ? (
              commentTree.map((comment) => (
                <CommentItem
                  key={comment.id}
                  articleId={articleId}
                  comment={comment}
                  sort={sort}
                  onSuccess={fetchComments}
                />
              ))
            ) : (
              <motion.div
                key="empty"
                {...fadeUpMotion}
                className="rounded-3xl border border-dashed border-[var(--border-normal)] bg-[var(--card-bg)] p-8 text-center text-sm text-[var(--text-sub)]"
              >
                暂无评论，来发第一条吧。
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
