"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "总览", exact: true },
  { href: "/admin/articles", label: "文章管理" },
  { href: "/admin/articles/new", label: "新建文章" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
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
