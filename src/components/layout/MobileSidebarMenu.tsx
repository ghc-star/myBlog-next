"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import NavMenu from "../sidebar/NavMenu";
import ThemeToggle from "../sidebar/ThemeToggle";

function MobileSidebarMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg -translate-y-6"
      >
        <Menu size={24} />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 sm:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full w-64 bg-[var(--card-bg)] p-6 shadow-2xl transition-all duration-300 ease-out sm:hidden ${
          mobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <X size={22} />
          </button>
        </div>

        <NavMenu onItemClick={() => setMobileMenuOpen(false)} />

        <div className="mt-6 -translate-x-5">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export default MobileSidebarMenu;
