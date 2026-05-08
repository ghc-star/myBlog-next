import coverImage from "@/assets/images/1.png";
import { demoMarkdown } from "./demoMarkdown";

export interface Article {
  id: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
  category: string;
  categorySlug: string;
  cover?: string;
  content: string;
  color: string;
  publishedAt: string;
  updatedAt: string;
  visits: number;
  comments: number;
}

export interface CategorySummary {
  name: string;
  slug: string;
  count: number;
  color: string;
}

export interface ArchiveSummary {
  year: number;
  count: number;
}

const sharedContent = demoMarkdown;

export const articles: Article[] = [
  {
    id: "react-router",
    title: "React Router 入门指南",
    desc: "从路由定义、嵌套路由到动态参数，快速建立前端路由的基础认知。",
    date: "2026-04-26",
    tags: ["React", "Router"],
    category: "React",
    categorySlug: "react",
    content: sharedContent,
    color: "#dc7182",
    publishedAt: "2026-04-26T01:00:00+08:00",
    updatedAt: "2026-04-26T01:00:00+08:00",
    visits: 23,
    comments: 20,
  },
  {
    id: "dfs-and-bfs-beginner-guide",
    title: "DFS 和 BFS 新手讲解",
    desc: "结合迷宫搜索和树遍历，理解深度优先与广度优先的区别与模板。",
    date: "2026-04-05",
    tags: ["DFS", "BFS", "算法", "入门"],
    category: "算法",
    categorySlug: "algorithm",
    cover: coverImage.src,
    content: sharedContent,
    color: "#8aa37f",
    publishedAt: "2026-04-05T01:00:00+08:00",
    updatedAt: "2026-04-05T01:00:00+08:00",
    visits: 17,
    comments: 0,
  },
  {
    id: "leetcode-hot-100-explained",
    title: "LeetCode Hot 100 精讲",
    desc: "按照题型而不是题号去刷题，建立双指针、滑窗、二叉树和动态规划的题感。",
    date: "2026-04-01",
    tags: ["LeetCode", "Hot100", "面试", "题解"],
    category: "算法",
    categorySlug: "algorithm",
    cover: coverImage.src,
    content: sharedContent,
    color: "#dc7182",
    publishedAt: "2026-04-01T01:00:00+08:00",
    updatedAt: "2026-04-02T09:30:00+08:00",
    visits: 219,
    comments: 0,
  },
  {
    id: "git-first-clone-remote-push",
    title: "Git 新手第一次 clone 到 push",
    desc: "从配置用户名邮箱，到 add、commit、push，完整跑通第一次远程协作。",
    date: "2026-03-28",
    tags: ["Git", "GitHub", "版本控制", "新手"],
    category: "Git",
    categorySlug: "git",
    cover: coverImage.src,
    content: sharedContent,
    color: "#0284c7",
    publishedAt: "2026-03-28T20:00:00+08:00",
    updatedAt: "2026-03-29T10:20:00+08:00",
    visits: 138,
    comments: 2,
  },
  {
    id: "frontend-learning-roadmap-2026",
    title: "2026 前端学习路线",
    desc: "从 HTML、CSS、JavaScript 到 React、TypeScript 和工程化，给出一条可执行路线。",
    date: "2026-03-18",
    tags: ["前端", "学习路线", "React", "TypeScript"],
    category: "学习路线",
    categorySlug: "learning-path",
    cover: coverImage.src,
    content: sharedContent,
    color: "#8b5cf6",
    publishedAt: "2026-03-18T14:30:00+08:00",
    updatedAt: "2026-03-18T15:00:00+08:00",
    visits: 356,
    comments: 8,
  },
  {
    id: "react-state-and-props",
    title: "React 中 props、state 和组件拆分",
    desc: "通过文章列表页的例子理解组件通信、状态更新和条件渲染。",
    date: "2026-02-26",
    tags: ["React", "组件", "状态管理"],
    category: "Web 开发",
    categorySlug: "web-development",
    cover: coverImage.src,
    content: sharedContent,
    color: "#0ea5e9",
    publishedAt: "2026-02-26T19:20:00+08:00",
    updatedAt: "2026-02-26T19:20:00+08:00",
    visits: 284,
    comments: 5,
  },
  {
    id: "campus-oj-problem-model-design",
    title: "校园 OJ 的题目模型设计",
    desc: "整理题目、测试点、样例和难度标签的数据结构设计方式。",
    date: "2026-01-16",
    tags: ["OJ", "数据模型", "后端接口"],
    category: "校园 OJ",
    categorySlug: "campus-oj",
    cover: coverImage.src,
    content: sharedContent,
    color: "#22c55e",
    publishedAt: "2026-01-16T11:00:00+08:00",
    updatedAt: "2026-01-17T16:45:00+08:00",
    visits: 173,
    comments: 3,
  },
  {
    id: "vite-dev-server-common-errors",
    title: "Vite 启动失败常见问题",
    desc: "从端口占用、依赖缺失到 Node 版本不匹配，系统整理排查思路。",
    date: "2026-01-05",
    tags: ["Vite", "Node.js", "环境配置"],
    category: "开发排错",
    categorySlug: "dev-troubleshooting",
    cover: coverImage.src,
    content: sharedContent,
    color: "#f59e0b",
    publishedAt: "2026-01-05T09:10:00+08:00",
    updatedAt: "2026-01-05T09:40:00+08:00",
    visits: 421,
    comments: 6,
  },
  {
    id: "binary-search-template",
    title: "二分查找模板和边界判断",
    desc: "用左闭右闭和左闭右开两种写法，理解 mid、边界和循环条件。",
    date: "2025-12-20",
    tags: ["二分", "算法模板", "边界"],
    category: "算法",
    categorySlug: "algorithm",
    cover: coverImage.src,
    content: sharedContent,
    color: "#e11d48",
    publishedAt: "2025-12-20T17:20:00+08:00",
    updatedAt: "2025-12-20T17:20:00+08:00",
    visits: 199,
    comments: 1,
  },
  {
    id: "typescript-basic-types",
    title: "TypeScript 基础类型速查",
    desc: "整理 interface、type、联合类型、泛型和类型收窄的常见写法。",
    date: "2025-09-12",
    tags: ["TypeScript", "类型", "前端基础"],
    category: "Web 开发",
    categorySlug: "web-development",
    cover: coverImage.src,
    content: sharedContent,
    color: "#0ea5e9",
    publishedAt: "2025-09-12T08:45:00+08:00",
    updatedAt: "2025-09-12T08:45:00+08:00",
    visits: 267,
    comments: 3,
  },
];

export function findArticleById(id: string) {
  return articles.find((article) => article.id === id);
}

export function getCategorySummaries(): CategorySummary[] {
  const categoryMap = new Map<string, CategorySummary>();

  articles.forEach((article) => {
    const current = categoryMap.get(article.categorySlug);
    if (current) {
      current.count += 1;
      return;
    }

    categoryMap.set(article.categorySlug, {
      name: article.category,
      slug: article.categorySlug,
      count: 1,
      color: article.color,
    });
  });

  return [...categoryMap.values()].sort((a, b) => b.count - a.count);
}

export function getArchiveSummaries(): ArchiveSummary[] {
  const archiveMap = new Map<number, number>();

  articles.forEach((article) => {
    const year = new Date(article.date).getFullYear();
    archiveMap.set(year, (archiveMap.get(year) ?? 0) + 1);
  });

  return [...archiveMap.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
}
