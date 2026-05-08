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
      <aside className="w-full rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
        <div ref={ref} className="max-h-[calc(100vh-48px)] overflow-y-auto p-4">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-title)]">
            目录
          </h3>

          <ul className="space-y-2">
            {toc.map((item) => {
              const isActive = activeId === item.id;

              return (
                <li
                  key={item.id}
                  style={{
                    paddingLeft:
                      item.level === 1 ? 0 : item.level === 2 ? 12 : 24,
                  }}
                >
                  <button
                    type="button"
                    data-toc-id={item.id}
                    onClick={() => onItemClick(item.id)}
                    className={`w-full rounded-lg px-2 py-1 text-left text-sm transition ${
                      isActive
                        ? "bg-[var(--theme-accent-soft)] font-semibold text-[var(--theme-accent)]"
                        : "text-[var(--text-sub)] hover:bg-[var(--card-bg-soft)] hover:text-[var(--text-title)]"
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    );
  },
);

ArticleToc.displayName = "ArticleToc";

export default ArticleToc;
