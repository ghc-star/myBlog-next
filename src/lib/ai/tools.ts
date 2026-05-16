import "server-only";
import { tool } from "ai";
import { z } from "zod";

import {
  getArticles,
  getArticleById,
  getCategorySummaries,
  getArticlesByCategorySlug,
} from "@/lib/article";
import { embedQuery } from "./embed";
import { searchChunks } from "./vector";

export const blogTools = {
  getBlogStats: tool({
    description:
      "获取博客的整体统计信息：文章总数、分类列表、每个分类的文章数量。当用户问『有多少文章』『有哪些分类』『博客整体情况』时使用。",
    inputSchema: z.object({}),
    execute: async () => {
      const [articles, categories] = await Promise.all([
        getArticles(),
        getCategorySummaries(),
      ]);
      return {
        totalArticles: articles.length,
        categories: categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          count: c.count,
        })),
      };
    },
  }),

  listArticles: tool({
    description:
      "列出博客所有文章的标题、分类、日期和摘要。当用户问『列出所有文章』『最近写了什么』『推荐文章』时使用。",
    inputSchema: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("最多返回多少篇，默认 20"),
    }),
    execute: async ({ limit = 20 }) => {
      const articles = await getArticles();
      return articles.slice(0, limit).map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        date: a.date,
        desc: a.desc,
        tags: a.tags,
        visits: a.visits,
      }));
    },
  }),

  getArticlesByCategory: tool({
    description:
      "根据分类 slug 查询该分类下的全部文章。当用户问『前端类有哪些文章』『算法类的文章』时使用。",
    inputSchema: z.object({
      categorySlug: z.string().describe("分类 slug，如 frontend / algorithm"),
    }),
    execute: async ({ categorySlug }) => {
      const articles = await getArticlesByCategorySlug(categorySlug);
      return articles.map((a) => ({
        id: a.id,
        title: a.title,
        date: a.date,
        desc: a.desc,
      }));
    },
  }),

  readArticle: tool({
    description:
      "根据文章 id 获取一篇文章的完整内容。当需要详细解释某篇文章时使用。",
    inputSchema: z.object({
      id: z.string().describe("文章 id"),
    }),
    execute: async ({ id }) => {
      const article = await getArticleById(id);
      if (!article) return { error: "文章不存在" };
      return {
        id: article.id,
        title: article.title,
        category: article.category,
        date: article.date,
        content: article.content.slice(0, 4000),
      };
    },
  }),

  searchBlog: tool({
    description:
      "在博客全文中做语义搜索，返回最相关的内容片段。当用户问具体技术问题、需要从博客内容中找答案时使用。",
    inputSchema: z.object({
      query: z.string().describe("搜索关键词或问题"),
      topK: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("返回片段数，默认 5"),
    }),
    execute: async ({ query, topK = 5 }) => {
      const vec = await embedQuery(query);
      const hits = await searchChunks(vec, topK);
      return hits.map((hit) => ({
        title: hit.payload.title,
        url: hit.payload.url,
        score: hit.score,
        text: hit.payload.text,
      }));
    },
  }),

  getHitokoto: tool({
    description:
      "获取一句优美的中文短句（一言 / hitokoto），可以是动漫、文学、影视、诗词等出处的好句。当用户说『来一句』『一言』『随便说点好的』『励志一句』『分享一句话』时使用。",
    inputSchema: z.object({
      category: z
        .enum(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"])
        .optional()
        .describe(
          "类别：a=动画 b=漫画 c=游戏 d=文学 e=原创 f=网络 g=其他 h=影视 i=诗词 j=网易云 k=哲学 l=抖机灵。不传则随机。",
        ),
    }),
    execute: async ({ category }) => {
      try {
        const url = category
          ? `https://v1.hitokoto.cn/?c=${category}`
          : "https://v1.hitokoto.cn/";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          return { error: "一言服务暂时不可用" };
        }
        const data = await res.json();
        return {
          text: data.hitokoto as string,
          from: data.from as string | null,
          author: data.from_who as string | null,
        };
      } catch {
        return { error: "一言服务请求失败" };
      }
    },
  }),

  getWeather: tool({
    description:
      "查询中国某个城市的天气，包括实时天气和未来 4 天预报。当用户问『北京天气』『今天天气怎么样』『某地下雨吗』『最近天气如何』时使用。",
    inputSchema: z.object({
      city: z
        .string()
        .describe("中国城市名，如 北京 / 上海 / 杭州 / 西湖区"),
      forecast: z
        .boolean()
        .optional()
        .describe("是否需要未来几天预报，默认 false 只返回实时"),
    }),
    execute: async ({ city, forecast = false }) => {
      const key = process.env.AMAP_KEY;
      if (!key) {
        return { error: "高德 API Key 未配置" };
      }

      try {
        // 第 1 步：城市名 → adcode
        const geoRes = await fetch(
          `https://restapi.amap.com/v3/geocode/geo?key=${key}&address=${encodeURIComponent(city)}`,
          { cache: "no-store" },
        );
        const geoData = await geoRes.json();
        if (geoData.status !== "1" || !geoData.geocodes?.length) {
          return { error: `没找到「${city}」对应的城市` };
        }
        const adcode = geoData.geocodes[0].adcode as string;
        const formattedAddress = geoData.geocodes[0]
          .formatted_address as string;

        // 第 2 步：用 adcode 查天气
        const extensions = forecast ? "all" : "base";
        const wRes = await fetch(
          `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${adcode}&extensions=${extensions}`,
          { cache: "no-store" },
        );
        const wData = await wRes.json();
        if (wData.status !== "1") {
          return { error: "天气查询失败" };
        }

        if (forecast) {
          const forecastInfo = wData.forecasts?.[0];
          if (!forecastInfo) return { error: "没有预报数据" };
          return {
            city: formattedAddress,
            province: forecastInfo.province as string,
            cityName: forecastInfo.city as string,
            reportTime: forecastInfo.reporttime as string,
            forecast: (
              forecastInfo.casts as Array<Record<string, string>>
            ).map((cast) => ({
              date: cast.date,
              week: cast.week,
              dayWeather: cast.dayweather,
              nightWeather: cast.nightweather,
              dayTemp: `${cast.daytemp}°C`,
              nightTemp: `${cast.nighttemp}°C`,
              dayWind: cast.daywind,
              dayPower: cast.daypower,
            })),
          };
        }

        const live = wData.lives?.[0];
        if (!live) return { error: "没有实时数据" };
        return {
          city: formattedAddress,
          province: live.province as string,
          cityName: live.city as string,
          weather: live.weather as string,
          temperature: `${live.temperature}°C`,
          windDirection: live.winddirection as string,
          windPower: `${live.windpower} 级`,
          humidity: `${live.humidity}%`,
          reportTime: live.reporttime as string,
        };
      } catch {
        return { error: "天气服务请求失败" };
      }
    },
  }),
};
