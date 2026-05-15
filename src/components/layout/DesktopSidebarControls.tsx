"use client";

import { useEffect, useRef, useState } from "react";
import NavMenu from "../sidebar/NavMenu";
import ThemeToggle from "../sidebar/ThemeToggle";

function DesktopSidebarControls() {
  const navMenuRef = useRef<HTMLDivElement | null>(null);
  const themeToggleRef = useRef<HTMLDivElement | null>(null);
  const [hideThemeToggle, setHideThemeToggle] = useState(false);
  useEffect(() => {
    const minGap = 24;
    let frameId = 0;

    const updateVisibility = () => {
      if (window.innerWidth < 648) {
        setHideThemeToggle(false);
        return;
      }

      const navMenuElement = navMenuRef.current;
      const themeToggleElement = themeToggleRef.current;
      if (!navMenuElement || !themeToggleElement) {
        return;
      }
      const navMenuRect = navMenuElement.getBoundingClientRect();
      const themeToggleRect = themeToggleElement.getBoundingClientRect();
      setHideThemeToggle(themeToggleRect.top - navMenuRect.bottom <= minGap);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateVisibility);
    };

    scheduleUpdate();
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (navMenuRef.current) {
      resizeObserver.observe(navMenuRef.current);
    }
    if (themeToggleRef.current) {
      resizeObserver.observe(themeToggleRef.current);
    }
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);
  return (
    <>
      <div ref={navMenuRef}>
        <NavMenu />
      </div>

      <div
        ref={themeToggleRef}
        className={`absolute bottom-6 left-4 right-4 flex items-center justify-between transition-opacity duration-200 ${
          hideThemeToggle ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ThemeToggle />
      </div>
    </>
  );
}
export default DesktopSidebarControls;
