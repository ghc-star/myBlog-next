import { createArticle } from "./actions";

export default function NewArticlePage() {
  return (
    <form action={createArticle} className="space-y-4">
      <input name="title" placeholder="标题" required />
      <input name="desc" placeholder="摘要" required />
      <input name="category" placeholder="分类名" required />
      <input name="categorySlug" placeholder="分类 slug" required />
      <input name="tags" placeholder="React,Next.js,前端" />
      <input name="cover" placeholder="封面 URL" />
      <input name="color" placeholder="#0ea5e9" />
      <textarea name="content" placeholder="Markdown 正文" rows={20} required />
      <button type="submit">发布文章</button>
    </form>
  );
}
