"use client";

import { useActionState, useEffect, useMemo, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PolishDiffOverlay from "./PolishDiffOverlay";
import { useWriterAi } from "./useWriterAi";

import type { ArticleFormState } from "../_actions";

type ArticleInitial = {
  id?: string;
  title: string;
  desc: string;
  category: string;
  categorySlug: string;
  tags: string[];
  cover: string | null;
  color: string;
  content: string;
};

type ArticleEditorProps = {
  mode: "create" | "edit";
  initial?: ArticleInitial;
  categoryOptions: Array<{ name: string; slug: string }>;
  action: (
    prev: ArticleFormState,
    formData: FormData,
  ) => Promise<ArticleFormState>;
};

const PRESET_COLORS = [
  "#0ea5e9",
  "#2563eb",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#facc15",
  "#14b8a6",
];

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-(--theme-accent) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "保存中..." : mode === "create" ? "发布文章" : "保存修改"}
    </button>
  );
}

export default function ArticleEditor({
  mode,
  initial,
  categoryOptions,
  action,
}: ArticleEditorProps) {
  const [state, formAction] = useActionState<ArticleFormState, FormData>(
    action,
    {},
  );

  const ai = useWriterAi();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [categorySlug, setCategorySlug] = useState(initial?.categorySlug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.categorySlug));
  const [cover, setCover] = useState(initial?.cover ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [toast, setToast] = useState<string | null>(null);
  const [draftLen, setDraftLen] = useState<"short" | "medium" | "long">(
    "medium",
  );
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  // 润色浮层
  const [polish, setPolish] = useState<{
    open: boolean;
    original: string;
    draft: string;
    loading: boolean;
    modeLabel: string;
    // 应用时需要把 draft 替换回原始位置
    range: { start: number; end: number } | null;
  } | null>(null);
  
  

  // 自动从 category 推 slug，除非用户手动改过（在 onChange 里同步推，避免 effect 里 setState）
  function handleCategoryChange(value: string) {
    setCategory(value);
    if (!slugTouched) {
      setCategorySlug(slugify(value));
    }
  }

  useEffect(() => {
    if (state.ok && state.message) {
      // 用 microtask 把 setState 推到 effect body 之外，避开 react-hooks/no-direct-set-state-in-use-effect
      queueMicrotask(() => setToast(state.message ?? null));
      const timer = window.setTimeout(() => setToast(null), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [state]);

  const fieldErrors = state.fieldErrors ?? {};
  const knownCategories = useMemo(() => {
    const map = new Map(categoryOptions.map((c) => [c.name, c.slug]));
    return map;
  }, [categoryOptions]);

  function commitTag(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (tags.includes(value)) {
      setTagDraft("");
      return;
    }
    setTags([...tags, value]);
    setTagDraft("");
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTag(tagDraft);
    } else if (event.key === "Backspace" && !tagDraft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.message && !state.ok ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {state.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* 左侧 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-(--text-sub)">
              标题
            </label>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="给文章起个标题"
              className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-base text-(--text-title) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-xs text-rose-500">{fieldErrors.title}</p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-(--text-sub)">
                摘要
              </label>
              <button
                type="button"
                disabled={!title || content.trim().length < 10 || ai.pending !== null}
                onClick={async () => {
                  const r = await ai.genSummary(title, content);
                  if (r?.desc) setDesc(r.desc);
                }}
                title={
                  content.trim().length < 10
                    ? "正文至少 10 个字符才能生成摘要"
                    : undefined
                }
                className="rounded-md border border-(--border-normal) px-2 py-0.5 text-[11px] text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--theme-accent) disabled:opacity-50"
              >
                {ai.pending === "summary" ? "生成中…" : "AI 生成"}
              </button>
            </div>
            <textarea
              name="desc"
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              rows={2}
              placeholder="文章列表上展示的简介"
              className="mt-1.5 w-full resize-y rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm leading-6 text-(--text-strong) outline-none transition placeholder:text-(--text-faint) focus:border-(--theme-accent)"
            />
            {fieldErrors.desc ? (
              <p className="mt-1 text-xs text-rose-500">{fieldErrors.desc}</p>
            ) : null}
          </div>

          {/* 编辑器 / 预览切换 */}
          <div className="rounded-lg border border-(--border-normal) bg-(--card-bg)">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-normal) px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md bg-(--card-bg-soft) p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setView("edit")}
                    className={`rounded px-3 py-1 transition ${
                      view === "edit"
                        ? "bg-(--card-bg) font-medium text-(--text-title) shadow-sm"
                        : "text-(--text-sub)"
                    }`}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("preview")}
                    className={`rounded px-3 py-1 transition ${
                      view === "preview"
                        ? "bg-(--card-bg) font-medium text-(--text-title) shadow-sm"
                        : "text-(--text-sub)"
                    }`}
                  >
                    预览
                  </button>
                </div>

                {/* 润色按钮组 */}
                <div className="flex items-center gap-1">
                  {(["fix", "rewrite", "shorten", "expand"] as const).map((mode) => {
                    const labels = {
                      fix: "校对",
                      rewrite: "重写",
                      shorten: "精简",
                      expand: "扩写",
                    } as const;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={ai.pending !== null}
                        onClick={async () => {
                          const ta = contentRef.current;
                          if (!ta) return;
                          const start = ta.selectionStart;
                          const end = ta.selectionEnd;
                          const sel = content.slice(start, end);
                          if (!sel.trim()) {
                            alert("请先选中要" + labels[mode] + "的文本");
                            return;
                          }
                          setPolish({
                            open: true,
                            original: sel,
                            draft: "",
                            loading: true,
                            modeLabel: labels[mode],
                            range: { start, end },
                          });
                          await ai.polish(sel, mode, (full) => {
                            setPolish((prev) =>
                              prev ? { ...prev, draft: full } : prev,
                            );
                          });
                          setPolish((prev) =>
                            prev ? { ...prev, loading: false } : prev,
                          );
                        }}
                        className="rounded px-2 py-0.5 text-[11px] text-(--text-sub) transition hover:bg-(--card-bg-soft) hover:text-(--text-title) disabled:opacity-50"
                      >
                        {ai.pending === `polish:${mode}` ? "…" : labels[mode]}
                      </button>
                    );
                  })}
                </div>

                <span className="h-3 w-px bg-(--border-normal)" />

                {/* 续写 */}
                <button
                  type="button"
                  disabled={ai.pending !== null || !content.trim()}
                  onClick={async () => {
                    const ta = contentRef.current;
                    if (!ta) return;
                    const pos = ta.selectionStart;
                    const before = content.slice(0, pos);
                    const after = content.slice(pos);
                    // 续写不走 diff 浮层（一般是空白处插入），保留原行为：直接插入
                    let lastFull = "";
                    await ai.continueAt(before, "medium", (full) => {
                      // 增量替换 (before + AI输出 + after)
                      setContent(before + full + after);
                      lastFull = full;
                    });
                    // 续写完成后，把光标移到插入末尾
                    requestAnimationFrame(() => {
                      if (contentRef.current) {
                        const cursor = before.length + lastFull.length;
                        contentRef.current.focus();
                        contentRef.current.setSelectionRange(cursor, cursor);
                      }
                    });
                  }}
                  className="rounded px-2 py-0.5 text-[11px] text-(--theme-accent) transition hover:bg-(--theme-accent-soft) disabled:opacity-50"
                >
                  {ai.pending?.startsWith("continue") ? "续写中…" : "续写"}
                </button>

                <span className="h-3 w-px bg-(--border-normal)" />

                {/* AI 草稿（根据标题写整篇） */}
                <div className="flex items-center gap-1">
                  <select
                    value={draftLen}
                    onChange={(e) =>
                      setDraftLen(e.target.value as "short" | "medium" | "long")
                    }
                    disabled={ai.pending !== null}
                    title="草稿长度"
                    className="h-6 rounded border border-(--border-normal) bg-(--card-bg) px-1 text-[11px] text-(--text-sub) outline-none disabled:opacity-50"
                  >
                    <option value="short">短 ~500</option>
                    <option value="medium">中 ~1200</option>
                    <option value="long">长 ~2500</option>
                  </select>
                  <button
                    type="button"
                    disabled={!title || ai.pending !== null}
                    onClick={async () => {
                      // 已有内容 → 让用户选追加 / 覆盖 / 取消
                      let mode: "replace" | "append" | "cancel" = "replace";
                      if (content.trim()) {
                        const ans = window.prompt(
                          "编辑器已有内容，输入：\n  r = 覆盖（清空后写入）\n  a = 追加到末尾\n  其他 = 取消",
                          "a",
                        );
                        if (ans === "r" || ans === "R") mode = "replace";
                        else if (ans === "a" || ans === "A") mode = "append";
                        else mode = "cancel";
                      }
                      if (mode === "cancel") return;

                      const prefix =
                        mode === "append" && content
                          ? content.replace(/\s*$/, "") + "\n\n"
                          : "";

                      let lastFull = "";
                      await ai.draftAt(
                        {
                          title,
                          category: category || undefined,
                          tags: tags.length > 0 ? tags : undefined,
                          desc: desc || undefined,
                          approxLength: draftLen,
                        },
                        (full) => {
                          lastFull = full;
                          setContent(prefix + full);
                        },
                      );

                      // 草稿写完，光标放到末尾
                      requestAnimationFrame(() => {
                        if (contentRef.current) {
                          const cursor = (prefix + lastFull).length;
                          contentRef.current.focus();
                          contentRef.current.setSelectionRange(cursor, cursor);
                        }
                      });
                    }}
                    title={
                      !title
                        ? "请先填写标题"
                        : "根据当前标题（含分类/标签/摘要）生成整篇草稿"
                    }
                    className="rounded px-2 py-0.5 text-[11px] text-(--theme-accent) transition hover:bg-(--theme-accent-soft) disabled:opacity-50"
                  >
                    {ai.pending?.startsWith("draft") ? "起稿中…" : "AI 草稿"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {ai.error ? (
                  <span className="text-rose-500">{ai.error}</span>
                ) : null}
                <span className="text-(--text-faint)">
                  Markdown · {content.length} 字
                </span>
              </div>
            </div>


            {view === "edit" ? (
              <textarea
                ref={contentRef}
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={22}
                placeholder="# 写下你的文章正文（Markdown）"
                className="block w-full resize-y rounded-b-lg bg-(--card-bg) px-4 py-3 font-mono text-sm leading-7 text-(--text-strong) outline-none placeholder:text-(--text-faint)"
              />
            ) : (
              <>
                <input type="hidden" name="content" value={content} />
                <article className="prose max-w-none px-4 py-4 text-sm leading-7 text-(--text-strong)">
                  {content.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-(--text-faint)">这里会显示预览内容</p>
                  )}
                </article>
              </>
            )}
            {fieldErrors.content ? (
              <p className="px-4 pb-3 text-xs text-rose-500">
                {fieldErrors.content}
              </p>
            ) : null}
          </div>
        </div>

        {/* 右侧 */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {mode === "create" ? (
            <div>
              <label className="block text-xs font-medium text-(--text-sub)">
                自定义 ID（可选）
              </label>
              <input
                name="id"
                placeholder="留空将根据标题生成"
                className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm outline-none placeholder:text-(--text-faint) focus:border-(--theme-accent)"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-(--text-sub)">
              分类
            </label>
            <input
              name="category"
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              list="admin-category-options"
              placeholder="例：前端 / 算法"
              className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm outline-none placeholder:text-(--text-faint) focus:border-(--theme-accent)"
            />
            <datalist id="admin-category-options">
              {categoryOptions.map((cat) => (
                <option key={cat.slug} value={cat.name} />
              ))}
            </datalist>
            {fieldErrors.category ? (
              <p className="mt-1 text-xs text-rose-500">
                {fieldErrors.category}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-(--text-sub)">
              分类 Slug
            </label>
            <input
              name="categorySlug"
              value={categorySlug}
              onChange={(event) => {
                setSlugTouched(true);
                setCategorySlug(event.target.value);
              }}
              placeholder="自动从分类生成"
              className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm outline-none placeholder:text-(--text-faint) focus:border-(--theme-accent)"
            />
            {category && knownCategories.has(category) &&
            knownCategories.get(category) !== categorySlug ? (
              <p className="mt-1 text-xs text-amber-500">
                该分类已存在 slug «{knownCategories.get(category)}»
              </p>
            ) : null}
            {fieldErrors.categorySlug ? (
              <p className="mt-1 text-xs text-rose-500">
                {fieldErrors.categorySlug}
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-(--text-sub)">
                标签
              </label>
              <button
                type="button"
                disabled={!title || content.trim().length < 10 || ai.pending !== null}
                onClick={async () => {
                  const r = await ai.genTags(title, content);
                  if (r?.tags) {
                    setTags(Array.from(new Set([...tags, ...r.tags])));
                  }
                }}
                title={
                  content.trim().length < 10
                    ? "正文至少 10 个字符才能推荐标签"
                    : undefined
                }
                className="rounded-md border border-(--border-normal) px-2 py-0.5 text-[11px] text-(--text-sub) transition hover:border-(--theme-accent) hover:text-(--theme-accent) disabled:opacity-50"
              >
                {ai.pending === "tags" ? "推荐中…" : "AI 推荐"}
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-md border border-(--border-normal) bg-(--card-bg) px-2 py-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-(--theme-accent-soft) px-2 py-0.5 text-xs text-(--theme-accent)"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="rounded-full px-1 text-xs text-(--theme-accent) hover:bg-white/40"
                    aria-label={`删除 ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => commitTag(tagDraft)}
                placeholder={tags.length === 0 ? "回车添加" : ""}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-(--text-faint)"
              />
            </div>
            <input type="hidden" name="tags" value={tags.join(",")} />
          </div>

          <div>
            <label className="block text-xs font-medium text-(--text-sub)">
              封面 URL（可选）
            </label>
            <input
              name="cover"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 text-sm outline-none placeholder:text-(--text-faint) focus:border-(--theme-accent)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-(--text-sub)">
              主题色
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-(--border-normal) bg-(--card-bg)"
              />
              <input
                name="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="flex-1 rounded-md border border-(--border-normal) bg-(--card-bg) px-3 py-2 font-mono text-sm outline-none focus:border-(--theme-accent)"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    color.toLowerCase() === preset.toLowerCase()
                      ? "border-(--text-title)"
                      : "border-transparent hover:border-(--text-sub)"
                  }`}
                  aria-label={preset}
                />
              ))}
            </div>
          </div>

           <div className="flex items-center justify-end pt-2">
            <SubmitButton mode={mode} />
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      {polish ? (
      <PolishDiffOverlay
        open={polish.open}
        original={polish.original}
        draft={polish.draft}
        loading={polish.loading}
        modeLabel={polish.modeLabel}
        onClose={() => setPolish(null)}
        onApply={(text) => {
          if (!polish.range) return;
          const before = content.slice(0, polish.range.start);
          const after = content.slice(polish.range.end);
          setContent(before + text + after);
          setPolish(null);
          // 选中刚替换的内容，方便用户继续操作
          requestAnimationFrame(() => {
            const ta = contentRef.current;
            if (!ta) return;
            ta.focus();
            ta.setSelectionRange(
              polish.range!.start,
              polish.range!.start + text.length,
            );
          });
        }}
      />
    ) : null}

    </form>
  );
}
