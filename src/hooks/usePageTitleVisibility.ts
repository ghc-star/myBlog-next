import { useEffect } from "react";

export function usePageTitleVisibility() {
  useEffect(() => {
    const originTitle = document.title;
    let timer: number | undefined;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "先休息一下，等你回来";
        return;
      }

      document.title = "欢迎回来";
      timer = window.setTimeout(() => {
        document.title = originTitle;
      }, 1500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);
}
