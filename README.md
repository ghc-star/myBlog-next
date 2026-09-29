This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI 代码审查

本仓库配置了 AI 审查机器人（`.github/workflows/ai-review.yml`）：

- **触发**：PR 创建、推送新提交、重新打开时自动审查；也可在 Actions 页面用 `workflow_dispatch` 手动触发（可勾选 `mock` 演示模式）。
- **流程**：拉取 PR diff → 组装 `.github/ai-review/prompt.md`（评审任务书）与 `skills.md`（项目规则）→ 调用 OpenAI 兼容接口（当前为 timicc.com 中转的 grok-4.6）→ 结果发成 PR 评论，同一 PR 反复推送只更新同一条评论。
- **凭据**：模型 API key 存放在仓库 Secret `AI_REVIEW_API_KEY`，不在任何代码文件里。
- **注意**：直接 push 到 main 不会触发审查，改动请走 PR 流程。
