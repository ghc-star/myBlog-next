"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { usePageTitleVisibility } from "@/hooks/usePageTitleVisibility";

export default function ShellEffects() {
  usePageTitleVisibility();

  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
