"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowUp,
  ScanFace,
  MessageCircle,
  SmilePlus,
  ThumbsUp,
} from "lucide-react";

type CommentItem = {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  likes: number;
  badge?: string;
  replies?: CommentItem[];
};

const mockComments: CommentItem[] = [
  {
    id: "comment-1",
    author: "qitry",
    avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    date: "2025 年 3 月 24 日",
    content: "该评论已被删除。",
    likes: 1,
    replies: [
      {
        id: "reply-1",
        author: "letere-gzj",
        avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
        date: "2025 年 3 月 25 日",
        content: "我先 star 一下，有空再研究。",
        likes: 0,
        badge: "所有者",
      },
      {
        id: "reply-2",
        author: "letere-gzj",
        avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
        date: "2025 年 3 月 25 日",
        content: "我先 star 一下，有空再研究。",
        likes: 0,
        badge: "所有者",
      },
    ],
  },
];

function ReactionBar({ likes }: { likes: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[var(--text-sub)]">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
      >
        <ArrowUp size={16} />
        <span>{likes}</span>
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
      >
        <SmilePlus size={16} />
      </button>
    </div>
  );
}

function ReplyItem({ reply }: { reply: CommentItem }) {
  return (
    <div className="relative pl-7">
      <span className="absolute bottom-0 left-[23px] top-14 w-px bg-[var(--border-normal)]" />

      <div className="flex items-center gap-3">
        <Image
          src={reply.avatar}
          alt={reply.author}
          width={48}
          height={48}
          className="relative z-10 h-12 w-12 rounded-full bg-[var(--card-bg-soft)] object-cover ring-1 ring-[var(--border-normal)]"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xls font-semibold text-[var(--text-title)]">
              {reply.author}
            </span>
            <time className="text-sm text-[var(--text-sub)] underline decoration-[var(--border-normal)] underline-offset-4">
              {reply.date}
            </time>
            {reply.badge ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {reply.badge}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-5 text-base leading-8 text-[var(--text-strong)]">
        {reply.content}
      </p>

      <div className="mt-5">
        <ReactionBar likes={reply.likes} />
      </div>
    </div>
  );
}

function CommentCard({ comment }: { comment: CommentItem }) {
  const hasReplies = Boolean(comment.replies?.length);
  const [showReplies, setShowReplies] = useState(true);

  return (
    <article className="overflow-hidden rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Image
            src={comment.avatar}
            alt={comment.author}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-[var(--border-normal)]"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xl font-semibold text-[var(--text-title)]">
                {comment.author}
              </span>
              <time className="text-sm text-[var(--text-sub)] underline decoration-[var(--border-normal)] underline-offset-4">
                {comment.date}
              </time>
            </div>
          </div>
        </div>

        <p className="mt-5 text-base leading-8 text-[var(--text-strong)]">
          {comment.content}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--text-sub)]">
          <ReactionBar likes={comment.likes} />

          {hasReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
            >
              <MessageCircle size={16} />
              <span>
                {showReplies ? "收起回复" : `${comment.replies?.length} 条回复`}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {hasReplies && showReplies ? (
        <div className="border-t border-[var(--border-normal)] bg-slate-50/70 py-6">
          <div className="space-y-6">
            {comment.replies?.map((reply, index) => (
              <div
                key={reply.id}
                className={
                  index === 0
                    ? ""
                    : "border-t border-[var(--border-normal)] pt-6"
                }
              >
                <ReplyItem reply={reply} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function CommentClient({
  commentCount = 8,
  replyCount = 14,
}: {
  commentCount?: number;
  replyCount?: number;
}) {
  const [mode, setMode] = useState<"input" | "preview">("input");
  const [sort, setSort] = useState<"oldest" | "latest">("latest");
  const [draft, setDraft] = useState("");

  const comments = useMemo(() => {
    if (sort === "oldest") {
      return [...mockComments].reverse();
    }

    return mockComments;
  }, [sort]);

  return (
    <section className="mt-12">
      <div className="border border-[var(--border-normal)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82))] p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col items-center justify-center gap-4 border-b border-[var(--border-normal)] pb-8 text-center">
          <h5 className="text-lg font-bold text-[var(--text-title)]">
            1 个表情
          </h5>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-normal)] bg-[var(--card-bg)] text-[var(--text-sub)] transition hover:text-[var(--text-title)]"
            >
              <SmilePlus size={18} />
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] transition hover:border-[var(--theme-accent)]"
            >
              <ThumbsUp size={16} className="text-amber-500" />
              <span>1</span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-sub)]">
            <span className="text-lg font-semibold text-[var(--text-title)] underline decoration-[var(--text-title)] underline-offset-4">
              {commentCount} 条评论
            </span>
            <span>·</span>
            <span>{replyCount} 条回复</span>
            <span>— 由</span>
            <span className="italic underline underline-offset-4">giscus</span>
            <span>提供支持</span>
          </div>

          <div className="inline-flex bg-[var(--card-bg-soft)] p-1">
            <button
              type="button"
              onClick={() => setSort("oldest")}
              className={`px-2 py-1 text-sm transition ${
                sort === "oldest"
                  ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
                  : "text-[var(--text-sub)]"
              }`}
            >
              最早
            </button>
            <button
              type="button"
              onClick={() => setSort("latest")}
              className={` px-2 py-1 text-sm transition ${
                sort === "latest"
                  ? "bg-[var(--card-bg)] font-semibold text-[var(--text-title)] shadow-sm"
                  : "text-[var(--text-sub)]"
              }`}
            >
              最新
            </button>
          </div>
        </div>

        <div className="mt-8 border border-[var(--border-normal)] bg-[var(--card-bg)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-normal)] px-4 pt-2">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setMode("input")}
                className={`border border-b-0 px-3 py-2 text-sm transition ${
                  mode === "input"
                    ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                    : "border-transparent text-[var(--text-sub)]"
                }`}
              >
                输入
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`border border-b-0 px-3 py-2 text-sm transition ${
                  mode === "preview"
                    ? "border-[var(--border-normal)] bg-[var(--card-bg)] font-semibold text-[var(--text-title)]"
                    : "border-transparent text-[var(--text-sub)]"
                }`}
              >
                预览
              </button>
            </div>

            <span className="px-2 text-lg text-[var(--text-sub)]">Aa</span>
          </div>

          <div className="p-3">
            {mode === "input" ? (
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="登录后可发表评论"
                className="min-h-[160px] w-full resize-y border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4 text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-faint)]"
              />
            ) : (
              <div className="min-h-[160px] border border-[var(--border-normal)] bg-[var(--card-bg)] px-5 py-4">
                {draft.trim() ? (
                  <p className="whitespace-pre-wrap text-base leading-8 text-[var(--text-strong)]">
                    {draft}
                  </p>
                ) : (
                  <p className="text-base text-[var(--text-faint)]">
                    这里会显示评论预览内容
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-2xl bg-[#238636] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(35,134,54,0.8)] transition hover:bg-[#2ea043]"
              >
                <ScanFace size={18} />
                使用 GitHub 登录
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </section>
  );
}
