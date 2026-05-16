import Link from "next/link";
import {
  Zap,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";

const footerLinks = {
  "Finance & Tax": [
    { name: "GST Calculator", href: "/tools/gst-calculator" },
    { name: "Income Tax Calculator", href: "/tools/income-tax-calculator" },
    { name: "EMI Calculator", href: "/tools/emi-calculator" },
    { name: "Compound Interest", href: "/tools/compound-interest" },
    { name: "HRA Calculator", href: "/tools/hra-calculator" },
  ],
  Business: [
    { name: "Invoice Generator", href: "/tools/invoice-generator" },
    { name: "Profit Margin", href: "/tools/profit-margin" },
    { name: "Break-even Calc", href: "/tools/break-even" },
    { name: "ROI Calculator", href: "/tools/roi-calculator" },
    { name: "Markup Calculator", href: "/tools/markup-calculator" },
  ],
  Utility: [
    { name: "Word Counter", href: "/tools/word-counter" },
    { name: "Unit Converter", href: "/tools/unit-converter" },
    { name: "Percentage Calc", href: "/tools/percentage-calculator" },
    { name: "Age Calculator", href: "/tools/age-calculator" },
    { name: "BMI Calculator", href: "/tools/bmi-calculator" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "All Tools", href: "/tools" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
    { name: "Sitemap", href: "/sitemap.xml" },
  ],
};

const trustBadges = [
  { icon: Shield, label: "100% Free", sub: "Always" },
  { icon: Zap, label: "No Sign-up", sub: "Required" },
  { icon: Sparkles, label: "Privacy First", sub: "No tracking" },
];

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white" role="contentinfo">
      {/* Trust bar */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <b.icon className="w-4 h-4 text-glow" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-white leading-none">
                    {b.label}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 lg:pr-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 mb-4"
              aria-label="ZSpace Tools home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zest-400 to-zest-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="leading-none">
                <span className="font-display font-extrabold text-lg text-white tracking-tight">
                  ZSpace
                </span>
                <span className="font-display font-medium text-lg text-zest-400 tracking-tight">
                  {" "}
                  Tools
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-5 max-w-xs">
              Free, accurate, and instant online calculators and tools — built
              for India&apos;s growing business community.
            </p>
            <div className="flex items-center gap-3">
              {[
                {
                  Icon: Twitter,
                  href: "https://twitter.com/zspace_in",
                  label: "Twitter",
                },
                {
                  Icon: Linkedin,
                  href: "https://linkedin.com/company/zspace",
                  label: "LinkedIn",
                },
                {
                  Icon: Github,
                  href: "https://github.com/zspace",
                  label: "GitHub",
                },
                { Icon: Mail, href: "mailto:hello@zspace.in", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white/30 mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>
              © {new Date().getFullYear()} ZSpace Tools. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-white/60 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white/60 transition-colors"
              >
                Terms of Use
              </Link>
              <Link
                href="/disclaimer"
                className="hover:text-white/60 transition-colors"
              >
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
