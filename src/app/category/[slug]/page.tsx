import { notFound } from "next/navigation";
import ArticleCard from "@/components/article/ArticleCard";
import { getArticlesByCategorySlug, getCategorySummaries } from "@/lib/article";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, categoryArticles] = await Promise.all([
    getCategorySummaries(),
    getArticlesByCategorySlug(slug),
  ]);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-[900px] px-4 py-10">
      <div className="mb-6 rounded-3xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-bold text-[var(--text-title)]">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-sub)]">
          共 {categoryArticles.length} 篇文章
        </p>
      </div>

      <div className="grid gap-4">
        {categoryArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
