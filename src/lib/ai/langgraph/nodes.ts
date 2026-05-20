import "server-only";

import { embedQuery } from "@/lib/ai/embed";
import { searchChunks } from "@/lib/ai/vector";
import {
  getArticles,
  getArticlesByCategorySlug,
  getCategorySummaries,
} from "@/lib/article";

import type { GraphRouteType, GraphState, RetrievedChunk } from "./state";

const STATS_PATTERNS = [
  /博客.*(整体|概况|情况|统计)/,
  /(整体|概况|情况|统计).*博客/,
  /有多少.*文章/,
  /文章.*(总数|数量|多少篇)/,
  /有哪些.*分类/,
  /分类.*(分布|数量|统计)/,
];

const LIST_PATTERNS = [
  /列出.*文章/,
  /文章.*列表/,
  /最近.*(写了|文章|发布)/,
  /有哪些.*文章/,
  /所有文章/,
];

const RECOMMEND_PATTERNS = [/推荐.*文章/, /推荐.*篇/, /值得读.*文章/];

const CATEGORY_PATTERNS = [
  /(.+?)(类|分类|类别).*有哪些.*文章/,
  /(.+?)(类|分类|类别).*文章/,
];

const READ_PATTERNS = [
  /读.*文章/,
  /查看.*文章/,
  /打开.*文章/,
  /全文/,
  /article[:：]\s*([\w-]+)/i,
  /id[:：]\s*([\w-]+)/i,
];

const HITOKOTO_PATTERNS = [/一言/, /来一句/, /分享一句/, /励志一句/];

const WEATHER_PATTERNS = [/天气/, /下雨/, /气温/, /温度/];

const DIRECT_PATTERNS = [
  /你好/,
  /^hi\b/i,
  /^hello\b/i,
];

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function getLastUserQuery(messages: GraphState["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === "user") {
      return cleanText(message.content);
    }
  }
  return "";
}

function detectRouteType(query: string): GraphRouteType {
  if (!query) return "direct";
  if (STATS_PATTERNS.some((pattern) => pattern.test(query))) return "stats";
  if (CATEGORY_PATTERNS.some((pattern) => pattern.test(query))) return "category";
  if (READ_PATTERNS.some((pattern) => pattern.test(query))) return "read";
  if (HITOKOTO_PATTERNS.some((pattern) => pattern.test(query))) return "hitokoto";
  if (WEATHER_PATTERNS.some((pattern) => pattern.test(query))) return "weather";
  if (RECOMMEND_PATTERNS.some((pattern) => pattern.test(query))) return "recommend";
  if (LIST_PATTERNS.some((pattern) => pattern.test(query))) return "list";
  if (DIRECT_PATTERNS.some((pattern) => pattern.test(query))) return "direct";
  return "rag";
}

function formatConversation(messages: GraphState["messages"]): string {
  return messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "用户" : "助手"}：${message.content}`)
    .join("\n");
}

function formatChunks(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] 标题：${chunk.title}\nURL：${chunk.url}\n片段：${chunk.text}`,
    )
    .join("\n\n");
}

function extractCategoryName(query: string): string {
  const matched = query.match(/(.+?)(?:分类|类别|类).*文章/);
  return matched?.[1]?.trim() ?? "";
}

function extractArticleTitle(query: string): string {
  const quoted = query.match(/[「《\"]([^」》\"]+)[」》\"]/);
  if (quoted?.[1]) return quoted[1].trim();

  return query
    .replace(/^(读|查看|打开|看看|讲讲)/, "")
    .replace(/(这篇|一篇)?文章(全文)?/g, "")
    .trim();
}

function extractCity(query: string): string {
  const matched = query.match(/([一-龥]{2,10})(?:天气|下雨|气温|温度)/);
  if (matched?.[1]) return matched[1];
  return "北京";
}

export async function routerNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const query = state.query || getLastUserQuery(state.messages);
  const routeType = detectRouteType(query);
  return { query, routeType };
}

export async function statsNode(): Promise<Partial<GraphState>> {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategorySummaries(),
  ]);

  const categoryText = categories.length
    ? categories
        .map((category) => `- ${category.name}：${category.count} 篇`)
        .join("\n")
    : "暂无分类数据";

  return {
    answer: `博客目前共有 ${articles.length} 篇文章。\n\n分类分布：\n${categoryText}`,
  };
}

export async function listArticlesNode(): Promise<Partial<GraphState>> {
  const articles = await getArticles();
  const items = articles.slice(0, 20).map((article, index) => {
    const tags = article.tags.length
      ? `\n   - 标签：${article.tags.join("、")}`
      : "";
    const desc = article.desc ? `\n   - 简介：${article.desc}` : "";

    return `${index + 1}. **[${article.title}](/article/${article.id})**\n   - 分类：${article.category}\n   - 发布时间：${article.date}${tags}${desc}`;
  });

  return {
    answer: items.length
      ? `博客里目前可以阅读这些文章：\n\n${items.join("\n\n")}`
      : "目前还没有文章。",
  };
}

export async function recommendArticleNode(): Promise<Partial<GraphState>> {
  const articles = await getArticles();
  const article = [...articles].sort((a, b) => b.visits - a.visits)[0];

  if (!article) {
    return { answer: "目前还没有可推荐的文章。" };
  }

  const tags = article.tags.length ? `\n- 标签：${article.tags.join("、")}` : "";

  return {
    answer: `我推荐你先读 **[${article.title}](/article/${article.id})**。\n\n这篇文章是博客里浏览量比较高的一篇，适合优先阅读。\n\n- 分类：${article.category}\n- 发布时间：${article.date}${tags}\n- 简介：${article.desc || `这是一篇 ${article.category} 分类下的文章，适合作为了解博客内容的入口。`}`,
  };
}

export async function categoryArticlesNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const categoryName = extractCategoryName(state.query);
  const categories = await getCategorySummaries();

  if (!categoryName) {
    const categoryText = categories
      .map((category) => `- ${category.name}`)
      .join("\n");

    return {
      answer: `你想看哪个分类？当前分类有：\n${categoryText || "暂无分类"}`,
    };
  }

  const category = categories.find(
    (item) => item.name.includes(categoryName) || categoryName.includes(item.name),
  );

  if (!category) {
    const categoryText = categories
      .map((item) => `- ${item.name}`)
      .join("\n");

    return {
      answer: `没有找到「${categoryName}」这个分类。当前分类有：\n${categoryText || "暂无分类"}`,
    };
  }

  const articles = await getArticlesByCategorySlug(category.slug);
  const items = articles.map(
    (article, index) =>
      `${index + 1}. [${article.title}](/article/${article.id})｜${article.date}\n   ${article.desc}`,
  );

  return {
    answer: items.length
      ? `「${category.name}」分类下的文章：\n\n${items.join("\n\n")}`
      : `「${category.name}」分类下暂时没有文章。`,
  };
}

export async function readArticleNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const title = extractArticleTitle(state.query);

  if (!title) {
    return {
      answer:
        "你可以告诉我想看的文章标题，或者先问“博客有哪些文章”让我列出可阅读的文章。",
    };
  }

  const articles = await getArticles();
  const article = articles.find((item) => item.title.includes(title) || title.includes(item.title));
  if (!article) {
    return { answer: `没有找到标题包含「${title}」的文章。你可以先问“博客有哪些文章”查看列表。` };
  }

  return {
    answer: `# ${article.title}\n\n分类：${article.category}\n日期：${article.date}\n\n${article.content.slice(0, 4000)}`,
  };
}

export async function hitokotoNode(): Promise<Partial<GraphState>> {
  try {
    const response = await fetch("https://v1.hitokoto.cn/", {
      cache: "no-store",
    });

    if (!response.ok) {
      return { answer: "一言服务暂时不可用。" };
    }

    const data = await response.json();
    const author = data.from_who ? ` · ${data.from_who}` : "";
    const from = data.from ? `《${data.from}》` : "未知出处";

    return {
      answer: `${data.hitokoto}\n\n—— ${from}${author}`,
    };
  } catch {
    return { answer: "一言服务请求失败。" };
  }
}

export async function weatherNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const key = process.env.AMAP_KEY;
  if (!key) {
    return { answer: "高德 API Key 未配置。" };
  }

  const city = extractCity(state.query);
  const forecast = /未来|最近|几天|预报/.test(state.query);

  try {
    const geoResponse = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=${key}&address=${encodeURIComponent(city)}`,
      { cache: "no-store" },
    );
    const geoData = await geoResponse.json();

    if (geoData.status !== "1" || !geoData.geocodes?.length) {
      return { answer: `没找到「${city}」对应的城市。` };
    }

    const adcode = geoData.geocodes[0].adcode as string;
    const formattedAddress = geoData.geocodes[0].formatted_address as string;
    const weatherResponse = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${adcode}&extensions=${forecast ? "all" : "base"}`,
      { cache: "no-store" },
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.status !== "1") {
      return { answer: "天气查询失败。" };
    }

    if (forecast) {
      const forecastInfo = weatherData.forecasts?.[0];
      if (!forecastInfo) return { answer: "没有预报数据。" };

      const days = (forecastInfo.casts as Array<Record<string, string>>)
        .map(
          (cast) =>
            `- ${cast.date}：白天${cast.dayweather} ${cast.daytemp}°C，夜间${cast.nightweather} ${cast.nighttemp}°C，${cast.daywind}风 ${cast.daypower} 级`,
        )
        .join("\n");

      return {
        answer: `${formattedAddress} 未来天气：\n${days}`,
      };
    }

    const live = weatherData.lives?.[0];
    if (!live) return { answer: "没有实时天气数据。" };

    return {
      answer: `${formattedAddress} 当前天气：${live.weather}，${live.temperature}°C，${live.winddirection}风 ${live.windpower} 级，湿度 ${live.humidity}%。更新时间：${live.reporttime}`,
    };
  } catch {
    return { answer: "天气服务请求失败。" };
  }
}

export async function retrieveNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  if (state.routeType !== "rag" || !state.query) {
    return { retrievedChunks: [] };
  }

  const vector = await embedQuery(state.query);
  const hits = await searchChunks(vector, 5);
  const retrievedChunks: RetrievedChunk[] = hits.map((hit) => ({
    title: hit.payload.title,
    url: hit.payload.url,
    score: hit.score,
    text: hit.payload.text,
  }));

  return { retrievedChunks };
}

export function buildGenerationInput(state: GraphState) {
  const hasContext =
    state.routeType === "rag" && state.retrievedChunks.length > 0;

  return {
    system: hasContext
      ? "你是博客 AI 助手，也可以陪用户日常聊天。用户问博客内容时，请优先依据提供的博客片段回答，回答使用中文，结论尽量具体；若片段不足以回答，说明信息不足后再给出通用建议。"
      : "你是友好自然的中文 AI 助手。你既可以陪用户日常聊天，也可以回答技术和博客相关问题。回答要简洁、有帮助；如果用户问博客内容但没有可用片段，请说明当前没有检索到相关博客内容，再基于通用知识回答。",
    prompt: hasContext
      ? `用户问题：${state.query}\n\n最近对话：\n${formatConversation(state.messages)}\n\n博客检索片段：\n${formatChunks(state.retrievedChunks)}`
      : `用户问题：${state.query}\n\n最近对话：\n${formatConversation(state.messages)}`,
  };
}

export async function fallbackNode(
  state: GraphState,
): Promise<Partial<GraphState>> {
  return {
    answer: `我在博客内容里暂时没有检索到和「${state.query}」直接相关的片段。你可以换个更具体的关键词，或者告诉我你想看的技术方向。`,
  };
}
