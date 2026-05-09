"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScanFace,
  MessageCircle,
  SmilePlus,
  ThumbsUp,
  Send,
  Heart,
} from "lucide-react";

type ApiComment = {
  id: number;
  article_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  author: string;
  avatar_url: string | null;
};

type ReplyNode = ApiComment & {
  replyToAuthor: string;
};

type CommentNode = ApiComment & {
  replies: ReplyNode[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function redirectToGithubLogin() {
  window.location.href = `/api/auth/github?returnTo=${encodeURIComponent(
    window.location.pathname,
  )}`;
}

const fadeUpMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.24, ease: "easeOut" },
} as const;

const expandMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

const quickTapMotion = {
  whileTap: { scale: 0.96 },
  transition: { duration: 0.16 },
} as const;

function buildDouyinCommentTree(comments: ApiComment[]): CommentNode[] {
  const commentMap = new Map<number, ApiComment>();
  const childrenMap = new Map<number, ApiComment[]>();
  const roots: CommentNode[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, comment);

    if (comment.parent_id !== null) {
      const list = childrenMap.get(comment.parent_id) ?? [];
      list.push(comment);
      childrenMap.set(comment.parent_id, list);
    }
  }

  function collectReplies(rootId: number): ReplyNode[] {
    const result: ReplyNode[] = [];

    function dfs(parentId: number) {
      const children = childrenMap.get(parentId) ?? [];

      for (const child of children) {
        const parent = child.parent_id ? commentMap.get(child.parent_id) : null;

        result.push({
          ...child,
          replyToAuthor: parent?.author ?? "",
        });

        dfs(child.id);
      }
    }

    dfs(rootId);

    return result;
  }

  for (const comment of comments) {
    if (comment.parent_id === null) {
      roots.push({
        ...comment,
        replies: collectReplies(comment.id),
      });
    }
  }

  return roots;
}

function sortComments(
  comments: CommentNode[],
  sort: "oldest" | "latest",
): CommentNode[] {
  return [...comments].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    return sort === "latest" ? bTime - aTime : aTime - bTime;
  });
}

function sortReplies(
  replies: ReplyNode[],
  sort: "oldest" | "latest",
): ReplyNode[] {
  return [...replies].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    return sort === "latest" ? bTime - aTime : aTime - bTime;
  });
}

function InlineReplyBox({
  articleId,
  parent,
  onCancel,
  onSuccess,
}: {
  articleId: string;
  parent: ApiComment;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replyBoxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!replyBoxRef.current) return;

      if (!replyBoxRef.current.contains(target)) {
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);
  async function submitReply() {
    const content = replyContent.trim();

    if (!content) {
      alert("回复内容不能为空");
      return;
    }

    setReplySubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          content,
          parentId: parent.id,
        }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "回复失败");
      }

      setReplyContent("");
      onCancel();
      await onSuccess();
    } catch (error) {
      console.error("Create reply error:", error);
      alert(error instanceof Error ? error.message : "回复失败");
    } finally {
      setReplySubmitting(false);
    }
  }

  return (
    <motion.div
      ref={replyBoxRef}
      layout
      {...fadeUpMotion}
      className="mt-3 rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-3"
    >
      <div className="mb-2 text-xs text-[var(--text-sub)]">
        回复{" "}
        <span className="font-semibold text-[var(--theme-accent)]">
          @{parent.author}
        </span>
      </div>

      <textarea
        value={replyContent}
        onChange={(event) => setReplyContent(event.target.value)}
        placeholder={`回复 @${parent.author}`}
        maxLength={2000}
        className="min-h-[90px] w-full resize-y rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)]"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--text-sub)]">
          {replyContent.length}/2000
        </span>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={onCancel}
            {...quickTapMotion}
            className="rounded-xl px-3 py-1.5 text-xs text-[var(--text-sub)] transition hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
          >
            取消
          </motion.button>

          <motion.button
            type="button"
            onClick={submitReply}
            disabled={replySubmitting || !replyContent.trim()}
            {...quickTapMotion}
            className="rounded-xl bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {replySubmitting ? "回复中..." : "回复"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function DouyinReplyItem({
  articleId,
  reply,
  onSuccess,
}: {
  articleId: string;
  reply: ReplyNode;
  onSuccess: () => Promise<void>;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);

  return (
    <motion.div {...fadeUpMotion} className="flex gap-3">
      <Image
        src={reply.avatar_url || "/default-avatar.png"}
        alt={reply.author}
        width={32}
        height={32}
        className="h-8 w-8 flex-none rounded-full bg-[var(--card-bg-soft)] object-cover ring-1 ring-[var(--border-normal)]"
      />

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--card-bg-soft)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-title)]">
              {reply.author}
            </span>

            {reply.replyToAuthor ? (
              <>
                <span className="text-xs text-[var(--text-sub)]">回复</span>
                <span className="text-sm font-medium text-[var(--theme-accent)]">
                  @{reply.replyToAuthor}
                </span>
              </>
            ) : null}

            <time className="text-xs text-[var(--text-sub)]">
              {formatDate(reply.created_at)}
            </time>
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-strong)]">
            {reply.content}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-sub)]">
          <motion.button
            type="button"
            {...quickTapMotion}
            className="inline-flex items-center gap-1 transition hover:text-[var(--text-title)]"
          >
            <Heart size={13} />
            <span>赞</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setShowReplyBox((prev) => !prev)}
            {...quickTapMotion}
            className="inline-flex items-center gap-1 transition hover:text-[var(--text-title)]"
          >
            <MessageCircle size={13} />
            <span>回复</span>
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {showReplyBox ? (
            <InlineReplyBox
              articleId={articleId}
              parent={reply}
              onCancel={() => setShowReplyBox(false)}
              onSuccess={onSuccess}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DouyinCommentItem({
  articleId,
  comment,
  sort,
  onSuccess,
}: {
  articleId: string;
  comment: CommentNode;
  sort: "oldest" | "latest";
  onSuccess: () => Promise<void>;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const hasReplies = comment.replies.length > 0;

  const sortedReplies = useMemo(() => {
    return sortReplies(comment.replies, sort);
  }, [comment.replies, sort]);

  return (
    <motion.article {...fadeUpMotion} className="flex gap-3">
      <Image
        src={comment.avatar_url || "/default-avatar.png"}
        alt={comment.author}
        width={42}
        height={42}
        className="h-11 w-11 flex-none rounded-full bg-[var(--card-bg-soft)] object-cover ring-1 ring-[var(--border-normal)]"
      />

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--card-bg)] px-4 py-3 shadow-sm ring-1 ring-[var(--border-normal)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-title)]">
              {comment.author}
            </span>

            <time className="text-xs text-[var(--text-sub)]">
              {formatDate(comment.created_at)}
            </time>
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-strong)]">
            {comment.content}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-sub)]">
          <motion.button
            type="button"
            {...quickTapMotion}
            className="inline-flex items-center gap-1 transition hover:text-[var(--text-title)]"
          >
            <Heart size={13} />
            <span>赞</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setShowReplyBox((prev) => !prev)}
            {...quickTapMotion}
            className="inline-flex items-center gap-1 transition hover:text-[var(--text-title)]"
          >
            <MessageCircle size={13} />
            <span>回复</span>
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {showReplyBox ? (
            <InlineReplyBox
              articleId={articleId}
              parent={comment}
              onCancel={() => setShowReplyBox(false)}
              onSuccess={onSuccess}
            />
          ) : null}
        </AnimatePresence>

        {hasReplies ? (
          <div className="mt-3">
            <motion.button
              type="button"
              onClick={() => setShowReplies((prev) => !prev)}
              {...quickTapMotion}
              className="text-xs font-medium text-[var(--text-sub)] transition hover:text-[var(--text-title)]"
            >
              {showReplies
                ? "收起回复"
                : `展开 ${comment.replies.length} 条回复`}
            </motion.button>

            <AnimatePresence initial={false}>
              {showReplies ? (
                <motion.div {...expandMotion} className="overflow-hidden">
                  <div className="mt-3 space-y-4">
                    {sortedReplies.map((reply) => (
                      <DouyinReplyItem
                        key={reply.id}
                        articleId={articleId}
                        reply={reply}
                        onSuccess={onSuccess}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

export default function CommentClient({
  articleId,
}: {
  articleId: string;
  commentCount?: number;
  replyCount?: number;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"input" | "preview">("input");
  const [sort, setSort] = useState<"oldest" | "latest">("latest");
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldLoadComments, setShouldLoadComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        <div className="flex flex-col items-center justify-center gap-4 border-b border-[var(--border-normal)] pb-7 text-center">
          <h5 className="text-lg font-bold text-[var(--text-title)]">
            0 个表情
          </h5>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              {...quickTapMotion}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-normal)] bg-[var(--card-bg)] text-[var(--text-sub)] transition hover:text-[var(--text-title)]"
            >
              <SmilePlus size={18} />
            </motion.button>

            <motion.button
              type="button"
              {...quickTapMotion}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] transition hover:border-[var(--theme-accent)]"
            >
              <ThumbsUp size={16} className="text-amber-500" />
              <span>0</span>
            </motion.button>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-sub)]">
            <span className="text-lg font-semibold text-[var(--text-title)] underline decoration-[var(--text-title)] underline-offset-4">
              {commentCount} 条评论
            </span>
            <span>·</span>
            <span>{replyCount} 条回复</span>
          </div>

          <div className="inline-flex rounded-full bg-[var(--card-bg-soft)] p-1">
            <motion.button
              type="button"
              onClick={() => setSort("oldest")}
              {...quickTapMotion}
              className={`rounded-full px-3 py-1 text-sm transition ${
                sort === "oldest"
                  ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
                  : "text-[var(--text-sub)]"
              }`}
            >
              最早
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSort("latest")}
              {...quickTapMotion}
              className={`rounded-full px-3 py-1 text-sm transition ${
                sort === "latest"
                  ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
                  : "text-[var(--text-sub)]"
              }`}
            >
              最新
            </motion.button>
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-normal)] px-4 pt-2">
            <div className="flex items-end gap-2">
              <motion.button
                type="button"
                onClick={() => setMode("input")}
                {...quickTapMotion}
                className={`border border-b-0 px-3 py-2 text-sm transition ${
                  mode === "input"
                    ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                    : "border-transparent text-[var(--text-sub)]"
                }`}
              >
                输入
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setMode("preview")}
                {...quickTapMotion}
                className={`border border-b-0 px-3 py-2 text-sm transition ${
                  mode === "preview"
                    ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                    : "border-transparent text-[var(--text-sub)]"
                }`}
              >
                预览
              </motion.button>
            </div>

            <span className="px-2 text-lg text-[var(--text-sub)]">Aa</span>
          </div>

          <div className="p-3">
            <AnimatePresence mode="wait" initial={false}>
              {mode === "input" ? (
                <motion.div key="input" {...fadeUpMotion}>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="写下你的评论。未登录时提交会跳转 GitHub 登录。"
                    maxLength={2000}
                    className="min-h-[140px] w-full resize-y rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4 text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)]"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  {...fadeUpMotion}
                  className="min-h-[140px] rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4"
                >
                  {draft.trim() ? (
                    <p className="whitespace-pre-wrap break-words text-base leading-8 text-[var(--text-strong)]">
                      {draft}
                    </p>
                  ) : (
                    <p className="text-base text-[var(--text-faint)]">
                      这里会显示评论预览内容
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-2 text-right text-xs text-[var(--text-sub)]">
              {draft.length}/2000
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <motion.button
                type="button"
                onClick={redirectToGithubLogin}
                {...quickTapMotion}
                className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:border-[var(--theme-accent)]"
              >
                <ScanFace size={18} />
                GitHub 登录
              </motion.button>

              <motion.button
                type="button"
                onClick={submitComment}
                disabled={submitting || !draft.trim()}
                {...quickTapMotion}
                className="inline-flex items-center gap-3 rounded-2xl bg-[#238636] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(35,134,54,0.8)] transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} />
                {submitting ? "提交中..." : "发表评论"}
              </motion.button>
            </div>
          </div>
        </div>

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
                <DouyinCommentItem
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
