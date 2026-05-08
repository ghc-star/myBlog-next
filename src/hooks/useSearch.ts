import { useMemo } from "react";
import { articles } from "../data/articles";

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function useSearch(keyword: string) {
  return useMemo(() => {
    const q = normalize(keyword);
    if (!q) return [];
    return articles.filter((article) => {
      const haystack = [
        article.title,
        article.desc,
        article.category,
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [keyword]);
}
