import {
  Calculator,
  ChevronRight,
  IndianRupee,
  Receipt,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CompoundInterestClient from "./CompoundInterestClient";

export const metadata: Metadata = {
  title:
    "Free Compound Interest Calculator India — Calculate Investment Growth",
  description:
    "Calculate compound interest on your investments with monthly, quarterly, semi-annual, and annual compounding. See year-wise growth, maturity value, and total interest earned. 100% free.",
  keywords: [
    "compound interest calculator",
    "compound interest calculator India",
    "investment growth calculator",
    "SIP compound interest",
    "online compound interest calculator",
    "annual compounding calculator",
    "monthly compounding calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/compound-interest" },
  openGraph: {
    title: "Free Compound Interest Calculator — ZSpace Tools",
    description:
      "Calculate investment growth with all compounding frequencies. Year-wise breakdown included.",
    url: "https://tools.zspace.in/tools/compound-interest",
  },
};

const faqs = [
  {
    q: "What is compound interest?",
    a: 'Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. Unlike simple interest, it grows exponentially over time — which is why it\'s called the "eighth wonder of the world".',
  },
  {
    q: "What is the formula for compound interest?",
    a: "A = P × (1 + r/n)^(n×t), where A is the final amount, P is the principal, r is the annual interest rate (decimal), n is the compounding frequency per year, and t is the time in years.",
  },
  {
    q: "How does compounding frequency affect returns?",
    a: "The more frequently interest is compounded, the higher the effective return. For example, ₹1,00,000 at 12% for 5 years gives ₹1,76,234 with annual compounding but ₹1,81,940 with monthly compounding — a difference of over ₹5,700.",
  },
  {
    q: "What is the difference between compound and simple interest?",
    a: "Simple interest is calculated only on the original principal. Compound interest is calculated on the principal plus accumulated interest. Over long periods, compound interest grows significantly faster than simple interest.",
  },
  {
    q: "Which investments in India offer compound interest?",
    a: "Fixed Deposits (FDs), Public Provident Fund (PPF), National Savings Certificate (NSC), recurring deposits, mutual funds, and most market-linked instruments grow on a compounding basis.",
  },
];

const comparisonData = [
  { freq: "Annually", n: 1, example: "₹1,76,234" },
  { freq: "Semi-Annual", n: 2, example: "₹1,79,085" },
  { freq: "Quarterly", n: 4, example: "₹1,80,611" },
  { freq: "Monthly", n: 12, example: "₹1,81,670" },
  { freq: "Daily", n: 365, example: "₹1,82,194" },
];

const popularInvestments = [
  { name: "PPF", rate: "7.1%", freq: "Annually", lock: "15 years", icon: "🏛️" },
  {
    name: "Fixed Deposit",
    rate: "7–8%",
    freq: "Quarterly",
    lock: "7 days – 10 yrs",
    icon: "🏦",
  },
  { name: "NSC", rate: "7.7%", freq: "Annually", lock: "5 years", icon: "📜" },
  {
    name: "Sukanya Samriddhi",
    rate: "8.2%",
    freq: "Annually",
    lock: "21 years",
    icon: "👧",
  },
];

const relatedTools = [
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Receipt },
];

export default function CompoundInterestPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Compound Interest Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/compound-interest",
            description:
              "Free compound interest calculator with all compounding frequencies, year-wise schedule, and investment breakdown.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Annual Compounding",
              "Monthly Compounding",
              "Quarterly Compounding",
              "Monthly SIP Addition",
              "Year-wise Growth Schedule",
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
              Compound Interest Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Compound Interest Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                  With SIP
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate the power of compounding on your investments. Supports
                all compounding frequencies — annual, quarterly, monthly, and
                daily — with optional monthly SIP additions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CompoundInterestClient />
        </div>
      </section>

      {/* How to use */}
      <section className="py-12 bg-gray-50" aria-labelledby="howto-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="howto-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            How to use this calculator
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Enter Principal",
                desc: "Type the initial amount you want to invest, or use the slider.",
              },
              {
                step: "2",
                title: "Set Interest Rate",
                desc: "Enter the annual interest rate offered by your investment.",
              },
              {
                step: "3",
                title: "Choose Time Period",
                desc: "Set how many years you plan to stay invested. Use quick-select for common durations.",
              },
              {
                step: "4",
                title: "Select Compounding Frequency",
                desc: "Choose how often interest compounds — more frequent means higher returns.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-card"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CI Formula */}
      <section className="py-12 bg-white" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-4"
          >
            Compound Interest Formula
          </h2>
          <div className="bg-ink-900 rounded-2xl p-6 lg:p-8 text-center mb-6">
            <p className="font-mono text-white/50 text-xs uppercase tracking-widest mb-3">
              Formula
            </p>
            <p className="font-mono text-white text-base lg:text-xl font-medium">
              A = P × (1 + r/n) ^ (n × t)
            </p>
            <p className="text-white/30 text-xs mt-3">Where CI = A – P</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                symbol: "A",
                label: "Final Amount",
                desc: "Total value at maturity",
              },
              {
                symbol: "P",
                label: "Principal",
                desc: "Initial investment amount",
              },
              {
                symbol: "r",
                label: "Annual Rate",
                desc: "Interest rate as decimal",
              },
              {
                symbol: "n",
                label: "Frequency",
                desc: "Compoundings per year",
              },
            ].map((item) => (
              <div
                key={item.symbol}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-4"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 font-mono font-bold text-lg flex items-center justify-center mb-3">
                  {item.symbol}
                </div>
                <p className="font-display font-semibold text-ink-800 text-sm mb-1">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequency comparison */}
      <section
        className="py-12 bg-gray-50"
        aria-labelledby="comparison-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="comparison-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Compounding Frequency Comparison
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            ₹1,00,000 at 12% p.a. over 5 years — how frequency affects maturity
            value:
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Frequency
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Times/Year
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Maturity Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={row.freq}
                    className={`${i < comparisonData.length - 1 ? "border-b border-gray-50" : ""} ${i === comparisonData.length - 1 ? "bg-emerald-50/50" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-ink-700 font-medium">
                      {row.freq}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{row.n}×</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-display font-semibold ${i === comparisonData.length - 1 ? "text-emerald-600" : "text-ink-800"}`}
                      >
                        {row.example}
                      </span>
                      {i === comparisonData.length - 1 && (
                        <span className="ml-2 text-xs text-emerald-500">
                          Highest
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Popular investments */}
      <section className="py-12 bg-white" aria-labelledby="investments-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="investments-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Popular Compounding Investments in India
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {popularInvestments.map((inv) => (
              <div
                key={inv.name}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{inv.icon}</span>
                  <h3 className="font-display font-semibold text-ink-800">
                    {inv.name}
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Rate", value: inv.rate },
                    { label: "Compounding", value: inv.freq },
                    { label: "Lock-in", value: inv.lock },
                  ].map((d) => (
                    <div key={d.label}>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                        {d.label}
                      </p>
                      <p className="text-xs font-semibold text-ink-700">
                        {d.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-start gap-1.5">
            <span>ℹ️</span>
            Rates are indicative as of 2024. PPF and small savings scheme rates
            are revised quarterly by the Government of India.
          </p>
        </div>
      </section>

      {/* Compound vs Simple */}
      <section className="py-12 bg-gray-50" aria-labelledby="vs-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="vs-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Compound Interest vs Simple Interest
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <div className="text-2xl mb-3">📈</div>
              <h3 className="font-display font-semibold text-ink-800 mb-3">
                Compound Interest
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> Earns
                  interest on interest
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> Grows
                  exponentially over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> Much higher
                  returns over long periods
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span> Used in
                  FDs, PPF, mutual funds
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
              <div className="text-2xl mb-3">📉</div>
              <h3 className="font-display font-semibold text-ink-800 mb-3">
                Simple Interest
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">→</span> Earns interest
                  only on principal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">→</span> Grows linearly
                  over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">→</span> Lower returns
                  for same rate & tenure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">→</span> Used in some
                  short-term loans
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
            <strong className="font-semibold">Example:</strong> ₹1,00,000 at 12%
            for 10 years → Simple Interest gives <strong>₹2,20,000</strong>{" "}
            whereas Compound Interest (monthly) gives <strong>₹3,30,039</strong>{" "}
            — that&apos;s <strong>50% more</strong>.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-rose-300 hover:text-rose-600 hover:shadow-glow-sm transition-all"
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
