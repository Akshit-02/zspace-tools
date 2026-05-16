import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  FileText,
  BarChart2,
  TrendingUp,
  Percent,
  IndianRupee,
  Clock,
  Users,
  Star,
  ArrowRight,
  Zap,
  ChevronRight,
  Receipt,
  PiggyBank,
  Briefcase,
  Hash,
  Scale,
  Activity,
} from "lucide-react";
import ToolCard from "./components/ToolCard";

export const metadata: Metadata = {
  title: "ZSpace Tools — Free Online Calculators & Tools for Indian Businesses",
  description:
    "Instantly calculate GST, income tax, EMI, profit margins, and more. 100% free, no sign-up required. Built for Indian businesses and professionals.",
  alternates: { canonical: "https://tools.zspace.in" },
};

const featuredTools = [
  {
    name: "GST Calculator",
    description:
      "Calculate GST inclusive and exclusive amounts across all slabs — 5%, 12%, 18%, and 28%.",
    href: "/tools/gst-calculator",
    icon: Receipt,
    popular: true,
    accentColor: "text-violet-500 bg-violet-50",
  },
  {
    name: "Income Tax Calculator",
    description:
      "Estimate your annual income tax liability under old and new tax regimes for FY 2024-25.",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
    badge: "FY 2024-25",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    accentColor: "text-emerald-500 bg-emerald-50",
  },
  {
    name: "EMI Calculator",
    description:
      "Calculate your monthly EMI for home, car, or personal loans with an amortisation schedule.",
    href: "/tools/emi-calculator",
    icon: Calculator,
    accentColor: "text-blue-500 bg-blue-50",
  },
  {
    name: "Compound Interest",
    description:
      "Calculate the power of compounding on your investments with monthly/quarterly/annual frequencies.",
    href: "/tools/compound-interest",
    icon: TrendingUp,
    accentColor: "text-rose-500 bg-rose-50",
  },
  {
    name: "Profit Margin",
    description:
      "Calculate gross, operating, and net profit margins. Know your real business profitability.",
    href: "/tools/profit-margin",
    icon: BarChart2,
    accentColor: "text-orange-500 bg-orange-50",
  },
  {
    name: "Percentage Calculator",
    description:
      "Solve all percentage problems — increase, decrease, of, from, and comparison.",
    href: "/tools/percentage-calculator",
    icon: Percent,
    accentColor: "text-pink-500 bg-pink-50",
  },
];

const allCategories = [
  {
    label: "Finance & Tax",
    icon: IndianRupee,
    count: 12,
    href: "/tools?cat=finance",
    color: "from-violet-500 to-purple-600",
  },
  {
    label: "Business",
    icon: Briefcase,
    count: 8,
    href: "/tools?cat=business",
    color: "from-emerald-500 to-teal-600",
  },
  {
    label: "Loan & EMI",
    icon: PiggyBank,
    count: 5,
    href: "/tools?cat=loan",
    color: "from-blue-500 to-cyan-600",
  },
  {
    label: "Payroll & HR",
    icon: Users,
    count: 7,
    href: "/tools?cat=payroll",
    color: "from-rose-500 to-pink-600",
  },
  {
    label: "Utility",
    icon: Scale,
    count: 10,
    href: "/tools?cat=utility",
    color: "from-amber-500 to-orange-600",
  },
  {
    label: "Health",
    icon: Activity,
    count: 4,
    href: "/tools?cat=health",
    color: "from-lime-500 to-green-600",
  },
  {
    label: "Number Tools",
    icon: Hash,
    count: 6,
    href: "/tools?cat=numbers",
    color: "from-sky-500 to-indigo-600",
  },
  {
    label: "Text Tools",
    icon: FileText,
    count: 5,
    href: "/tools?cat=text",
    color: "from-fuchsia-500 to-purple-600",
  },
];

const stats = [
  { value: "50+", label: "Free Tools", icon: Zap },
  { value: "1M+", label: "Calculations", icon: Calculator },
  { value: "4.9★", label: "User Rating", icon: Star },
  { value: "<1s", label: "Avg Load Time", icon: Clock },
];

const faqs = [
  {
    q: "Are all tools on ZSpace completely free?",
    a: "Yes, every tool on ZSpace Tools is 100% free, with no hidden charges, subscriptions, or sign-ups required.",
  },
  {
    q: "Do you store any of my data?",
    a: "No. All calculations happen locally in your browser. We do not store, sell, or share any data you enter into our tools.",
  },
  {
    q: "Are the calculations accurate?",
    a: "Our tools are regularly audited against official government guidelines (like GST, Income Tax slabs) to ensure accuracy.",
  },
  {
    q: "Can I use ZSpace Tools on mobile?",
    a: "Absolutely. ZSpace Tools is fully responsive and optimised for all screen sizes — mobile, tablet, and desktop.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-900 noise-bg pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-zest-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-glow animate-pulse-slow" />
            <span className="text-xs font-display font-semibold uppercase tracking-widest text-white/60">
              50+ Free Tools for Indian Businesses
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.08] tracking-tight mb-6 animate-fade-up animate-delay-100 text-balance">
            Every Tool Your{" "}
            <span className="gradient-text">Business Needs,</span>
            <br />
            Free. Forever.
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-200">
            Instant GST calculations, income tax estimates, EMI schedules, and
            50+ more tools — no sign-up, no ads, no nonsense. Just results.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up animate-delay-300">
            <Link
              href="/tools/gst-calculator"
              className="btn-primary px-7 py-3.5 text-base"
            >
              <Calculator className="w-4 h-4" />
              GST Calculator
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium text-white/70 border border-white/10 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"
            >
              All 50+ Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-up animate-delay-400">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/8 rounded-2xl px-4 py-5 backdrop-blur-sm"
              >
                <div className="text-2xl font-display font-extrabold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        className="py-16 lg:py-20 bg-white"
        aria-labelledby="categories-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="section-tag mb-3">Browse by Category</span>
            <h2
              id="categories-heading"
              className="font-display font-bold text-2xl lg:text-3xl text-ink-800"
            >
              Find the right tool, fast
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {allCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-card bg-white hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-display font-semibold text-ink-700 leading-snug">
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {cat.count} tools
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section
        className="py-16 lg:py-24 bg-gray-50"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="section-tag mb-3">Featured Tools</span>
              <h2
                id="featured-heading"
                className="font-display font-bold text-2xl lg:text-3xl text-ink-800"
              >
                Most used by our community
              </h2>
            </div>
            <Link href="/tools" className="btn-ghost flex-shrink-0">
              View all tools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.href} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY ZSPACE */}
      <section
        className="py-16 lg:py-24 bg-white"
        aria-labelledby="why-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-tag mb-4">Why ZSpace Tools</span>
              <h2
                id="why-heading"
                className="font-display font-bold text-3xl lg:text-4xl text-ink-800 leading-tight mb-6 text-balance"
              >
                Tools built with precision for Indian professionals
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                We&apos;re obsessed with accuracy, speed, and simplicity. Every
                tool is built to Indian tax laws and business standards — so you
                can trust the numbers every time.
              </p>

              <div className="space-y-5">
                {[
                  {
                    title: "100% Free, Always",
                    desc: "No freemium traps. Every feature, every tool — completely free.",
                    color: "bg-emerald-500",
                  },
                  {
                    title: "No Sign-up Required",
                    desc: "Open a tool, enter your numbers, get your answer. Done.",
                    color: "bg-zest-500",
                  },
                  {
                    title: "Updated for Latest Laws",
                    desc: "GST slabs, income tax brackets — we update with every budget.",
                    color: "bg-blue-500",
                  },
                  {
                    title: "Mobile-first Design",
                    desc: 'Pixel-perfect on every device from a 4" phone to a 4K monitor.',
                    color: "bg-rose-500",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${item.color} mt-2 flex-shrink-0`}
                    />
                    <div>
                      <h3 className="font-display font-semibold text-ink-800 mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-ink-900 rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-100" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-zest-500/10 rounded-full blur-3xl" />
                <div className="relative space-y-3">
                  {/* Mock tool UI */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs font-display uppercase tracking-wider text-white/30 mb-3">
                      Amount
                    </div>
                    <div className="text-3xl font-display font-bold text-white">
                      ₹1,00,000
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="text-xs font-display uppercase tracking-wider text-white/30 mb-2">
                        GST Rate
                      </div>
                      <div className="text-xl font-display font-bold text-white">
                        18%
                      </div>
                    </div>
                    <div className="bg-zest-500/20 border border-zest-500/30 rounded-2xl p-4">
                      <div className="text-xs font-display uppercase tracking-wider text-zest-400/60 mb-2">
                        GST Amount
                      </div>
                      <div className="text-xl font-display font-bold text-white">
                        ₹18,000
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 font-display uppercase tracking-wider">
                        Total
                      </span>
                      <div className="text-xl font-display font-bold text-glow">
                        ₹1,18,000
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-2">
                    <span className="text-xs text-white/25 font-mono">
                      CGST ₹9,000 + SGST ₹9,000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="py-16 lg:py-24 bg-gray-50"
        aria-labelledby="faq-heading"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-tag mb-3">FAQs</span>
            <h2
              id="faq-heading"
              className="font-display font-bold text-2xl lg:text-3xl text-ink-800"
            >
              Frequently asked questions
            </h2>
          </div>

          <div
            className="space-y-4"
            itemScope
            itemType="https://schema.org/FAQPage"
          >
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h3
                  className="font-display font-semibold text-ink-800 mb-2"
                  itemProp="name"
                >
                  {faq.q}
                </h3>
                <div
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p
                    className="text-sm text-gray-500 leading-relaxed"
                    itemProp="text"
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-8 py-12 lg:px-14 lg:py-14 text-center noise-bg">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-zest-500/15 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="font-display font-bold text-2xl lg:text-4xl text-white mb-4 text-balance">
                Start calculating for free — right now
              </h2>
              <p className="text-white/50 mb-8 max-w-xl mx-auto">
                No accounts, no cards, no delays. Pick a tool and get your
                answer in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/tools/gst-calculator"
                  className="btn-primary px-8 py-3.5 text-base"
                >
                  GST Calculator
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-white/60 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all"
                >
                  Explore All Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
