import { redirect } from "next/navigation";

// 保留旧链接，重定向到新的后台管理入口
export default function LegacyNewArticleRedirect() {
  redirect("/admin/articles/new");
}
