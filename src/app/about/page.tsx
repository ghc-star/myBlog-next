import { getArticleSummaries, getCategorySummaries } from "@/lib/article";
import AboutClient from "./AboutClinet";

export default async function AboutPage() {
  const [articles, categories] = await Promise.all([
    getArticleSummaries(),
    getCategorySummaries(),
  ]);
  const tagCount = new Set(articles.flatMap((item) => item.tags)).size;

  return (
    <AboutClient
      articleCount={articles.length}
      categoryCount={categories.length}
      tagCount={tagCount}
    ></AboutClient>
  );
}
