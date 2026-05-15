"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ArticleToc, { type TocItem } from "@/components/ArticleRight/ArticleToc";
import ReactMarkdown, { Components } from "react-markdown";
import React from "react";
import remarkGfm from "remark-gfm";
import { ArticleRecord } from "@/lib/article";
import CommentClient from "./CommentClient";

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-");
}
function stripLeadingMarkdownH1(content: string) {
  return content.replace(/^\s*#\s+.+?(?:\r?\n){1,2}/, "");
}
const headingClasses = {
  1: "mb-6 mt-2 scroll-mt-24 text-3xl font-bold leading-tight text-[var(--text-title)]",
  2: "mb-4 mt-8 scroll-mt-24 border-b border-[var(--border-normal)] pb-2 text-2xl font-semibold leading-tight text-[var(--text-title)]",
  3: "mb-3 mt-6 scroll-mt-24 text-xl font-semibold leading-snug text-[var(--text-title)]",
};
export default function ArticleDetailClient({
  article,
}: {
  article: ArticleRecord;
}) {
  const articleRef = useRef<HTMLDivElement | null>(null);
  const tocRef = useRef<HTMLDivElement | null>(null);
  const isTocNavigatingRef = useRef(false);
  const tocTargetIdRef = useRef("");
  const tocNavigationTimerRef = useRef<number | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  const renderedContent = useMemo(() => {
    return stripLeadingMarkdownH1(article.content);
  }, [article]);

  function normalizeHeadingIds(container: HTMLElement) {
    const used = new Map<string, number>();
    const headings = Array.from(
      container.querySelectorAll<HTMLElement>("h1,h2,h3"),
    );

    headings.forEach((heading) => {
      const text = heading.textContent || "";
      const baseId = slugify(text) || "heading";
      const count = used.get(baseId) || 0;
      const nextCount = count + 1;

      used.set(baseId, nextCount);
      heading.id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
    });

    return headings;
  }
  function getNodeText(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map(getNodeText).join("");
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      return getNodeText(node.props.children);
    }

    return "";
  }

  function renderHeading(level: 1 | 2 | 3, children?: React.ReactNode) {
    const text = getNodeText(children).trim();
    const headingId = slugify(text) || "heading";
    const Tag = `h${level}` as "h1" | "h2" | "h3";

    return (
      <Tag id={headingId} className={headingClasses[level]}>
        {children}
      </Tag>
    );
  }

  function HeadingOne({ children }: { children?: React.ReactNode }) {
    return renderHeading(1, children);
  }
  function HeadingTwo({ children }: { children?: React.ReactNode }) {
    return renderHeading(2, children);
  }

  function HeadingThree({ children }: { children?: React.ReactNode }) {
    return renderHeading(3, children);
  }

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
  }, []);

  const components = useMemo<Components>(() => {
    return {
      h1: HeadingOne,
      h2: HeadingTwo,
      h3: HeadingThree,
      h4: ({ children }) => (
        <h4 className="mb-3 mt-5 text-lg font-semibold leading-snug text-[var(--text-title)]">
          {children}
        </h4>
      ),
      p: ({ children }) => (
        <p className="mb-4 leading-8 text-[var(--text-strong)]">{children}</p>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
          className="font-medium text-[var(--theme-accent)] underline decoration-[var(--theme-accent-border)] underline-offset-2 transition hover:decoration-[var(--theme-accent)]"
        >
          {children}
        </a>
      ),
      img: ({ src, alt }) => (
        <span className="my-6 block text-center">
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            className="inline-block max-w-full rounded-xl shadow-[var(--shadow-card)]"
          />
          {alt ? (
            <span className="mt-2 block text-xs text-[var(--text-faint)]">
              {alt}
            </span>
          ) : null}
        </span>
      ),
      ul: ({ children }) => (
        <ul className="mb-4 list-disc pl-6 text-[var(--text-strong)]">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-4 list-decimal pl-6 text-[var(--text-strong)]">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="mb-2 leading-8 marker:text-[var(--theme-accent)]">
          {children}
        </li>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-[var(--text-title)]">
          {children}
        </strong>
      ),
      del: ({ children }) => (
        <del className="text-[var(--text-faint)] line-through">{children}</del>
      ),
      blockquote: ({ children }) => (
        <blockquote className="mb-6 rounded-r-2xl border-l-4 border-[var(--theme-accent)] bg-[var(--card-bg-soft)] px-5 py-3 text-[var(--text-strong)] [&>p]:mb-0 [&>p:last-child]:mb-0">
          {children}
        </blockquote>
      ),
      hr: () => <hr className="my-8 border-[var(--border-normal)]" />,
      table: ({ children }) => (
        <div className="mb-6 overflow-x-auto rounded-xl border border-[var(--border-normal)]">
          <table className="w-full border-collapse text-sm">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-[var(--card-bg-soft)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)]">
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="border-b border-[var(--border-normal)] px-4 py-2.5 font-semibold">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border-b border-[var(--border-normal)] px-4 py-2.5 text-[var(--text-strong)]">
          {children}
        </td>
      ),
      tr: ({ children }) => (
        <tr className="transition even:bg-[var(--card-bg-soft)]/50 hover:bg-[var(--card-bg-soft)]">
          {children}
        </tr>
      ),
      pre: ({ children }) => (
        <div className="group relative mb-6">
          <pre className="overflow-x-auto rounded-2xl bg-[var(--article-code-bg)] p-5 text-[13px] leading-6 text-[var(--article-code-text)] shadow-inner">
            {children}
          </pre>
        </div>
      ),
      code: ({ children, className }) => {
        // 代码块内的 code（有 className 如 language-xxx）
        if (className) {
          const lang = className.replace("language-", "");
          return (
            <code className="block bg-transparent p-0 text-inherit">
              {lang ? (
                <span className="pointer-events-none absolute right-3 top-3 select-none rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--article-code-text)]/50">
                  {lang}
                </span>
              ) : null}
              {children}
            </code>
          );
        }
        // 行内 code
        return (
          <code className="rounded-md bg-[var(--card-bg-soft)] px-1.5 py-0.5 text-[13px] font-medium text-[var(--text-title)]">
            {children}
          </code>
        );
      },
    };
  }, []);

  useEffect(() => {
    if (!articleRef.current) return;

    const headings = normalizeHeadingIds(articleRef.current);
    const tocData: TocItem[] = Array.from(headings).map((heading) => ({
      id: heading.id,
      text: heading.textContent || "",
      level: Number(heading.tagName.charAt(1)),
    }));

    setToc(tocData);
    if (tocData.length > 0) {
      setActiveId(tocData[0].id);
    }
  }, [renderedContent]);

  useEffect(() => {
    const clearTocNavigationTimer = () => {
      if (tocNavigationTimerRef.current !== null) {
        window.clearTimeout(tocNavigationTimerRef.current);
        tocNavigationTimerRef.current = null;
      }
    };

    const releaseTocNavigation = () => {
      clearTocNavigationTimer();
      isTocNavigatingRef.current = false;
      tocTargetIdRef.current = "";
    };

    const scheduleTocNavigationRelease = () => {
      clearTocNavigationTimer();
      tocNavigationTimerRef.current = window.setTimeout(() => {
        releaseTocNavigation();
      }, 180);
    };

    const updateActiveHeading = () => {
      if (!articleRef.current) return;

      if (isTocNavigatingRef.current) {
        const targetId = tocTargetIdRef.current;
        const targetElement = targetId
          ? document.getElementById(targetId)
          : null;

        if (!targetElement) {
          releaseTocNavigation();
        } else {
          const targetOffset = 120;
          const distanceToTarget = Math.abs(
            targetElement.getBoundingClientRect().top - targetOffset,
          );

          if (distanceToTarget > 12) {
            scheduleTocNavigationRelease();
            return;
          }

          releaseTocNavigation();
        }
      }

      const headings = Array.from(
        articleRef.current.querySelectorAll<HTMLElement>("h1,h2,h3"),
      );

      if (!headings.length) return;

      const offset = 120;
      const current = [...headings]
        .reverse()
        .find((heading) => heading.getBoundingClientRect().top <= offset);

      const nextId = current?.id ?? headings[0].id;
      setActiveId((prev) => (prev === nextId ? prev : nextId));
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading);
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      clearTocNavigationTimer();
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [renderedContent]);

  useEffect(() => {
    if (!activeId || !tocRef.current) return;

    const container = tocRef.current;
    const activeItem = container.querySelector<HTMLElement>(
      `[data-toc-id="${CSS.escape(activeId)}"]`,
    );

    if (!activeItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // 只在 active item 真正超出可视区域时才滚动，避免底部抖动
    const isAboveView = itemRect.top < containerRect.top;
    const isBelowView = itemRect.bottom > containerRect.bottom;

    if (!isAboveView && !isBelowView) return;

    activeItem.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeId]);
  useEffect(() => {
    fetch(`/api/articles/${article.id}/view`, {
      method: "POST",
    }).catch((error) => {
      console.error("failed to record article view", error);
    });
  }, [article.id]);

  const handleTocClick = (headingId: string) => {
    if (tocNavigationTimerRef.current !== null) {
      window.clearTimeout(tocNavigationTimerRef.current);
      tocNavigationTimerRef.current = null;
    }

    isTocNavigatingRef.current = true;
    tocTargetIdRef.current = headingId;
    tocNavigationTimerRef.current = window.setTimeout(() => {
      isTocNavigatingRef.current = false;
      tocTargetIdRef.current = "";
      tocNavigationTimerRef.current = null;
    }, 180);

    setActiveId(headingId);
    const element = document.getElementById(headingId);
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (!article) {
    return (
      <div className="px-4 py-10 text-[var(--text-sub)]">未找到对应文章。</div>
    );
  }

  return (
    <div className="mx-auto my-6 grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 min-[900px]:grid-cols-[minmax(0,1fr)_240px] min-[900px]:items-start min-[900px]:py-0 sm:px-6 lg:px-8">
      <main className="article-detail-main min-w-0 rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-6 py-8 shadow-sm sm:px-8 lg:px-10">
        <header className="mb-8 border-b border-[var(--border-normal)] pb-6">
          <h1 className="mb-3 text-3xl font-bold text-[var(--text-title)]">
            {article.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-sub)]">
            <span>{article.date}</span>
            <span>{article.category}</span>
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>

        <article ref={articleRef} className="prose w-full !max-w-none min-w-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {renderedContent}
          </ReactMarkdown>
        </article>

        <CommentClient
          articleId={article.id}
          commentCount={article.comments || 8}
          replyCount={14}
        />
      </main>

      <aside className="hidden self-start min-[900px]:sticky min-[900px]:top-6 min-[900px]:block">
        <ArticleToc
          ref={tocRef}
          toc={toc}
          activeId={activeId}
          onItemClick={handleTocClick}
        />
      </aside>
    </div>
  );
}
