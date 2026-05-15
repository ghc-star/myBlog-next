import { forwardRef } from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ArticleTocProps {
  toc: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}

const ArticleToc = forwardRef<HTMLDivElement, ArticleTocProps>(
  ({ toc, activeId, onItemClick }, ref) => {
    if (!toc.length) return null;

    return (
      <nav
        aria-label="文章目录"
        className="w-full rounded-2xl border border-(--border-normal) bg-(--card-bg) shadow-(--shadow-card)"
      >
        <div className="flex items-center gap-2 border-b border-(--border-normal) px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-(--theme-accent)"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h3 className="text-sm font-semibold text-(--text-title)">目录</h3>
          <span className="ml-auto text-xs text-(--text-faint)">
            {toc.length} 节
          </span>
        </div>

        <div
          ref={ref}
          className="max-h-[calc(100vh-140px)] overflow-y-auto scroll-smooth px-3 py-3"
        >
          <ul className="space-y-0.5">
            {toc.map((item) => {
              const isActive = activeId === item.id;
              const indent =
                item.level === 1 ? 0 : item.level === 2 ? 16 : 32;

              return (
                <li key={item.id} style={{ paddingLeft: indent }}>
                  <button
                    type="button"
                    data-toc-id={item.id}
                    onClick={() => onItemClick(item.id)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-[13px] leading-5 transition-all duration-200 ${
                      isActive
                        ? "bg-(--theme-accent-soft) font-medium text-(--theme-accent)"
                        : "text-(--text-sub) hover:bg-(--card-bg-soft) hover:text-(--text-title)"
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    );
  },
);

ArticleToc.displayName = "ArticleToc";

export default ArticleToc;
