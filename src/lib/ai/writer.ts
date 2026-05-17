import "server-only";
import { generateText, streamText } from "ai";
import { z } from "zod";

import { getWriterModel } from "./provider";

const summarySchema = z.object({
  desc: z.string().min(10).max(120),
});

const tagsSchema = z.object({
  tags: z.array(z.string().min(1).max(16)).min(1).max(6),
});

/**
 * 把模型输出里的 JSON 抠出来。兼容三种情况：
 * 1) 直接是合法 JSON
 * 2) 用 ```json ... ``` 包裹
 * 3) 在前后混了说明文字，但 JSON 在中间
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

/**
 * 通用结构化生成：让模型输出 JSON，自己抽取 + zod 校验。
 * 比 Output.object 更稳，因为不依赖 provider 的 native JSON mode。
 */
async function generateStructured<T>(args: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  /** 失败时最多重试几次（重试时把"必须严格 JSON"提示加大） */
  maxRetries?: number;
}): Promise<T> {
  const maxRetries = args.maxRetries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const sys =
      attempt === 0
        ? args.system
        : `${args.system}\n\n严重警告：上一次输出无法被 JSON 解析。这次只输出 JSON 对象本身，不要写任何解释、不要 markdown 代码围栏、第一个字符必须是 {。`;

    const { text } = await generateText({
      model: getWriterModel(),
      system: sys,
      prompt: args.prompt,
    });

    try {
      const json = JSON.parse(extractJson(text));
      return args.schema.parse(json);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `结构化输出解析失败：${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

// ---------- 共享：博客定位 ----------

/** 全局 persona：所有写作类调用都基于这个 */
const PERSONA = `你正在为一个『面向工程师的中文技术分享博客』写内容。
博客特点：
- 主题以编程语言、前后端框架、工具链、系统设计、性能优化、踩坑记录为主
- 读者是程序员，已经懂基础概念，不需要"什么是 X""X 的发展历史"这种铺垫
- 偏爱：实战、代码、命令、错误日志、版本号、性能数字、对比、原理
- 不喜欢：营销腔、空话、"通过本文你将学到""希望对你有帮助"这种套话`;

// ---------- 摘要 ----------

/** 60-120 字摘要 */
export async function generateArticleSummary(input: {
  title: string;
  content: string;
}) {
  return generateStructured({
    schema: summarySchema,
    system: `${PERSONA}

任务：把一篇技术文章压缩成 60-120 字的摘要，用作文章列表卡片上的简介。

要求：
- 一句话讲清楚『这篇文章解决什么问题 / 给出什么方案 / 读者能学到什么具体技能』
- 出现关键技术名词（框架、工具、语言、版本）
- 不要"本文将……""通过本文……""希望……"这种套话开头
- 自然口吻，不夸张

严格按下面 JSON 输出，不要解释、不要 markdown 围栏：
{"desc": "..."}`,
    prompt: `标题：${input.title}\n\n正文：\n${input.content.slice(0, 6000)}`,
  });
}

// ---------- 标签 ----------

/** 推荐 3-5 个标签，复用已有标签库 */
export async function generateArticleTags(input: {
  title: string;
  content: string;
  existingTags: string[];
}) {
  return generateStructured({
    schema: tagsSchema,
    system: `${PERSONA}

任务：基于文章内容选 3-5 个标签。

挑选标准（按优先级）：
1. 技术名词优先：框架（Next.js / React / Vue）、语言（TypeScript / Rust）、工具（Docker / Vite）、协议（HTTP/2 / gRPC）等
2. 主题动作或领域：『性能优化』『错误处理』『状态管理』这种主题词可以放
3. 具体的库 / API：比如 'Server Actions'、'IntersectionObserver'

避免：
- 过于宽泛：『编程』『技术』『前端』（除非真没别的可标）
- 与已有标签同义但写法不同：必须复用已有标签库里的写法（大小写、连字符都要一致）

严格按下面 JSON 输出，不要解释、不要 markdown 围栏：
{"tags": ["...", "...", "..."]}`,
    prompt: `标题：${input.title}
已有标签库：${input.existingTags.join("、") || "（无）"}

正文：
${input.content.slice(0, 5000)}`,
  });
}

// ---------- 润色 ----------

/** 润色选区，流式 */
export function polishSelection(input: {
  selection: string;
  mode: "rewrite" | "shorten" | "expand" | "fix";
  contextHint?: string;
}) {
  const modeMap = {
    rewrite: "把这段技术文字改得更清晰、更有信息密度，保留所有事实和结论",
    shorten: "把这段技术文字精简到原长度的 70% 左右，去掉重复说明和冗余修饰",
    expand:
      "把这段技术文字扩写得更详细：补充原理、举例或注意事项，但不要灌水",
    fix: "修正错别字、标点、语病，但尽量不改原意、不改技术细节",
  };

  return streamText({
    model: getWriterModel(),
    system: `${PERSONA}

你现在的角色是技术编辑，正在帮作者润色一段已写好的内容。

铁律：
- 代码块（\`\`\` 围栏内）、行内代码（\`...\` 内）、命令、错误信息、URL、版本号、专有名词大小写一律保持不变
- 例如：useState 不要写成 "使用状态"；TypeScript 不要写成 "类型脚本"
- 不要解释你做了什么改动
- 不要给修改后的文本加前后引号或 markdown 围栏
- 直接输出修改后的文本本身`,
    prompt: `任务：${modeMap[input.mode]}
${input.contextHint ? `上下文：${input.contextHint}\n` : ""}
原文：
${input.selection}`,
  });
}

// ---------- 续写 ----------

/** 在光标处续写一段，流式 */
export function continueWriting(input: {
  before: string;
  approxLength?: "short" | "medium" | "long";
}) {
  const lengthMap = {
    short: "1-2 句话",
    medium: "1 个段落（3-5 句）",
    long: "2-3 个段落",
  };
  const len = lengthMap[input.approxLength ?? "medium"];

  return streamText({
    model: getWriterModel(),
    system: `${PERSONA}

任务：基于作者已写的内容，自然地续写 ${len}。

要求：
- 风格、语气、术语用法跟前文一致
- 内容上推进文章：可以补一个细节、给一个例子、解释一个原理、抛出下一个问题
- 不要重复前文已经说过的东西
- 不要写"接下来我们将"、"下面来看"这种过渡套话，直接续上去
- 涉及代码就给 \`\`\`lang ... \`\`\` 代码块，不要描述代码"差不多长这样"
- 只输出续写部分，不要标题、不要 markdown 外层围栏`,
    prompt: `已写：\n${input.before.slice(-3000)}`,
  });
}

// ---------- 整篇草稿 ----------

/** 根据标题（可选 分类/标签/摘要）从零生成整篇正文，流式 */
export function draftArticle(input: {
  title: string;
  category?: string;
  tags?: string[];
  desc?: string;
  approxLength?: "short" | "medium" | "long";
}) {
  const lengthMap = {
    short: {
      wordHint: "约 500 字",
      structureHint:
        "1 个引子（点出问题 / 场景）+ 2-3 个小节（核心方案或步骤）+ 一两句收尾",
    },
    medium: {
      wordHint: "约 1200 字",
      structureHint:
        "1 个引子（场景 / 痛点）+ 3-5 个小节（原理、做法、代码、踩坑）+ 简短收尾",
    },
    long: {
      wordHint: "约 2500 字",
      structureHint:
        "1 个引子 + 4-6 个小节（含原理拆解、代码示例、对比 / 性能数据、踩坑与解决）+ 总结",
    },
  };
  const len = lengthMap[input.approxLength ?? "medium"];

  const meta: string[] = [];
  if (input.category) meta.push(`分类：${input.category}`);
  if (input.tags && input.tags.length > 0)
    meta.push(`标签：${input.tags.join("、")}`);
  if (input.desc) meta.push(`摘要提示：${input.desc}`);

  return streamText({
    model: getWriterModel(),
    system: `${PERSONA}

任务：根据标题（和可选的分类、标签、摘要提示），写一篇 ${len.wordHint} 的完整技术分享草稿。

结构建议（不必死板套）：${len.structureHint}

写作要求：
- Markdown 格式，二级标题 \`##\`、三级 \`###\`；不要写一级 \`#\`（标题已在表单里）
- 引子直接进入主题，可以从一个具体场景、一个 bug、一段误解、一个对比切入；不要"什么是 X""X 是一种 Y"开头
- 涉及代码的地方给可运行的 \`\`\`ts / \`\`\`tsx / \`\`\`bash / \`\`\`json 代码块；不要描述"代码大致这样"
- 涉及命令、文件路径、API、版本号 → 用行内代码 \`...\`
- 涉及对比 / 步骤 / 配置项 → 用列表或表格
- 给具体例子、报错信息、版本号、性能数字这类可验证的细节，不要空话
- 必要时点出"为什么这样做"，而不是只给"怎么做"
- 标题之外不要写 SEO 关键词堆砌；不要写"通过本文你将学到""希望对你有帮助"这种结尾套话
- 直接输出 Markdown 正文，开头第一行可以是 \`##\` 小节标题或正文段落；不要外层 markdown 围栏`,
    prompt: `标题：${input.title}
${meta.join("\n")}`,
  });
}
