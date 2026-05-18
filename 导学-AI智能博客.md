# 导学-AI智能博客

## 1. 前置知识（面试高频标注）

| 知识点 | 为何需要 | 在本项目中的位置 | 高频度 |
|---|---|---|---|
| Next.js App Router | 面试会重点考察页面路由、服务端组件、Route Handler 和数据获取边界 | `src/app/page.tsx`、`src/app/api/chat/route.ts`、`src/app/article/[id]/page.tsx` | 高 |
| React 19 服务端/客户端组件拆分 | 解释为什么列表、布局可服务端渲染，而交互抽屉、聊天输入必须客户端渲染 | `src/app/page.tsx`、`src/components/ai/AiChat.tsx`、`src/components/ai/AiDrawer.tsx` | 高 |
| AI SDK 流式对话 | 支撑 AI 助手的流式响应、工具调用和前端消息状态管理 | `src/app/api/chat/route.ts`、`src/components/ai/AiChat.tsx` | 高 |
| RAG 检索增强生成 | 项目 AI 亮点核心：先检索博客文章片段，再让模型基于上下文回答 | `src/lib/ai/tools.ts`、`src/lib/ai/embed.ts`、`src/lib/ai/vector.ts`、`scripts/index-all-articles.ts` | 高 |
| 向量数据库 Qdrant | 存储文章 chunk 的 embedding，并按语义相似度召回内容 | `src/lib/ai/vector.ts`、`scripts/index-all-articles.ts` | 高 |
| Markdown 分块策略 | 影响召回粒度、上下文质量和回答准确率 | `src/lib/ai/chunk.ts`、`scripts/index-all-articles.ts` | 中 |
| TypeScript 与 Zod Schema | 保证 API、工具参数、返回结构更可维护 | `src/lib/ai/tools.ts`、`src/app/api/chat/route.ts` | 高 |
| Tailwind CSS 与响应式布局 | 支撑博客首页、侧边栏、AI 抽屉的快速样式组织 | `src/components/layout/MainLayout.tsx`、`src/components/ai/AiDrawer.tsx`、`src/components/ai/AiChat.tsx` | 中 |
| Framer Motion / 交互动效 | 用于强化评论、抽屉或页面交互体验，可作为前端体验亮点 | `src/app/article/[id]/comments/motion.ts`、`src/components/ai/AiDrawer.tsx` | 中 |
| MySQL 数据建模 | 文章、评论、浏览量、友链等内容系统的数据来源 | `src/lib/db.ts`、`src/lib/article.ts`、`src/app/api/comments/route.ts` | 中 |

## 2. 重点亮点与学习顺序（先看这个）

| 亮点标题 | 为什么重要 | 先看哪些文件（相对路径） | 建议学习顺序 |
|---|---|---|---|
| App Router 下的博客主链路 | 能体现你对 Next.js 16 页面、服务端数据获取和组件边界的理解 | `src/app/page.tsx`、`src/components/article/ArticleList.tsx`、`src/lib/article.ts` | 先看首页如何拉文章，再看列表组件如何展示，最后看数据层 |
| AI 助手端到端链路 | 这是项目区别于普通博客的核心亮点，面试官大概率追问 | `src/components/ai/AiChat.tsx`、`src/app/api/chat/route.ts`、`src/lib/ai/tools.ts` | 先看前端 useChat，再看 Route Handler，最后看工具注册 |
| RAG 检索与向量库 | 能说明你不是只接了一个大模型接口，而是做了知识库检索 | `src/lib/ai/embed.ts`、`src/lib/ai/vector.ts`、`scripts/index-all-articles.ts` | 先看离线索引，再看在线 query embedding，最后看 Qdrant search |
| Markdown 分块与召回质量 | 这是 RAG 效果好坏的工程关键点，适合回答“你怎么优化 AI 准确性” | `src/lib/ai/chunk.ts`、`scripts/index-all-articles.ts` | 先理解按 H2/H3 分块，再理解长段落拆分，再思考 topK 与 chunk 大小权衡 |
| 客户端交互体验 | 展示前端能力：流式消息、抽屉状态、滚动到底部、快捷问题 | `src/components/ai/AiChat.tsx`、`src/components/ai/AiDrawer.tsx`、`src/components/ai/useAiDrawer.ts` | 先看状态来源，再看消息渲染，再看移动端/桌面端交互 |
| 内容系统与互动 API | 说明博客不只是静态页面，还包含文章、评论、点赞、浏览量等完整产品形态 | `src/app/api/comments/route.ts`、`src/app/api/article-likes/route.ts`、`src/app/api/site-views/route.ts` | 先看文章详情，再看评论接口，再看点赞和访问统计 |

## 3. 必备知识点

- 能说清楚 App Router 中 `page.tsx`、`layout.tsx`、`route.ts` 的职责差异。
- 能解释服务端组件适合做数据获取和首屏渲染，客户端组件适合做输入、状态、动画和浏览器 API。
- 能画出 AI 助手链路：用户输入 → `useChat` → `/api/chat` → `streamText` → tool calling → RAG 检索 → 流式返回。
- 能解释 RAG 的三个阶段：离线切分建索引、在线向量化检索、基于召回片段生成答案。
- 能说明 Qdrant 中 point 的组成：id、vector、payload，以及 payload 如何保存文章标题、URL、片段文本。
- 能解释为什么要做 Markdown chunk，而不是整篇文章直接 embedding。
- 能说出 `zod` 在 AI tool 入参校验中的作用。
- 能说明 Tailwind CSS 在组件样式、主题变量和响应式布局中的使用方式。
- 能说明流式回复对用户体验的价值，以及前端如何处理 loading、error、滚动到底部。
- 能准备一套“如何验证 AI 回答准确性”的测试方案，而不是只说“效果不错”。

## 4. 推荐阅读（结合仓库）

| 主题 | 建议阅读位置 | 预计时间 | 读完能回答什么 |
|---|---|---:|---|
| 首页与服务端组件 | `src/app/page.tsx`、`src/components/article/ArticleList.tsx` | 20 分钟 | 为什么首页适合在服务端获取文章，分页参数如何处理 |
| 文章数据层 | `src/lib/article.ts`、`src/lib/db.ts` | 30 分钟 | 文章列表、分类、详情从哪里来，数据结构怎么映射到页面 |
| AI 聊天前端 | `src/components/ai/AiChat.tsx` | 30 分钟 | `useChat` 如何管理消息、提交、流式状态和错误展示 |
| AI 抽屉交互 | `src/components/ai/AiDrawer.tsx`、`src/components/ai/useAiDrawer.ts` | 15 分钟 | 为什么 AI 助手用抽屉承载，如何处理打开关闭和遮罩 |
| Chat Route Handler | `src/app/api/chat/route.ts` | 25 分钟 | 服务端如何接收消息、设置 system prompt、注册 tools、流式返回 |
| AI 工具调用 | `src/lib/ai/tools.ts` | 45 分钟 | `getBlogStats`、`listArticles`、`searchBlog` 等工具分别解决什么问题 |
| Embedding 封装 | `src/lib/ai/embed.ts` | 15 分钟 | 查询文本如何变成向量，模型和维度由哪些环境变量控制 |
| Qdrant 向量检索 | `src/lib/ai/vector.ts` | 35 分钟 | 集合如何创建、point 如何写入、向量如何搜索、payload 如何返回 |
| 离线索引脚本 | `scripts/index-all-articles.ts` | 40 分钟 | 如何从 MySQL 拉文章、分块、批量 embedding、写入 Qdrant |
| Markdown 分块 | `src/lib/ai/chunk.ts` | 20 分钟 | 为什么按 H2/H3 和长度切分，chunk 大小对召回有什么影响 |
| 评论与互动接口 | `src/app/api/comments/route.ts`、`src/app/api/article-likes/route.ts`、`src/app/api/comment-likes/route.ts` | 40 分钟 | 博客的互动能力如何通过 Route Handler 暴露 |
| 主题与布局 | `src/store/useThemeStore.ts`、`src/components/layout/MainLayout.tsx`、`src/components/layout/RightSidebar.tsx` | 25 分钟 | 前端状态、主题持久化和布局组织如何结合 |

## 5. 自学提醒（固定短段落）

如果上面某个文件、某段实现或某个原理看不懂，请继续追问 AI，让 AI 针对具体文件和代码逐段解释。本 skill 负责给你学习路径、面试题和表达框架，不提供逐行讲解；真正准备面试时，建议你沿着推荐阅读路径自己跑一遍链路，再把不懂的点单独拿出来问。

## 6. 项目技术定位

**交叉项目，主定位前端。** 依据是项目使用 Next.js App Router、React 19、Tailwind CSS 和 Framer Motion 构建博客体验，同时引入 AI SDK、Embedding 与 Qdrant 做文章 RAG 检索，因此面试中应以前端工程化和交互体验为主线，用 AI/RAG 作为差异化亮点。

## 7. 核心原理解析

### 7.1 页面渲染：为什么混用服务端组件和客户端组件

- **问题**：博客首页、文章详情需要 SEO、首屏速度和稳定数据，而 AI 聊天、主题切换、抽屉开关需要浏览器状态和用户交互。
- **机制**：App Router 默认支持服务端组件，适合直接在服务端读取数据；需要 `useState`、`useEffect`、事件处理的组件使用 `"use client"`。
- **在本项目中的落点**：`src/app/page.tsx` 负责服务端获取文章并分页，`src/components/ai/AiChat.tsx` 和 `src/components/ai/AiDrawer.tsx` 负责客户端聊天输入、流式状态、滚动和抽屉交互。

### 7.2 AI 聊天：为什么不用普通 REST 一次性返回

- **问题**：AI 回复可能较长，如果等待完整生成再返回，用户会感觉卡顿，也难以展示模型正在思考。
- **机制**：服务端用 `streamText` 生成流式结果，再通过 `createUIMessageStreamResponse` 返回给前端；前端用 `useChat` 管理消息状态。
- **在本项目中的落点**：`src/app/api/chat/route.ts` 创建流式响应，`src/components/ai/AiChat.tsx` 根据 `status === "streaming" || status === "submitted"` 展示“思考中”和禁用重复提交。

### 7.3 RAG：为什么要先检索文章再回答

- **问题**：博客 AI 助手如果只依赖大模型通用知识，就容易编造项目文章内容，无法准确回答“博客里有没有讲某个主题”。
- **机制**：先把文章内容切成 chunk 并写入向量库；用户提问时把 query embedding 后在 Qdrant 中按相似度召回片段，再把片段交给模型组织回答。
- **在本项目中的落点**：`scripts/index-all-articles.ts` 负责离线建索引，`src/lib/ai/tools.ts` 中的 `searchBlog` 负责在线语义检索，`src/lib/ai/vector.ts` 封装 Qdrant search。

### 7.4 工具调用：为什么把博客能力拆成多个 tool

- **问题**：用户问题类型不同，有的问统计、有的问文章列表、有的问具体技术内容，如果全部走向量检索会浪费成本且结果不稳定。
- **机制**：通过 AI SDK tool calling，把确定性查询和语义检索拆开，模型根据 system prompt 选择合适工具。
- **在本项目中的落点**：`src/lib/ai/tools.ts` 提供 `getBlogStats`、`listArticles`、`getArticlesByCategory`、`readArticle`、`searchBlog`、`getHitokoto`、`getWeather`，`src/app/api/chat/route.ts` 统一注册给 `streamText`。

### 7.5 向量点设计：为什么 payload 要保存标题、URL 和片段

- **问题**：向量检索只返回相似度和向量命中，如果没有可读 payload，模型和前端无法知道命中内容来自哪篇文章。
- **机制**：每个 point 保存稳定 id、embedding vector 和 payload；payload 带上 sourceType、sourceId、title、chunkIndex、text、url。
- **在本项目中的落点**：`src/lib/ai/vector.ts` 定义 `ChunkPayload`，`scripts/index-all-articles.ts` 写入 `title`、`text`、`url`，`searchBlog` 将命中的标题、URL、score 和文本返回给模型。

### 7.6 分块策略：为什么按标题和长度切

- **问题**：整篇文章过长会导致 embedding 表达不聚焦，过小又会丢上下文，都会影响召回质量。
- **机制**：优先按 H2/H3 标题切出语义完整的章节，再对过长内容按段落和长度拆分。
- **在本项目中的落点**：`src/lib/ai/chunk.ts` 的 `chunkMarkdown` 按 `##`、`###` 切分，并通过 `splitByLength` 处理长段落；索引脚本 `scripts/index-all-articles.ts` 中也有对应的分块逻辑。

## 8. 关键设计决策

| 决策点 | 备选 | 取舍 | 风险 | 验证 |
|---|---|---|---|---|
| 页面渲染方式 | 全客户端渲染 / 全服务端渲染 / 服务端与客户端混合 | 采用混合模式，文章列表等读数据链路放服务端，AI 聊天等交互放客户端 | 组件边界不清会导致客户端包变大或服务端代码误进浏览器 | 检查 `"use client"` 使用范围，跑构建并观察首屏和交互是否正常 |
| AI 回复方式 | 一次性 JSON 返回 / 流式响应 | 选择流式响应，改善等待体验 | 流式状态、错误处理和中断恢复更复杂 | 用长问题测试是否边生成边展示，观察 loading 和重复提交限制 |
| 博客问答实现 | 只调 LLM / 关键词搜索 / RAG | 选择 RAG，兼顾语义理解和博客内容可信度 | 向量召回不准会导致回答偏题 | 准备 20 个文章相关问题，对比命中文章和回答准确性 |
| 向量库选择 | MySQL LIKE / 本地 JSON / Qdrant | 选择 Qdrant，支持向量相似度和 payload 检索 | 多一个外部服务，部署和运维成本增加 | 检查集合状态、points 数量、topK 命中分布和响应耗时 |
| Chunk 粒度 | 整篇文章 / 固定长度 / 按标题+长度 | 选择按标题优先，兼顾语义完整和长度可控 | 标题结构不规范的文章可能切分不理想 | 抽样查看 chunk 文本，统计平均长度和召回片段可读性 |
| 工具拆分 | 一个万能工具 / 多个场景工具 | 多工具拆分，让统计、列表、阅读、搜索各自明确 | tool 描述不清可能导致模型选错工具 | 用典型问题测试工具选择，如“有多少文章”“讲讲某篇文章” |
| 前端承载形式 | 独立 AI 页面 / 底部输入框 / 右侧抽屉 | 选择右侧抽屉，不打断博客阅读上下文 | 小屏遮挡内容，需要移动端适配 | 在桌面和移动端分别测试打开、关闭、输入、滚动 |

## 9. 量化与验证（含待测，建议）

| 验证方向 | 指标 | 怎么测 | 当前数据 |
|---|---|---|---|
| RAG 召回准确率 | TopK 命中文章准确率、命中片段可用率 | 准备 20～30 个来自真实文章的问题，记录 `searchBlog` 返回的标题、score、片段是否能支撑答案；按“完全相关/部分相关/无关”打标 | （待测） |
| AI 回答可信度 | 编造率、引用文章标题覆盖率 | 对每个问题要求回答中附文章标题，人工检查回答是否只使用工具返回内容；重点测试冷门文章和相似主题文章 | （待测） |
| 聊天接口响应体验 | 首 token 时间、完整响应耗时、错误率 | 在浏览器 Network 或服务端日志记录 `/api/chat` 的 TTFB、总耗时；分别测试普通问答、RAG 搜索、天气工具 | （待测） |
| 向量库规模 | points 数量、indexed vectors 数量、集合状态 | 调用 `getCollectionStats` 或 Qdrant 控制台，记录索引后 points 数与文章 chunk 数是否一致 | （待测） |
| Chunk 策略效果 | 平均 chunk 长度、过短/过长比例、召回可读性 | 跑索引脚本时输出每篇文章 chunk 数和长度分布，抽样检查 H2/H3 切分是否保留完整语义 | （待测） |
| 前端交互稳定性 | 重复提交拦截、自动滚动、错误展示、移动端遮挡 | 手动测试空输入、连续回车、长回答、接口报错、小屏打开抽屉；结合 Playwright 可补自动化回归 | （待测） |
| 首屏与包体 | LCP、JS bundle、Hydration 成本 | 使用 Lighthouse / Next build 分析首页与文章页；对比 AI 组件是否只在客户端必要范围内加载 | （待测） |
| 数据接口正确性 | 评论、点赞、浏览量接口成功率 | 用浏览器和接口工具测试新增评论、点赞、刷新浏览量；检查 MySQL 数据是否符合预期 | （待测） |
