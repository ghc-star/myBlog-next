import MainLayout from "@/components/layout/MainLayout";
import ArticleList from "@/components/article/ArticleList";

import { getArticles } from "@/lib/article";

const PAGE_SIZE = 5;
function getCurrentPage(pageParam?: string) {
  const page = Number(pageParam);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 先读 searchParams：?page= 分页使首页按请求动态渲染，也让构建期预渲染在查库前就中止
  const { page } = await searchParams;
  const articles = await getArticles();
  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(getCurrentPage(page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedArticles = articles.slice(start, end);

  return (
    <MainLayout>
      <ArticleList
        articles={pagedArticles}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </MainLayout>
  );
}
