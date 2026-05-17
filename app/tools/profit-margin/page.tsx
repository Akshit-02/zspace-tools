import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart2,
  ChevronRight,
  Receipt,
  Calculator,
  Percent,
} from "lucide-react";
import ProfitMarginClient from "./ProfitMarginClient";

export const metadata: Metadata = {
  title: "Free Profit Margin Calculator — Gross, Operating & Net Margin",
  description:
    "Calculate gross margin, operating margin, and net profit margin instantly. Find selling price from desired margin, convert markup to margin, and analyse business profitability.",
  keywords: [
    "profit margin calculator",
    "gross margin calculator",
    "net profit margin calculator",
    "markup to margin calculator",
    "selling price calculator",
    "profit calculator India",
    "business margin calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/profit-margin" },
  openGraph: {
    title: "Free Profit Margin Calculator — ZSpace Tools",
    description:
      "Gross, operating & net margin. Markup ↔ margin converter. Selling price finder.",
    url: "https://tools.zspace.in/tools/profit-margin",
  },
};

const faqs = [
  {
    q: "What is gross profit margin?",
    a: "Gross profit margin is the percentage of revenue remaining after subtracting the cost of goods sold (COGS). Formula: ((Revenue − COGS) ÷ Revenue) × 100. It shows how efficiently a company produces goods relative to its revenue.",
  },
  {
    q: "What is the difference between markup and margin?",
    a: "Markup is profit as a percentage of cost, while margin is profit as a percentage of selling price. For example, if cost is ₹80 and selling price is ₹100, the markup is 25% (20÷80) but the margin is 20% (20÷100). They are often confused but are very different.",
  },
  {
    q: "What is a good profit margin for a business?",
    a: "It depends on the industry. Generally: net margin above 20% is excellent, 10–20% is good, 5–10% is average, and below 5% is thin. Retail businesses often have 2–5% net margins while software companies can have 20–30%+.",
  },
  {
    q: "How do I find the selling price from a desired margin?",
    a: "Use the formula: Selling Price = Cost ÷ (1 − Desired Margin%). For example, if cost is ₹80,000 and you want a 40% margin, the selling price = 80,000 ÷ 0.6 = ₹1,33,333.",
  },
  {
    q: "What is operating margin?",
    a: "Operating margin (EBIT margin) is the percentage of revenue remaining after subtracting COGS and all operating expenses (salaries, rent, utilities), but before interest and taxes. It shows core business profitability.",
  },
];

const industryBenchmarks = [
  {
    industry: "Software / SaaS",
    gross: "70–80%",
    net: "15–25%",
    color: "bg-violet-50 border-violet-100",
  },
  {
    industry: "E-commerce / Retail",
    gross: "30–50%",
    net: "2–5%",
    color: "bg-blue-50 border-blue-100",
  },
  {
    industry: "Manufacturing",
    gross: "25–40%",
    net: "5–10%",
    color: "bg-emerald-50 border-emerald-100",
  },
  {
    industry: "Restaurant / F&B",
    gross: "60–70%",
    net: "3–9%",
    color: "bg-amber-50 border-amber-100",
  },
  {
    industry: "Consulting",
    gross: "50–70%",
    net: "10–20%",
    color: "bg-rose-50 border-rose-100",
  },
  {
    industry: "Healthcare",
    gross: "40–60%",
    net: "5–15%",
    color: "bg-teal-50 border-teal-100",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Receipt },
  {
    name: "Percentage Calculator",
    href: "/tools/percentage-calculator",
    icon: Percent,
  },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
];

export default function ProfitMarginPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Profit Margin Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/profit-margin",
            description:
              "Calculate gross, operating, and net profit margins. Includes markup ↔ margin converter and selling price finder.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Gross Margin",
              "Operating Margin",
              "Net Margin",
              "Markup to Margin Converter",
              "Selling Price Calculator",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white pt-28 pb-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-gray-400 mb-6"
          >
            <Link href="/" className="hover:text-gray-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/tools"
              className="hover:text-gray-600 transition-colors"
            >
              Tools
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-600 font-medium">
              Profit Margin Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Profit Margin Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                  3-in-1
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate gross, operating, and net profit margins. Find your
                ideal selling price from a target margin, and convert between
                markup and margin percentages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfitMarginClient />
        </div>
      </section>

      {/* Formulas */}
      <section className="py-12 bg-gray-50" aria-labelledby="formulas-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formulas-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Profit Margin Formulas
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "Gross Profit",
                formula: "Revenue − COGS",
                example: "₹1,50,000 − ₹90,000 = ₹60,000",
              },
              {
                title: "Gross Margin",
                formula: "(Gross Profit ÷ Revenue) × 100",
                example: "(60,000 ÷ 1,50,000) × 100 = 40%",
              },
              {
                title: "Markup %",
                formula: "(Gross Profit ÷ COGS) × 100",
                example: "(60,000 ÷ 90,000) × 100 = 66.7%",
              },
              {
                title: "Operating Margin",
                formula: "((Gross Profit − OPEX) ÷ Revenue) × 100",
                example: "(40,000 ÷ 1,50,000) × 100 = 26.7%",
              },
              {
                title: "Net Margin",
                formula: "(Net Profit ÷ Revenue) × 100",
                example: "(30,000 ÷ 1,50,000) × 100 = 20%",
              },
              {
                title: "Selling Price",
                formula: "Cost ÷ (1 − Target Margin%)",
                example: "90,000 ÷ 0.6 = ₹1,50,000 for 40% margin",
              },
            ].map((row) => (
              <div
                key={row.title}
                className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white rounded-xl border border-gray-100 px-5 py-3.5 shadow-card"
              >
                <span className="font-display font-semibold text-ink-800 text-sm w-40 flex-shrink-0">
                  {row.title}
                </span>
                <code className="font-mono text-xs text-zest-500 bg-zest-500/5 px-2.5 py-1 rounded-lg flex-1">
                  {row.formula}
                </code>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                  {row.example}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry benchmarks */}
      <section className="py-12 bg-white" aria-labelledby="benchmarks-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="benchmarks-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Industry Profit Margin Benchmarks
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Typical margin ranges across major industries (indicative).
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industryBenchmarks.map((item) => (
              <div
                key={item.industry}
                className={`rounded-2xl border p-5 ${item.color} shadow-card`}
              >
                <h3 className="font-display font-semibold text-ink-800 text-sm mb-3">
                  {item.industry}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                      Gross Margin
                    </p>
                    <p className="text-sm font-bold text-ink-700">
                      {item.gross}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                      Net Margin
                    </p>
                    <p className="text-sm font-bold text-ink-700">{item.net}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-start gap-1.5">
            <span>ℹ️</span>
            Margins vary significantly by company size, geography, and business
            model. Use these as directional benchmarks only.
          </p>
        </div>
      </section>

      {/* Margin vs Markup explainer */}
      <section className="py-12 bg-gray-50" aria-labelledby="vs-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="vs-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Margin vs Markup — What&apos;s the Difference?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <div className="text-2xl mb-3">📐</div>
              <h3 className="font-display font-semibold text-ink-800 mb-2">
                Margin
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Profit as a percentage of the{" "}
                <strong className="text-ink-700">selling price</strong>.
              </p>
              <code className="text-xs font-mono bg-gray-50 p-3 rounded-xl block text-zest-500">
                Margin = (Profit ÷ Revenue) × 100
              </code>
              <p className="text-xs text-gray-400 mt-3">
                Example: Cost ₹80, Price ₹100 → Margin = 20%
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <div className="text-2xl mb-3">🏷️</div>
              <h3 className="font-display font-semibold text-ink-800 mb-2">
                Markup
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Profit as a percentage of the{" "}
                <strong className="text-ink-700">cost price</strong>.
              </p>
              <code className="text-xs font-mono bg-gray-50 p-3 rounded-xl block text-zest-500">
                Markup = (Profit ÷ Cost) × 100
              </code>
              <p className="text-xs text-gray-400 mt-3">
                Example: Cost ₹80, Price ₹100 → Markup = 25%
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
            <strong className="font-semibold">Key insight:</strong> The same
            product can have a 20% margin but a 25% markup — they are both
            correct, just measured differently. Margin is always lower than
            markup for the same profit amount. Confusing the two is one of the
            most common pricing mistakes in business.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-white" aria-labelledby="faq-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="faq-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Frequently Asked Questions
          </h2>
          <div
            className="space-y-4"
            itemScope
            itemType="https://schema.org/FAQPage"
          >
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-card"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h3
                  className="font-display font-semibold text-ink-800 mb-2 text-sm"
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

      {/* Related Tools */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-semibold text-lg text-ink-700 mb-4">
            Related Tools
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-orange-300 hover:text-orange-600 hover:shadow-glow-sm transition-all"
              >
                <tool.icon className="w-4 h-4" />
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
