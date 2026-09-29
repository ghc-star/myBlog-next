# myBlog-next 项目规则（skills）
# 机器人的"项目常识"：技术栈、结构约定、渲染与数据红线。审查质量取决于这份文件写得多具体。

## 项目与技术栈

- Next.js 16.2.6（App Router + Turbopack）+ React 19 + TypeScript + Tailwind CSS v4 + mysql2（TiDB Cloud Serverless，强制 TLS）+ Qdrant（向量检索）+ LangChain/AI SDK。
- 部署在 Vercel；数据库环境变量 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME 由 Vercel 配置，本地 .env 指向 localhost 的 MySQL。
- 包管理用 npm；验收命令：`npm run lint`（eslint）→ `npm run build`（tsc 类型检查 + next build，构建期会连数据库预渲染内容页），改动必须能通过。
- AGENTS.md 约定：该 Next.js 版本与训练数据可能不同，写 Next 相关代码前先查 node_modules/next/dist/docs/ 内置文档，留意弃用通知。

## 目录结构

- `src/app/`：路由。`page.tsx`（文章列表，?page= 分页）、`article/[id]`、`archive`、`category/[slug]`、`essay`、`friends`、`about`、`search`、`admin/**`（后台）、`api/**`（接口）。
- `src/lib/`：数据访问与服务。`db.ts`（mysql2 连接池单例）、`article.ts`、`admin.ts`（requireAdmin）、`ai/`（向量索引）。带 "server-only" 的模块不得被客户端组件导入。
- `src/components/`：`layout/`（AppShell、导航）、`article/`、`ai/` 等；客户端组件文件顶部有 "use client"。
- `scripts/`：`complete-schema.sql`（全部建表语句）、`init-complete-db.ts`（重建库）、`seed-*.ts`（示例数据）。
- 后台 Server Action 在 `src/app/admin/**/_actions.ts`。

## 渲染与缓存约定（核心）

- 内容页是 SSG + ISR：`export const revalidate = 60`，动态路由配合 generateStaticParams 构建期全量预渲染；不要把内容页改成 force-dynamic 或每请求查库。
- 首页因 ?page= 分页（searchParams）按请求渲染；admin/** 与 api/** 用 force-dynamic。
- Server Action 增删改数据后必须 revalidatePath 对应展示路径（/、/about、/archive、/category/<slug>、/article/<id>、/admin 相关），否则静态页不更新。
- 构建期会真实连库预渲染：不要在内容页引入构建期不可用的依赖（本地 dev 环境变量、请求时的 cookies/headers 等）。

## 数据库约定

- 连接只通过 `src/lib/db.ts` 的连接池单例（global.__mysqlPool 复用）；非本地 host 必须带 `ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true }`，去掉会导致 TiDB Cloud 拒绝连接。
- 查询一律参数化（? 占位符传值），禁止拼接 SQL；INSERT/UPDATE 列名注意反引号（`desc`、`date` 是保留字）。
- 主要表：articles（id 是 varchar slug 主键，tags 存 JSON 字符串）、comments、comment_likes、article_likes、article_reactions、article_views、essays、essay_likes、essay_comments、friends、users（GitHub OAuth）、sessions、site_views、ai_chat_messages、ai_user_memories。
- 计数（visits、comments）冗余在 articles 上，写入时注意同事务或保持一致。

## 安全与契约

- admin 页面与 Server Action 必须先 `requireAdmin()`（基于 GitHub OAuth + users.role）；未登录/非管理员要正确拒绝。
- 评论、点赞、浏览等公开写入按 IP 去重（唯一索引兜底），入参要校验长度与格式。
- 密码、token、AI_REVIEW_API_KEY、DB_PASSWORD 等只能放环境变量，不得写进代码、日志、响应或提交 .env。
- 渲染用户内容用 react-markdown；不得用 dangerouslySetInnerHTML 直接注入未消毒的 HTML。

## 高风险区域（涉及即提高警惕）

`src/lib/db.ts`、`src/lib/**`、`src/app/api/**`、`src/app/admin/**/_actions.ts`、`src/app/layout.tsx`、`next.config.ts`、`instrumentation.ts`、`scripts/complete-schema.sql`、`.github/workflows/`。
