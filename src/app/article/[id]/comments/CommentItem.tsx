import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

import { InlineReplyBox } from "./InlineReplyBox";
import { expandMotion, fadeUpMotion, quickTapMotion } from "./motion";
import type { CommentNode, CommentSort, ReplyNode } from "./types";
import { formatDate, redirectToGithubLogin, sortReplies } from "./utils";

type CommentLikeButtonProps = {
  commentId: number;
  initialCount: number;
  initiallyLiked: boolean;
};

function CommentLikeButton({
  commentId,
  initialCount,
  initiallyLiked,
}: CommentLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialCount);
  const [likedByMe, setLikedByMe] = useState(initiallyLiked);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLikeCount(initialCount);
      setLikedByMe(initiallyLiked);
    });
  }, [initialCount, initiallyLiked]);

  async function toggleCommentLike() {
    setSubmitting(true);

    try {
      const res = await fetch("/api/comment-likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
        }),
      });

      if (res.status === 401) {
        redirectToGithubLogin();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "操作失败");
        return;
      }

      setLikeCount(Number(data.count ?? 0));
      setLikedByMe(Boolean(data.likedByMe));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={() => {
        void toggleCommentLike();
      }}
      disabled={submitting}
      {...quickTapMotion}
      className={`inline-flex items-center gap-1 transition hover:text-[var(--text-title)] disabled:cursor-not-allowed disabled:opacity-60 ${
        likedByMe ? "text-rose-500" : ""
      }`}
    >
      <Heart size={13} fill={likedByMe ? "currentColor" : "none"} />
      <span>赞</span>
      <span>{likeCount}</span>
    </motion.button>
  );
}

type ReplyItemProps = {
  articleId: string;
  reply: ReplyNode;
  onSuccess: () => Promise<void>;
};

function ReplyItem({ articleId, reply, onSuccess }: ReplyItemProps) {
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
          <CommentLikeButton
            commentId={reply.id}
            initialCount={reply.like_count}
            initiallyLiked={Boolean(reply.liked_by_me)}
          />

          <motion.button
            type="button"
            data-reply-toggle={reply.id}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
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

type CommentItemProps = {
  articleId: string;
  comment: CommentNode;
  sort: CommentSort;
  onSuccess: () => Promise<void>;
};

export function CommentItem({
  articleId,
  comment,
  sort,
  onSuccess,
}: CommentItemProps) {
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
          <CommentLikeButton
            commentId={comment.id}
            initialCount={comment.like_count}
            initiallyLiked={Boolean(comment.liked_by_me)}
          />

          <motion.button
            type="button"
            data-reply-toggle={comment.id}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
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
                      <ReplyItem
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
