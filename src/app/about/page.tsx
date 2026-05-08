import { articles, getCategorySummaries } from "@/data/articles";
import AboutClient from "./AboutClinet";

export default function AboutPage() {
  const categories = getCategorySummaries();
  const tagCount = new Set(articles.flatMap((item) => item.tags)).size;
  return (
    <AboutClient
      articleCount={articles.length}
      categoryCount={categories.length}
      tagCount={tagCount}
    ></AboutClient>
  );
}
