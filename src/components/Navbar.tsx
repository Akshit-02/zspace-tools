"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, X, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "./Logo";
import { SearchPalette } from "./SearchPalette";
import { ToolIcon } from "./ToolIcon";
import { mainNav } from "@/lib/site";
import { categories, toolPath, toolsInCategory } from "@/lib/tools";

const desktopNav = mainNav.filter((n) => n.label !== "Blog");

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile menu on navigation (pathname is a dependency; the
  // setter only runs when it changes).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : href.includes("#") ? false : pathname.startsWith(href);

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-50 border-b transition-[background-color,border-color] duration-300",
          scrolled || menuOpen ? "border-line bg-ivory/90 backdrop-blur-md" : "border-transparent bg-ivory",
        )}
      >
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Logo />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {desktopNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={clsx(
                      "relative rounded-[10px] px-3.5 py-2 text-[0.95rem] font-medium transition-colors",
                      isActive(item.href) ? "text-charcoal" : "text-ink-2 hover:text-charcoal",
                    )}
                  >
                    {item.label}
                    {isActive(item.href) && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3.5 -bottom-[1px] h-[2px] rounded-full bg-orange"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group hidden h-10 items-center gap-2.5 rounded-[12px] border border-line bg-card pl-3 pr-2 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-charcoal sm:flex"
              aria-label="Search tools"
            >
              <Search aria-hidden className="size-4" />
              <span className="pr-6">Search tools</span>
              <kbd className="rounded-md border border-line bg-ivory px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-10 place-items-center rounded-[12px] border border-line bg-card text-charcoal sm:hidden"
              aria-label="Search tools"
            >
              <Search className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-[12px] border border-line bg-card text-charcoal md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto border-t border-line bg-ivory md:hidden"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav aria-label="Mobile" className="px-4 pb-10 pt-4">
                <ul>
                  {mainNav.map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i, duration: 0.25 }}
                      className="border-b border-line"
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between py-4 font-display text-[1.7rem] font-medium tracking-[-0.02em]"
                      >
                        {item.label}
                        <ArrowRight aria-hidden className={clsx("size-5", isActive(item.href) ? "text-orange" : "text-ink-3")} />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                {categories
                  .filter((c) => toolsInCategory(c.id).length > 0)
                  .map((c) => (
                    <div key={c.id} className="mt-7">
                      <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ink-2">{c.name}</p>
                      <ul className="grid grid-cols-2 gap-2">
                        {toolsInCategory(c.id).map((tool) => (
                          <li key={tool.slug} className="min-w-0">
                            <Link
                              href={toolPath(tool.slug)}
                              onClick={() => setMenuOpen(false)}
                              className="flex h-full items-center gap-2.5 rounded-[12px] border border-line bg-card px-3 py-2.5"
                            >
                              <ToolIcon name={tool.icon} className="size-4 shrink-0 text-orange-ink" />
                              <span className="min-w-0 text-[0.9rem] font-medium leading-tight">{tool.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
