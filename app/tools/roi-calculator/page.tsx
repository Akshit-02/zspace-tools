import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  ChevronRight,
  Calculator,
  IndianRupee,
} from "lucide-react";
import ROICalculatorClient from "./ROICalculatorClient";

export const metadata: Metadata = {
  title: "Free ROI Calculator — Calculate Return on Investment & CAGR Online",
  description:
    "Calculate ROI (Return on Investment) and annualised CAGR instantly. Enter initial investment, final value, costs, and holding period for accurate profit/loss analysis.",
  keywords: [
    "ROI calculator",
    "return on investment calculator",
    "CAGR calculator",
    "investment return calculator",
    "ROI calculator India",
    "annualised return calculator",
    "profit loss calculator",
    "investment calculator online",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/roi-calculator" },
  openGraph: {
    title: "Free ROI Calculator — ZSpace Tools",
    description:
      "Calculate ROI, CAGR, and investment returns with projection charts.",
    url: "https://tools.zspace.in/tools/roi-calculator",
  },
};

const faqs = [
  {
    q: "What is ROI (Return on Investment)?",
    a: "ROI is a performance metric used to evaluate the efficiency of an investment. It measures the return relative to the cost of investment. Formula: ROI = (Net Profit ÷ Total Cost) × 100. A positive ROI means a gain; negative means a loss.",
  },
  {
    q: "What is the difference between ROI and CAGR?",
    a: "ROI measures total return regardless of time — useful for simple comparisons. CAGR (Compound Annual Growth Rate) is the annualised ROI that accounts for the holding period, making it better for comparing investments held for different durations. CAGR = (Final Value / Initial Value)^(1/Years) - 1.",
  },
  {
    q: "What is a good ROI?",
    a: 'A "good" ROI depends on the asset class and risk involved. In India, equity markets have historically returned 12–15% CAGR over the long term. FDs offer 6–8%, real estate 8–12%, and gold 10–12%. Any return above your benchmark or inflation rate (~6%) is generally considered positive.',
  },
  {
    q: "How do I include transaction costs in ROI?",
    a: 'Use the "Additional Costs" field to include brokerage fees, STT, GST, capital gains tax, registration charges, or any other cost. Adding these gives you a more accurate net ROI reflecting the real return you received.',
  },
  {
    q: "Can ROI be negative?",
    a: "Yes. A negative ROI means your investment lost value. For example, if you invested ₹1,00,000 and got back ₹80,000, your ROI is -20%. This is common in equity markets in the short term, which is why long-term investing is generally recommended.",
  },
  {
    q: "What is a Return Multiplier?",
    a: "The return multiplier (also called money multiple or MOIC) shows how many times your initial investment grew. A multiplier of 2x means your money doubled; 0.8x means you got back 80% (a 20% loss). It's a simple way to visualise investment growth without percentages.",
  },
];

const investmentBenchmarks = [
  {
    type: "Fixed Deposit (FD)",
    typical: "6.5 – 8%",
    risk: "Very Low",
    icon: "🏦",
  },
  { type: "PPF", typical: "7.1%", risk: "Low", icon: "📊" },
  {
    type: "Debt Mutual Funds",
    typical: "7 – 9%",
    risk: "Low-Medium",
    icon: "📈",
  },
  { type: "Gold", typical: "10 – 12%", risk: "Medium", icon: "🥇" },
  { type: "Real Estate", typical: "8 – 14%", risk: "Medium", icon: "🏠" },
  { type: "Equity / Stocks", typical: "12 – 18%", risk: "High", icon: "📉" },
  {
    type: "Equity Mutual Funds",
    typical: "12 – 15%",
    risk: "High",
    icon: "💹",
  },
  { type: "Startups / PE", typical: "20%+", risk: "Very High", icon: "🚀" },
];

const relatedTools = [
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  {
    name: "Compound Interest",
    href: "/tools/compound-interest",
    icon: TrendingUp,
  },
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
];

export default function ROICalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "ROI Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/roi-calculator",
            description:
              "Calculate ROI, annualised CAGR, net profit/loss, and return multiplier for any investment.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Basic ROI Calculation",
              "Annualised ROI / CAGR",
              "Net Profit & Loss",
              "Return Multiplier",
              "Growth Projection Chart",
              "Quick Investment Examples",
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
            <span className="text-ink-600 font-medium">ROI Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  ROI Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600">
                  With CAGR
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your Return on Investment (ROI) and annualised CAGR
                for any asset — stocks, mutual funds, real estate, FD, or
                business. Includes net profit, return multiplier, and growth
                projections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ROICalculatorClient />
        </div>
      </section>

      {/* Formulas */}
      <section className="py-12 bg-gray-50" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            ROI & CAGR Formulas
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-zest-500 mb-3">
                Basic ROI
              </p>
              <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-ink-700 mb-3">
                ROI = (Net Profit ÷ Total Cost) × 100
              </div>
              <p className="text-xs text-gray-500">
                Where Net Profit = Final Value − Total Cost (initial +
                additional costs). Does not consider time period.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-blue-500 mb-3">
                Annualised ROI (CAGR)
              </p>
              <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-ink-700 mb-3">
                CAGR = (FV / IV)^(1/n) − 1
              </div>
              <p className="text-xs text-gray-500">
                Where FV = Final Value, IV = Initial Investment, n = Years.
                Gives a comparable annual rate.
              </p>
            </div>
          </div>

          {/* How to use */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Enter Cost",
                desc: "Your initial investment and any additional costs (brokerage, tax, fees).",
              },
              {
                step: "2",
                title: "Final Value",
                desc: "The current or exit value of your investment.",
              },
              {
                step: "3",
                title: "Time Period",
                desc: "How long you held the investment — in days, months, or years.",
              },
              {
                step: "4",
                title: "Get ROI",
                desc: "See your basic ROI, CAGR, multiplier, and 5-year projection.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-3 shadow-card"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500 text-white font-display font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink-800 mb-0.5 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benchmark returns */}
      <section className="py-12 bg-white" aria-labelledby="benchmarks-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="benchmarks-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Typical ROI by Asset Class in India
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Historical average returns across popular investment categories. Use
            these as benchmarks for your own ROI.
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              aria-label="ROI benchmarks by asset class"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Asset Class
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Typical Annual Return
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {investmentBenchmarks.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      i < investmentBenchmarks.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }
                  >
                    <td className="px-5 py-3.5 font-medium text-ink-700">
                      <span className="mr-2">{row.icon}</span>
                      {row.type}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono">
                      {row.typical}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          row.risk === "Very Low"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.risk === "Low"
                              ? "bg-blue-50 text-blue-700"
                              : row.risk === "Low-Medium"
                                ? "bg-cyan-50 text-cyan-700"
                                : row.risk === "Medium"
                                  ? "bg-amber-50 text-amber-700"
                                  : row.risk === "High"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
            <span>ℹ️</span>
            Returns are historical averages and not guaranteed. Past performance
            does not indicate future results.
          </p>
        </div>
      </section>

      {/* ROI vs CAGR */}
      <section
        className="py-12 bg-gray-50"
        aria-labelledby="comparison-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="comparison-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            When to Use ROI vs CAGR
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Use Basic ROI when…",
                color: "border-zest-100 bg-zest-50",
                titleColor: "text-zest-700",
                points: [
                  "Comparing two investments of the same duration",
                  "Evaluating a marketing campaign return",
                  "Calculating profit on a quick trade",
                  "You only care about total gain, not time",
                ],
              },
              {
                title: "Use CAGR when…",
                color: "border-blue-100 bg-blue-50",
                titleColor: "text-blue-700",
                points: [
                  "Comparing investments held for different periods",
                  "Benchmarking against market indices",
                  "Evaluating mutual fund performance",
                  "Planning for long-term financial goals",
                ],
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border p-5 ${item.color}`}
              >
                <h3
                  className={`font-display font-semibold text-sm mb-3 ${item.titleColor}`}
                >
                  {item.title}
                </h3>
                <ul className="space-y-1.5">
                  {item.points.map((pt, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <span className={`mt-0.5 font-bold ${item.titleColor}`}>
                        ✓
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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

      {/* Disclaimer */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-xs text-amber-800 leading-relaxed">
            <strong className="font-semibold">Disclaimer:</strong> This
            calculator is for educational and informational purposes only. ROI
            figures are based on inputs provided and do not account for
            inflation, taxes, or market risks. This is not financial advice.
            Consult a SEBI-registered investment advisor before making
            investment decisions.
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-semibold text-lg text-ink-700 mb-4">
            Related Tools
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-cyan-300 hover:text-cyan-600 hover:shadow-glow-sm transition-all"
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
