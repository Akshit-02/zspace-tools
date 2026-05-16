import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  ChevronRight,
  Receipt,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import EMICalculatorClient from "./EMICalculatorClient";

export const metadata: Metadata = {
  title: "Free EMI Calculator India — Home, Car & Personal Loan EMI",
  description:
    "Calculate your monthly EMI instantly for home loan, car loan, and personal loan. Get full amortisation schedule, total interest, and payment breakdown. 100% free.",
  keywords: [
    "EMI calculator",
    "EMI calculator India",
    "home loan EMI calculator",
    "car loan EMI calculator",
    "personal loan EMI",
    "loan EMI calculator online",
    "monthly EMI calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/emi-calculator" },
  openGraph: {
    title: "Free EMI Calculator India — ZSpace Tools",
    description:
      "Calculate EMI for any loan instantly. Amortisation schedule included.",
    url: "https://tools.zspace.in/tools/emi-calculator",
  },
};

const faqs = [
  {
    q: "What is EMI?",
    a: "EMI (Equated Monthly Instalment) is a fixed amount paid by a borrower to a lender every month on a specified date. It consists of both the principal repayment and the interest on the outstanding loan amount.",
  },
  {
    q: "How is EMI calculated?",
    a: "EMI = [P × R × (1+R)^N] / [(1+R)^N – 1], where P is the principal loan amount, R is the monthly interest rate (annual rate ÷ 12 ÷ 100), and N is the number of monthly instalments.",
  },
  {
    q: "Does a higher tenure reduce my EMI?",
    a: "Yes, a longer tenure reduces your monthly EMI but significantly increases the total interest you pay over the life of the loan. It's a trade-off between cash flow and total cost.",
  },
  {
    q: "What is an amortisation schedule?",
    a: "An amortisation schedule is a complete table of periodic loan payments showing the amount of principal and interest that make up each payment until the loan is paid off at the end of the term.",
  },
];

const loanComparison = [
  {
    type: "Home Loan",
    rate: "8.5–9.5%",
    tenure: "10–30 years",
    icon: "🏠",
    color: "bg-violet-50 border-violet-100",
  },
  {
    type: "Car Loan",
    rate: "9–12%",
    tenure: "1–7 years",
    icon: "🚗",
    color: "bg-blue-50 border-blue-100",
  },
  {
    type: "Personal Loan",
    rate: "11–24%",
    tenure: "1–5 years",
    icon: "💼",
    color: "bg-emerald-50 border-emerald-100",
  },
  {
    type: "Education Loan",
    rate: "9–13%",
    tenure: "5–15 years",
    icon: "🎓",
    color: "bg-amber-50 border-amber-100",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Receipt },
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  {
    name: "Compound Interest",
    href: "/tools/compound-interest",
    icon: TrendingUp,
  },
];

export default function EMICalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "EMI Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/emi-calculator",
            description:
              "Free online EMI calculator for home, car, and personal loans with amortisation schedule.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Home Loan EMI",
              "Car Loan EMI",
              "Personal Loan EMI",
              "Amortisation Schedule",
              "Payment Breakdown Chart",
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

      {/* Breadcrumb + Hero */}
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
            <span className="text-ink-600 font-medium">EMI Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Free EMI Calculator India
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                  With Schedule
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your monthly EMI for home, car, personal, or education
                loans. Get a full amortisation schedule and interest breakdown
                instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EMICalculatorClient />
        </div>
      </section>

      {/* How to use */}
      <section className="py-12 bg-gray-50" aria-labelledby="howto-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="howto-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            How to use the EMI Calculator
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Select Loan Type",
                desc: "Choose from Home, Car, Personal, or Education loan to auto-fill typical interest rates.",
              },
              {
                step: "2",
                title: "Enter Loan Amount",
                desc: "Type in the principal loan amount or use the slider to adjust.",
              },
              {
                step: "3",
                title: "Set Interest Rate",
                desc: "Enter the annual interest rate offered by your lender.",
              },
              {
                step: "4",
                title: "Choose Tenure",
                desc: "Set the repayment period in months or years. Your EMI and schedule update instantly.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-card"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
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

      {/* EMI Formula */}
      <section className="py-12 bg-white" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-4"
          >
            EMI Formula
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            The standard formula used to calculate EMI across all banks and
            NBFCs in India:
          </p>
          <div className="bg-ink-900 rounded-2xl p-6 lg:p-8 text-center mb-6">
            <p className="font-mono text-white/50 text-xs uppercase tracking-widest mb-3">
              Formula
            </p>
            <p className="font-mono text-white text-base lg:text-xl font-medium">
              EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                symbol: "P",
                label: "Principal",
                desc: "The original loan amount borrowed",
              },
              {
                symbol: "R",
                label: "Monthly Rate",
                desc: "Annual interest rate ÷ 12 ÷ 100",
              },
              {
                symbol: "N",
                label: "Tenure",
                desc: "Number of monthly instalments",
              },
            ].map((item) => (
              <div
                key={item.symbol}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 font-mono font-bold text-lg flex items-center justify-center mb-3">
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

      {/* Loan type comparison */}
      <section
        className="py-12 bg-gray-50"
        aria-labelledby="comparison-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="comparison-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Typical Loan Rates in India (2024–25)
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {loanComparison.map((loan) => (
              <div
                key={loan.type}
                className={`rounded-2xl border p-5 ${loan.color} shadow-card`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{loan.icon}</span>
                  <h3 className="font-display font-semibold text-ink-800">
                    {loan.type}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                      Interest Rate
                    </p>
                    <p className="text-sm font-semibold text-ink-700">
                      {loan.rate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                      Typical Tenure
                    </p>
                    <p className="text-sm font-semibold text-ink-700">
                      {loan.tenure}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-start gap-1.5">
            <span className="mt-0.5">ℹ️</span>
            Rates are indicative and vary by lender, credit score, and RBI repo
            rate. Always check with your bank for exact rates.
          </p>
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
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5"
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-glow-sm transition-all"
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
