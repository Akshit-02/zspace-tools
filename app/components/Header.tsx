"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Zap,
  Calculator,
  FileText,
  BarChart2,
  Search,
} from "lucide-react";

const navCategories = [
  {
    label: "Finance & Tax",
    icon: Calculator,
    color: "text-violet-500",
    bg: "bg-violet-50",
    tools: [
      {
        name: "GST Calculator",
        href: "/tools/gst-calculator",
        badge: "Popular",
      },
      { name: "Income Tax Calculator", href: "/tools/income-tax-calculator" },
      { name: "EMI Calculator", href: "/tools/emi-calculator" },
      { name: "Compound Interest", href: "/tools/compound-interest" },
    ],
  },
  {
    label: "Business",
    icon: BarChart2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    tools: [
      { name: "Invoice Generator", href: "/tools/invoice-generator" },
      { name: "Profit Margin", href: "/tools/profit-margin" },
      { name: "Break-even Calculator", href: "/tools/break-even" },
      { name: "ROI Calculator", href: "/tools/roi-calculator" },
    ],
  },
  {
    label: "Utility",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-50",
    tools: [
      { name: "Word Counter", href: "/tools/word-counter" },
      { name: "Unit Converter", href: "/tools/unit-converter" },
      { name: "Percentage Calculator", href: "/tools/percentage-calculator" },
      { name: "Age Calculator", href: "/tools/age-calculator" },
    ],
  },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
              aria-label="ZSpace Tools home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zest-400 to-zest-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="leading-none">
                <span className="font-display font-extrabold text-lg text-ink-800 tracking-tight">
                  ZSpace
                </span>
                <span className="font-display font-medium text-lg text-zest-500 tracking-tight">
                  {" "}
                  Tools
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav
              className="hidden lg:flex items-center gap-1"
              role="navigation"
              aria-label="Main navigation"
            >
              {navCategories.map((cat) => (
                <div
                  key={cat.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(cat.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium
                      transition-all duration-150 ${
                        activeDropdown === cat.label
                          ? "bg-gray-100 text-ink-800"
                          : "text-ink-600 hover:bg-gray-50 hover:text-ink-800"
                      }`}
                    aria-haspopup="true"
                    aria-expanded={activeDropdown === cat.label}
                  >
                    {cat.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === cat.label ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {activeDropdown === cat.label && (
                    <div className="absolute top-full left-0 pt-2 w-56 animate-fade-in z-50">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-card-hover p-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cat.bg} mb-1`}
                        >
                          <cat.icon className={`w-4 h-4 ${cat.color}`} />
                          <span
                            className={`text-xs font-display font-semibold uppercase tracking-wider ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                        </div>
                        {cat.tools.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-ink-600 hover:bg-gray-50 hover:text-ink-800 transition-colors group"
                          >
                            <span>{tool.name}</span>
                            {tool.badge && (
                              <span className="text-[10px] font-display font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zest-500/10 text-zest-500">
                                {tool.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                        <Link
                          href={`/tools?category=${cat.label.toLowerCase().replace(" & ", "-")}`}
                          className="flex items-center gap-1 px-3 py-2 mt-1 text-xs text-zest-500 font-medium hover:underline"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/tools"
                className="px-4 py-2 rounded-lg text-sm font-body font-medium text-ink-600 hover:bg-gray-50 hover:text-ink-800 transition-colors"
              >
                All Tools
              </Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                aria-label="Search tools"
                className="p-2 rounded-lg text-ink-500 hover:bg-gray-100 hover:text-ink-800 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              <Link href="/tools" className="btn-primary text-sm">
                Explore Tools
                <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-ink-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-white overflow-y-auto pt-20 pb-8 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="space-y-1 mb-6">
            <Link
              href="/tools"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl font-display font-semibold text-ink-800 bg-gray-50"
            >
              All Tools
            </Link>
          </div>

          {navCategories.map((cat) => (
            <div key={cat.label} className="mb-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${cat.bg} mb-1`}
              >
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                <span
                  className={`text-xs font-display font-bold uppercase tracking-wider ${cat.color}`}
                >
                  {cat.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {cat.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-ink-600 hover:bg-gray-50"
                  >
                    <span>{tool.name}</span>
                    {tool.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zest-500/10 text-zest-500">
                        {tool.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/tools"
              onClick={() => setMobileOpen(false)}
              className="btn-primary w-full justify-center"
            >
              Explore All Tools →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
