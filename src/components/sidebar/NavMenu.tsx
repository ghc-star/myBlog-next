"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BookOpenText,
  House,
  Link2,
  Search,
  UserRound,
} from "lucide-react";

const navItems = [
  { name: "首页", path: "/", icon: House },
  { name: "关于", path: "/about", icon: UserRound },
  { name: "归档", path: "/archive", icon: Archive },
  { name: "搜索", path: "/search", icon: Search },
  { name: "随笔", path: "/essay", icon: BookOpenText },
  { name: "友链", path: "/friends", icon: Link2 },
];

function NavMenu({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-full px-0 py-4 sm:w-[220px] sm:px-6 sm:py-8">
      <ul className="flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <li key={item.path}>
              <Link
                href={item.path}
                onClick={onItemClick}
                className={`flex items-center gap-3 text-sm transition-colors sm:gap-6 sm:text-[16px] transition-all duration-300 ${
                  active
                    ? "font-semibold text-[var(--text-strong)]"
                    : "text-[var(--text-sub)] hover:text-[var(--text-title)]"
                }`}
              >
                <Icon size={20} strokeWidth={1.6} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default NavMenu;
