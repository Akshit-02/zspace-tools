import type { Metadata } from "next";
import Link from "next/link";
import { IndianRupee, ChevronRight, Receipt, Calculator } from "lucide-react";
import IncomeTaxCalculatorClient from "./IncomeTaxCalculatorClient";

export const metadata: Metadata = {
  title: "Income Tax Calculator FY 2024-25 — New & Old Regime | ZSpace Tools",
  description:
    "Calculate your income tax for FY 2024-25 under new and old tax regime. Includes 87A rebate, surcharge, cess, slab-wise breakdown, and monthly in-hand salary.",
  keywords: [
    "income tax calculator",
    "income tax calculator India 2024-25",
    "new tax regime calculator",
    "old tax regime calculator",
    "income tax slab 2024",
    "tax calculator India",
    "salary tax calculator",
  ],
  alternates: {
    canonical: "https://tools.zspace.in/tools/income-tax-calculator",
  },
  openGraph: {
    title: "Income Tax Calculator FY 2024-25 — ZSpace Tools",
    description:
      "New & old regime, 87A rebate, surcharge, cess — full tax breakdown instantly.",
    url: "https://tools.zspace.in/tools/income-tax-calculator",
  },
};

const newSlabs = [
  { range: "₹0 – ₹3,00,000", rate: "Nil" },
  { range: "₹3,00,001 – ₹7,00,000", rate: "5%" },
  { range: "₹7,00,001 – ₹10,00,000", rate: "10%" },
  { range: "₹10,00,001 – ₹12,00,000", rate: "15%" },
  { range: "₹12,00,001 – ₹15,00,000", rate: "20%" },
  { range: "Above ₹15,00,000", rate: "30%" },
];

const oldSlabs = [
  { range: "₹0 – ₹2,50,000", rate: "Nil" },
  { range: "₹2,50,001 – ₹5,00,000", rate: "5%" },
  { range: "₹5,00,001 – ₹10,00,000", rate: "20%" },
  { range: "Above ₹10,00,000", rate: "30%" },
];

const faqs = [
  {
    q: "Which tax regime is better — new or old for FY 2024-25?",
    a: "The new regime is generally better for individuals with fewer deductions. If your total deductions (80C, HRA, home loan interest, etc.) exceed ~₹3.75 lakh, the old regime may result in lower tax. Use the calculator to compare both.",
  },
  {
    q: "What is the 87A rebate?",
    a: "Section 87A provides a tax rebate to individuals whose taxable income does not exceed ₹7,00,000 (new regime) or ₹5,00,000 (old regime). The rebate is up to ₹25,000 and ₹12,500 respectively, effectively making tax zero.",
  },
  {
    q: "What is the standard deduction in the new regime?",
    a: "From FY 2024-25, salaried individuals and pensioners get a standard deduction of ₹75,000 under the new regime (increased from ₹50,000 in Budget 2024).",
  },
  {
    q: "What is Health & Education Cess?",
    a: "A 4% cess is levied on the income tax (after surcharge) payable. It goes towards funding health and education initiatives. It applies to all taxpayers regardless of income.",
  },
  {
    q: "Who pays surcharge on income tax?",
    a: "Surcharge is an additional levy on tax for high-income earners: 10% if income exceeds ₹50L, 15% above ₹1Cr, 25% above ₹2Cr, and 37% above ₹5Cr.",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Receipt },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  { name: "HRA Calculator", href: "/tools/hra-calculator", icon: IndianRupee },
];

export default function IncomeTaxCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Income Tax Calculator FY 2024-25 — ZSpace Tools",
            url: "https://tools.zspace.in/tools/income-tax-calculator",
            description:
              "Calculate income tax under new and old regime for FY 2024-25.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
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
              Income Tax Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Income Tax Calculator FY 2024-25
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  Updated
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your income tax under the new and old tax regime for
                FY 2024-25 (AY 2025-26). Includes 87A rebate, surcharge, cess,
                and full slab-wise breakdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IncomeTaxCalculatorClient />
        </div>
      </section>

      {/* Tax Slabs */}
      <section className="py-12 bg-gray-50" aria-labelledby="slabs-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="slabs-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Income Tax Slabs FY 2024-25
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            As per Budget 2024 announcements.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zest-500/10 text-zest-500">
                  New Regime
                </span>
                <span className="text-xs text-gray-400">(Default)</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-display font-semibold text-ink-700">
                        Income Slab
                      </th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-ink-700">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {newSlabs.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i < newSlabs.length - 1
                            ? "border-b border-gray-50"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {row.range}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              row.rate === "Nil"
                                ? "bg-gray-100 text-gray-500"
                                : parseInt(row.rate) <= 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : parseInt(row.rate) <= 20
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {row.rate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                + ₹75,000 standard deduction · 87A rebate up to ₹7L
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
                  Old Regime
                </span>
                <span className="text-xs text-gray-400">(Below 60 yrs)</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-display font-semibold text-ink-700">
                        Income Slab
                      </th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-ink-700">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {oldSlabs.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i < oldSlabs.length - 1
                            ? "border-b border-gray-50"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {row.range}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              row.rate === "Nil"
                                ? "bg-gray-100 text-gray-500"
                                : parseInt(row.rate) <= 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : parseInt(row.rate) <= 20
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {row.rate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                + 87A rebate up to ₹5L · All deductions available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget 2024 changes */}
      <section className="py-12 bg-white" aria-labelledby="changes-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="changes-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Key Changes in Budget 2024
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "📈",
                title: "Standard Deduction Raised",
                desc: "Increased from ₹50,000 to ₹75,000 under the new regime for salaried and pensioners.",
              },
              {
                icon: "🎯",
                title: "Revised Tax Slabs",
                desc: "The 5% slab in the new regime now extended to ₹7L, reducing tax for middle-income earners.",
              },
              {
                icon: "💰",
                title: "87A Rebate at ₹25,000",
                desc: "Individuals with taxable income up to ₹7L pay zero tax under the new regime.",
              },
              {
                icon: "🔒",
                title: "Old Regime Unchanged",
                desc: "Old regime slabs, rates, and deductions remain the same as FY 2023-24.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-display font-semibold text-ink-800 mb-1 text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
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

      {/* Disclaimer */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-xs text-amber-800 leading-relaxed">
            <strong className="font-semibold">Disclaimer:</strong> This
            calculator is for estimation purposes only. Actual tax liability may
            vary based on other income sources, investments, and applicable
            deductions. Consult a chartered accountant for accurate filing
            advice.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-emerald-300 hover:text-emerald-600 transition-all"
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
