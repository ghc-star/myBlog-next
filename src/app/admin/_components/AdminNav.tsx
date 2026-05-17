"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "总览", exact: true },
  { href: "/admin/articles", label: "文章管理" },
  { href: "/admin/articles/new", label: "新建文章" },
  { href: "/admin/friends", label: "友链管理" },
];

/**
 * 选出最贴合当前 pathname 的菜单项：
 * - exact 项：必须严格等于
 * - 非 exact 项：用前缀匹配，但只取"最长匹配"那一个
 *   这样 /admin/articles/new 不会同时点亮 /admin/articles 和 /admin/articles/new
 */
function pickActiveHref(
  pathname: string,
  list: Array<{ href: string; exact?: boolean }>,
): string | null {
  let bestHref: string | null = null;
  let bestLen = -1;

  for (const item of list) {
    if (item.exact) {
      if (pathname === item.href) return item.href;
      continue;
    }
    if (
      pathname === item.href ||
      pathname.startsWith(item.href + "/")
    ) {
      if (item.href.length > bestLen) {
        bestHref = item.href;
        bestLen = item.href.length;
      }
    }
  }

  return bestHref;
}

export default function AdminNav() {
  const pathname = usePathname();
  const activeHref = pickActiveHref(pathname, items);

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? "bg-(--theme-accent-soft) font-medium text-(--theme-accent)"
                : "text-(--text-sub) hover:bg-(--card-bg-soft) hover:text-(--text-title)"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
