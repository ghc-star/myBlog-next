import { toArticleSummary, type ArticleRecord, type ArticleSummary } from "@/lib/article";

export type ScoredArticle = {
  article: ArticleSummary;
  score: number;
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

/** 简单加权检索：标题 > 摘要 > 分类/标签 > 正文，返回值不含正文 */
export function searchArticles(
  articles: ArticleRecord[],
  keyword: string,
): ScoredArticle[] {
  const q = normalize(keyword);
  if (!q) return [];

  const scored: ScoredArticle[] = [];

  for (const article of articles) {
    const title = article.title.toLowerCase();
    const desc = article.desc.toLowerCase();
    const category = article.category.toLowerCase();
    const tags = article.tags.map((t) => t.toLowerCase());
    const content = article.content.toLowerCase();

    let score = 0;
    if (title.includes(q)) score += 10;
    if (desc.includes(q)) score += 5;
    if (category.includes(q)) score += 4;
    if (tags.some((t) => t.includes(q))) score += 4;
    if (content.includes(q)) score += 1;

    if (score > 0) {
      scored.push({ article: toArticleSummary(article), score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.article.visits !== a.article.visits) {
      return b.article.visits - a.article.visits;
    }
    return (
      new Date(b.article.publishedAt).getTime() -
      new Date(a.article.publishedAt).getTime()
    );
  });

  return scored;
}

/** 无关键词时的浏览列表：按浏览量、再按发布时间排序，返回值不含正文 */
export function browseArticles(articles: ArticleRecord[]): ArticleSummary[] {
  return [...articles]
    .sort((a, b) => {
      if (b.visits !== a.visits) return b.visits - a.visits;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    })
    .map(toArticleSummary);
}
