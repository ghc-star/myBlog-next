import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | My Blog`;

    return () => {
      document.title = "My Blog";
    };
  }, [title]);
}
