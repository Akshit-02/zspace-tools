import type { Metadata } from "next";
import Link from "next/link";
import { Percent, ChevronRight, BarChart2, TrendingUp } from "lucide-react";
import MarkupCalculatorClient from "./MarkupCalculatorClient";

export const metadata: Metadata = {
  title:
    "Free Markup Calculator — Calculate Selling Price from Cost & Markup %",
  description:
    "Calculate selling price from cost and markup percentage. Find markup % from cost and price. Understand the difference between markup and gross margin with a comparison table.",
  keywords: [
    "markup calculator",
    "markup percentage calculator",
    "selling price calculator",
    "cost to selling price calculator",
    "markup vs margin calculator",
    "gross margin calculator",
    "profit margin calculator",
    "markup calculator India",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/markup-calculator" },
  openGraph: {
    title: "Free Markup Calculator — ZSpace Tools",
    description:
      "Calculate selling price from cost + markup. Includes markup vs margin comparison and table.",
    url: "https://tools.zspace.in/tools/markup-calculator",
  },
};

const faqs = [
  {
    q: "What is markup?",
    a: "Markup is the amount added to the cost price of a product to arrive at the selling price. It is expressed as a percentage of the cost. For example, if a product costs ₹500 and you sell it for ₹700, the markup is ₹200 or 40% of the cost price.",
  },
  {
    q: "What is the markup formula?",
    a: "Markup % = (Selling Price − Cost Price) ÷ Cost Price × 100. To find selling price from markup: Selling Price = Cost Price × (1 + Markup% / 100). For example, cost ₹500 with 40% markup: ₹500 × 1.40 = ₹700.",
  },
  {
    q: "What is the difference between markup and gross margin?",
    a: "Markup is calculated as a percentage of cost, while gross margin is calculated as a percentage of selling price. For the same transaction: if cost is ₹500 and selling price is ₹700, markup = 40% but gross margin = 28.57%. Markup is always higher than gross margin for the same values.",
  },
  {
    q: "How do I convert markup to gross margin?",
    a: "Gross Margin % = Markup% ÷ (100 + Markup%) × 100. For example, 40% markup → 40 ÷ 140 × 100 = 28.57% gross margin. Conversely, Markup% = Gross Margin% ÷ (100 − Gross Margin%) × 100.",
  },
  {
    q: "What is a good markup percentage?",
    a: 'A "good" markup depends entirely on your industry. Retail typically uses 50–100% (keystone pricing), restaurants use 200–400% on food, software products often exceed 500%, while commodity businesses may work on 10–20%. You must set markup high enough to cover all operating expenses beyond just product cost.',
  },
  {
    q: "What is keystone pricing?",
    a: "Keystone pricing is a retail pricing strategy where the selling price is set at exactly double the wholesale cost, resulting in a 100% markup (50% gross margin). It is a simple rule of thumb used in fashion, jewellery, and general retail to ensure sufficient margin to cover overhead and generate profit.",
  },
];

const markupByIndustry = [
  { industry: "Grocery / FMCG", typical: "10 – 30%", margin: "9 – 23%" },
  { industry: "Apparel / Fashion", typical: "50 – 200%", margin: "33 – 67%" },
  { industry: "Electronics", typical: "15 – 40%", margin: "13 – 29%" },
  { industry: "Furniture", typical: "100 – 200%", margin: "50 – 67%" },
  { industry: "Jewellery", typical: "25 – 75%", margin: "20 – 43%" },
  { industry: "Restaurants", typical: "200 – 400%", margin: "67 – 80%" },
  { industry: "Software / SaaS", typical: "200 – 1000%", margin: "67 – 91%" },
  { industry: "Pharmaceuticals", typical: "20 – 60%", margin: "17 – 37%" },
];

const relatedTools = [
  { name: "Break-Even Calculator", href: "/tools/break-even", icon: BarChart2 },
  { name: "Profit Margin", href: "/tools/profit-margin", icon: Percent },
  { name: "ROI Calculator", href: "/tools/roi-calculator", icon: TrendingUp },
];

export default function MarkupCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Markup Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/markup-calculator",
            description:
              "Calculate selling price from cost and markup %, find markup from cost and price, and compare markup vs gross margin.",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Cost to Selling Price",
              "Selling Price to Markup %",
              "Target Margin Mode",
              "Markup vs Gross Margin Comparison",
              "Markup Comparison Table",
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
            <span className="text-ink-600 font-medium">Markup Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Percent className="w-6 h-6 text-ink-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Markup Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  3 Modes
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate selling price from cost and markup %,
                reverse-calculate markup from your prices, or find the price
                needed to hit a target gross margin. Includes markup vs margin
                comparison.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MarkupCalculatorClient />
        </div>
      </section>

      {/* Formulas */}
      <section className="py-12 bg-gray-50" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Markup Formulas
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              {
                title: "Selling Price from Markup",
                formula: "SP = Cost × (1 + Markup% ÷ 100)",
                example: "₹500 × 1.40 = ₹700 (40% markup)",
                color: "border-amber-100",
              },
              {
                title: "Markup % from Prices",
                formula: "Markup% = (SP − Cost) ÷ Cost × 100",
                example: "(₹700 − ₹500) ÷ ₹500 × 100 = 40%",
                color: "border-zest-100",
              },
              {
                title: "Price from Target Margin",
                formula: "SP = Cost ÷ (1 − Margin% ÷ 100)",
                example: "₹500 ÷ (1 − 0.30) = ₹714.29 (30% margin)",
                color: "border-blue-100",
              },
              {
                title: "Gross Margin from Markup",
                formula: "Margin% = Markup% ÷ (100 + Markup%) × 100",
                example: "40 ÷ 140 × 100 = 28.57% margin",
                color: "border-emerald-100",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`bg-white rounded-2xl border p-5 shadow-card ${item.color}`}
              >
                <p className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {item.title}
                </p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 font-mono text-sm text-ink-700 mb-2">
                  {item.formula}
                </div>
                <p className="text-xs text-gray-400 italic">{item.example}</p>
              </div>
            ))}
          </div>

          {/* Markup vs Margin table */}
          <h3 className="font-display font-bold text-lg text-ink-800 mb-4">
            Markup vs Gross Margin Conversion
          </h3>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              aria-label="Markup to gross margin conversion table"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Markup %
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Gross Margin %
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Selling Price (cost ₹100)
                  </th>
                </tr>
              </thead>
              <tbody>
                {[10, 20, 25, 30, 40, 50, 75, 100, 150, 200].map((m, i) => {
                  const margin = (m / (100 + m)) * 100;
                  const sp = 100 * (1 + m / 100);
                  return (
                    <tr
                      key={m}
                      className={i < 9 ? "border-b border-gray-50" : ""}
                    >
                      <td className="px-5 py-3 font-mono font-bold text-amber-600">
                        {m}%
                      </td>
                      <td className="px-5 py-3 font-mono text-emerald-600">
                        {margin.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">
                        ₹{sp.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Markup by industry */}
      <section className="py-12 bg-white" aria-labelledby="industry-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="industry-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Typical Markup by Industry in India
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Industry benchmarks to help you set competitive and profitable
            markups.
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              aria-label="Markup benchmarks by industry"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Industry
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Typical Markup
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Gross Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {markupByIndustry.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      i < markupByIndustry.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }
                  >
                    <td className="px-5 py-3.5 font-medium text-ink-700">
                      {row.industry}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        {row.typical}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">
                      {row.margin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
            <span>ℹ️</span>
            These are indicative ranges. Actual markups depend on brand
            positioning, competition, distribution costs, and operating
            expenses.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gray-50" aria-labelledby="faq-heading">
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
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card"
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-amber-300 hover:text-amber-600 hover:shadow-glow-sm transition-all"
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
