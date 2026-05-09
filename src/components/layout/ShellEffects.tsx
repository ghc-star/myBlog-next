"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { usePageTitleVisibility } from "@/hooks/usePageTitleVisibility";

export default function ShellEffects() {
  usePageTitleVisibility();

  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
