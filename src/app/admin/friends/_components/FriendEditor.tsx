"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { FriendFormState } from "../_actions";

type FriendEditorProps = {
  mode: "create" | "edit";
  initial?: {
    name: string;
    description: string;
    url: string;
    avatarUrl: string | null;
    sortOrder: number;
    status: "active" | "pending" | "hidden";
  };
  action: (
    prev: FriendFormState,
    formData: FormData,
  ) => Promise<FriendFormState>;
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-(--theme-accent) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "保存中..." : mode === "create" ? "添加友链" : "保存修改"}
    </button>
  );
}

export default function FriendEditor({
  mode,
  initial,
  action,
}: FriendEditorProps) {
  const [state, formAction] = useActionState<FriendFormState, FormData>(
    action,
    {},
  );

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [status, setStatus] = useState<"active" | "pending" | "hidden">(
    initial?.status ?? "active",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      queueMicrotask(() => setToast(state.message ?? null));
      const t = window.setTimeout(() => setToast(null), 1800);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.message && !state.ok ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {state.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-(--text-sub)">
            站名
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：ghc"
            className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm text-(--text-title) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-(--text-sub)">
            简介
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="一句话介绍这个站"
            className="mt-1.5 w-full resize-y rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm leading-6 text-(--text-strong) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-(--text-faint)">
            <span>{fieldErrors.description ?? ""}</span>
            <span className={description.length > 255 ? "text-rose-500" : ""}>
              {description.length}/255
            </span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-(--text-sub)">
            链接
          </label>
          <input
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 font-mono text-sm text-(--text-title) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
          />
          {fieldErrors.url ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.url}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-(--text-sub)">
            头像 URL（可选）
          </label>
          <input
            name="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://avatars.githubusercontent.com/..."
            className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 font-mono text-sm text-(--text-title) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
          />
          {fieldErrors.avatarUrl ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.avatarUrl}</p>
          ) : null}
          <p className="mt-1 text-xs text-(--text-faint)">
            留空时会用站名首字母 + 渐变色块兜底。
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-(--text-sub)">
            排序权重
          </label>
          <input
            name="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm tabular-nums text-(--text-title) outline-none transition focus:border-(--theme-accent)"
          />
          <p className="mt-1 text-xs text-(--text-faint)">
            数字越大越靠前；默认 0。
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-(--text-sub)">
            状态
          </label>
          <select
            name="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "active" | "pending" | "hidden")
            }
            className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm text-(--text-title) outline-none transition focus:border-(--theme-accent)"
          >
            <option value="active">显示</option>
            <option value="pending">待审核</option>
            <option value="hidden">隐藏</option>
          </select>
          {fieldErrors.status ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.status}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <SubmitButton mode={mode} />
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </form>
  );
}
