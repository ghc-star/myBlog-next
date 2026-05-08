import { Article } from "../../data/articles";
import ArticleCard from "./ArticleCard";
import Link from "next/link";
interface ArticleListProps {
  articles: Article[];
  currentPage: number;
  totalPages: number;
}

function getPageHref(page: number) {
  return page <= 1 ? "/" : `/?page=${page}`;
}
function ArticleList({ articles, currentPage, totalPages }: ArticleListProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="my-3 flex flex-col gap-5">
      {articles.map((item) => (
        <ArticleCard key={item.id} article={item} />
      ))}

      <div className="flex items-center justify-center gap-3 pt-2">
        {hasPrev ? (
          <Link
            href={getPageHref(currentPage - 1)}
            className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] shadow-[var(--shadow-card)] transition hover:[box-shadow:var(--shadow-card-hover)]"
          >
            上一页
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] opacity-40">
            上一页
          </span>
        )}

        <span className="text-sm text-[var(--text-sub)]">
          第 {currentPage} / {totalPages} 页
        </span>

        {hasNext ? (
          <Link
            href={getPageHref(currentPage + 1)}
            className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] shadow-[var(--shadow-card)] transition hover:[box-shadow:var(--shadow-card-hover)]"
          >
            下一页
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-xl border border-[var(--border-normal)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-strong)] opacity-40">
            下一页
          </span>
        )}
      </div>
    </div>
  );
}

export default ArticleList;
