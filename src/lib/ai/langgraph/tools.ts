import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { embedQuery } from "@/lib/ai/embed";
import { searchChunks } from "@/lib/ai/vector";
import {
  getArticles,
  getArticlesByCategorySlug,
  getCategorySummaries,
} from "@/lib/article";

function clampLimit(limit: number | undefined, fallback: number, max: number) {
  if (!limit || !Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(Math.floor(limit), 1), max);
}

function formatArticleLink(id: string, title: string) {
  return `**[${title}](/article/${id})**`;
}

export const getBlogStatsTool = tool(
  async () => {
    const [articles, categories] = await Promise.all([
      getArticles(),
      getCategorySummaries(),
    ]);

    const categoryText = categories.length
      ? categories
          .map((category) => `- ${category.name}：${category.count} 篇`)
          .join("\n")
      : "暂无分类数据";

    return `博客目前共有 ${articles.length} 篇文章。\n\n分类分布：\n${categoryText}`;
  },
  {
    name: "get_blog_stats",
    description: "获取博客文章总数和分类分布。用户询问博客整体情况、统计、分类数量时使用。",
    schema: z.object({}),
  },
);

export const listBlogArticlesTool = tool(
  async ({ limit }) => {
    const articles = await getArticles();
    const safeLimit = clampLimit(limit, 20, 30);
    const items = articles.slice(0, safeLimit).map((article, index) => {
      const tags = article.tags.length
        ? `\n   - 标签：${article.tags.join("、")}`
        : "";
      const desc = article.desc ? `\n   - 简介：${article.desc}` : "";

      return `${index + 1}. ${formatArticleLink(article.id, article.title)}\n   - 分类：${article.category}\n   - 发布时间：${article.date}${tags}${desc}`;
    });

    return items.length
      ? `博客里目前可以阅读这些文章：\n\n${items.join("\n\n")}`
      : "目前还没有文章。";
  },
  {
    name: "list_blog_articles",
    description: "列出博客文章。用户问博客有哪些文章、文章列表、最近文章时使用。不要向用户展示内部 ID。",
    schema: z.object({
      limit: z.number().optional().describe("最多返回几篇文章，默认 20，最多 30。"),
    }),
  },
);

export const recommendBlogArticleTool = tool(
  async () => {
    const articles = await getArticles();
    const article = [...articles].sort((a, b) => b.visits - a.visits)[0];

    if (!article) return "目前还没有可推荐的文章。";

    const tags = article.tags.length ? `\n- 标签：${article.tags.join("、")}` : "";

    return `我推荐你先读 ${formatArticleLink(article.id, article.title)}。\n\n这篇文章是博客里浏览量比较高的一篇，适合优先阅读。\n\n- 分类：${article.category}\n- 发布时间：${article.date}${tags}\n- 简介：${article.desc || `这是一篇 ${article.category} 分类下的文章，适合作为了解博客内容的入口。`}`;
  },
  {
    name: "recommend_blog_article",
    description: "按浏览量推荐一篇博客文章。用户要求推荐文章、推荐一篇值得读的文章时使用。",
    schema: z.object({}),
  },
);

export const listArticlesByCategoryTool = tool(
  async ({ categoryName }) => {
    const categories = await getCategorySummaries();
    const category = categories.find(
      (item) =>
        item.name.includes(categoryName) || categoryName.includes(item.name),
    );

    if (!category) {
      const categoryText = categories.map((item) => `- ${item.name}`).join("\n");
      return `没有找到「${categoryName}」这个分类。当前分类有：\n${categoryText || "暂无分类"}`;
    }

    const articles = await getArticlesByCategorySlug(category.slug);
    const items = articles.map((article, index) => {
      const desc = article.desc ? `\n   - 简介：${article.desc}` : "";
      return `${index + 1}. ${formatArticleLink(article.id, article.title)}\n   - 发布时间：${article.date}${desc}`;
    });

    return items.length
      ? `「${category.name}」分类下的文章：\n\n${items.join("\n\n")}`
      : `「${category.name}」分类下暂时没有文章。`;
  },
  {
    name: "list_articles_by_category",
    description: "按分类名查找博客文章。用户问某个分类有哪些文章时使用，输入应是用户提到的分类名。",
    schema: z.object({
      categoryName: z.string().describe("用户提到的分类名，例如 前端、后端、算法。"),
    }),
  },
);

export const readBlogArticleTool = tool(
  async ({ title }) => {
    const articles = await getArticles();
    const article = articles.find(
      (item) => item.title.includes(title) || title.includes(item.title),
    );

    if (!article) {
      return `没有找到标题包含「${title}」的文章。可以先调用 list_blog_articles 查看可阅读的文章。`;
    }

    return `# ${article.title}\n\n链接：/article/${article.id}\n分类：${article.category}\n日期：${article.date}\n\n${article.content.slice(0, 4000)}`;
  },
  {
    name: "read_blog_article",
    description: "读取某篇博客文章内容。用户明确要求阅读、查看、打开某篇文章时使用。",
    schema: z.object({
      title: z.string().describe("用户要阅读的文章标题或标题关键词。"),
    }),
  },
);

export const searchBlogContentTool = tool(
  async ({ query, topK }) => {
    const vector = await embedQuery(query);
    const hits = await searchChunks(vector, clampLimit(topK, 5, 8));

    if (!hits.length) return `没有检索到和「${query}」相关的博客片段。`;

    return hits
      .map(
        (hit, index) =>
          `[${index + 1}] 标题：${hit.payload.title}\nURL：${hit.payload.url}\n相关度：${hit.score.toFixed(3)}\n片段：${hit.payload.text}`,
      )
      .join("\n\n");
  },
  {
    name: "search_blog_content",
    description: "搜索博客正文片段。用户问某个技术点、文章内容、博客中是否提到某主题时使用。",
    schema: z.object({
      query: z.string().describe("要在博客内容中搜索的问题或关键词。"),
      topK: z.number().optional().describe("返回片段数量，默认 5，最多 8。"),
    }),
  },
);

export const getHitokotoTool = tool(
  async () => {
    try {
      const response = await fetch("https://v1.hitokoto.cn/", {
        cache: "no-store",
      });

      if (!response.ok) return "一言服务暂时不可用。";

      const data = await response.json();
      const author = data.from_who ? ` · ${data.from_who}` : "";
      const from = data.from ? `《${data.from}》` : "未知出处";

      return `${data.hitokoto}\n\n—— ${from}${author}`;
    } catch {
      return "一言服务请求失败。";
    }
  },
  {
    name: "get_hitokoto",
    description: "获取一句话、一言、句子。用户说来一句、分享一句、励志一句时使用。",
    schema: z.object({}),
  },
);

export const getWeatherTool = tool(
  async ({ city, forecast }) => {
    const key = process.env.AMAP_KEY;
    if (!key) return "高德 API Key 未配置，暂时无法查询天气。";

    try {
      const geoResponse = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?key=${key}&address=${encodeURIComponent(city)}`,
        { cache: "no-store" },
      );
      const geoData = await geoResponse.json();

      if (geoData.status !== "1" || !geoData.geocodes?.length) {
        return `没找到「${city}」对应的城市。`;
      }

      const adcode = geoData.geocodes[0].adcode as string;
      const formattedAddress = geoData.geocodes[0].formatted_address as string;
      const weatherResponse = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${adcode}&extensions=${forecast ? "all" : "base"}`,
        { cache: "no-store" },
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.status !== "1") return "天气查询失败。";

      if (forecast) {
        const forecastInfo = weatherData.forecasts?.[0];
        if (!forecastInfo) return "没有预报数据。";

        const days = (forecastInfo.casts as Array<Record<string, string>>)
          .map(
            (cast) =>
              `- ${cast.date}：白天${cast.dayweather} ${cast.daytemp}°C，夜间${cast.nightweather} ${cast.nighttemp}°C，${cast.daywind}风 ${cast.daypower} 级`,
          )
          .join("\n");

        return `${formattedAddress} 未来天气：\n${days}`;
      }

      const live = weatherData.lives?.[0];
      if (!live) return "没有实时天气数据。";

      return `${formattedAddress} 当前天气：${live.weather}，${live.temperature}°C，${live.winddirection}风 ${live.windpower} 级，湿度 ${live.humidity}%。更新时间：${live.reporttime}`;
    } catch {
      return "天气服务请求失败。";
    }
  },
  {
    name: "get_weather",
    description: "查询城市天气。用户询问天气、气温、下雨、未来天气预报时使用。",
    schema: z.object({
      city: z.string().describe("城市名，例如 北京、上海、广州。"),
      forecast: z.boolean().optional().describe("是否查询未来天气预报。"),
    }),
  },
);

export const blogAssistantTools = [
  getBlogStatsTool,
  listBlogArticlesTool,
  recommendBlogArticleTool,
  listArticlesByCategoryTool,
  readBlogArticleTool,
  searchBlogContentTool,
  getHitokotoTool,
  getWeatherTool,
];
