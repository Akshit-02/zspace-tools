import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ChevronRight, IndianRupee, Users } from "lucide-react";
import PFCalculatorClient from "./PFCalculatorClient";

export const metadata: Metadata = {
  title: "Free EPF / PF Calculator India — Calculate PF Maturity & Pension",
  description:
    "Calculate your EPF (Employee Provident Fund) maturity amount, monthly contributions, EPS pension, and year-wise growth. Updated with 8.25% interest rate for FY 2023-24.",
  keywords: [
    "PF calculator",
    "EPF calculator",
    "provident fund calculator",
    "EPF maturity calculator",
    "EPF calculator India",
    "employee provident fund calculator",
    "PF interest calculator",
    "EPS pension calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/pf-calculator" },
  openGraph: {
    title: "Free EPF / PF Calculator India — ZSpace Tools",
    description:
      "Calculate EPF maturity, monthly contributions, EPS pension with year-wise schedule.",
    url: "https://tools.zspace.in/tools/pf-calculator",
  },
};

const faqs = [
  {
    q: "What is EPF and how does it work?",
    a: "EPF (Employee Provident Fund) is a mandatory savings scheme for salaried employees in India managed by the EPFO. Both employee and employer contribute 12% of the basic salary + DA each month. The accumulated corpus earns a government-declared interest rate and is paid out at retirement.",
  },
  {
    q: "What is the EPF interest rate for FY 2023-24?",
    a: "The EPFO declared an interest rate of 8.25% per annum for FY 2023-24 — the highest in over a decade. Interest is calculated on the monthly running balance and credited annually to the EPF account.",
  },
  {
    q: "What is the difference between EPF and EPS?",
    a: "EPF (Employee Provident Fund) is the savings component. Of the employer's 12% contribution, 8.33% goes to EPS (Employee Pension Scheme) and 3.67% goes to EPF. EPS builds a pension corpus, while EPF grows with compound interest. EPS contributions are capped at ₹15,000 wage ceiling.",
  },
  {
    q: "When can I withdraw my EPF?",
    a: "Full EPF withdrawal is allowed on retirement (age 58), or after being unemployed for 2+ months. Partial withdrawals are allowed for specific purposes like medical emergency (up to 6 months salary), marriage/education (50% of employee share), home loan repayment, and more after specific service periods.",
  },
  {
    q: "Is EPF withdrawal taxable?",
    a: "EPF withdrawal after 5 years of continuous service is fully tax-free. Withdrawal before 5 years is taxable — TDS at 10% is deducted (if PAN provided) or 34.608% (if PAN not provided). Withdrawal due to ill health or company closure is always tax-free.",
  },
  {
    q: "What is the EPS pension formula?",
    a: "EPS Monthly Pension = (Pensionable Salary × Pensionable Service) ÷ 70. Pensionable salary is the average monthly salary for the last 60 months, capped at ₹15,000. Pensionable service counts years of EPS membership.",
  },
  {
    q: "Can I check my EPF balance online?",
    a: "Yes. You can check your EPF balance on the EPFO member portal (passbook.epfindia.gov.in) using your UAN and password. You can also use the UMANG app, send an SMS to 7738299899, or give a missed call to 011-22901406 from your registered mobile number.",
  },
];

const epfKeyFacts = [
  { icon: "💼", label: "Employee Contribution", value: "12% of Basic + DA" },
  { icon: "🏢", label: "Employer Contribution", value: "12% of Basic + DA" },
  { icon: "📊", label: "Employer EPF Split", value: "3.67% EPF + 8.33% EPS" },
  { icon: "📈", label: "Interest Rate FY24", value: "8.25% p.a." },
  { icon: "🏦", label: "EPS Wage Ceiling", value: "₹15,000/month" },
  {
    icon: "🎯",
    label: "Max Tax-free Withdrawal",
    value: "After 5 years service",
  },
];

const relatedTools = [
  {
    name: "Gratuity Calculator",
    href: "/tools/gratuity-calculator",
    icon: Users,
  },
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Briefcase },
];

export default function PFCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "EPF / PF Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/pf-calculator",
            description:
              "Calculate EPF maturity amount, monthly contributions, EPS pension, and year-wise growth schedule.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "EPF Maturity Calculation",
              "Monthly Contribution Breakdown",
              "EPS Pension Estimate",
              "Year-wise Growth Schedule",
              "Interest Composition Chart",
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
            <span className="text-ink-600 font-medium">PF Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  EPF / PF Calculator India
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                  8.25% FY 2023-24
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your Employee Provident Fund (EPF) maturity amount,
                monthly contributions, EPS pension estimate, and year-wise
                growth — updated with the latest 8.25% interest rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PFCalculatorClient />
        </div>
      </section>

      {/* Key facts */}
      <section className="py-12 bg-gray-50" aria-labelledby="facts-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="facts-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            EPF Key Facts at a Glance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {epfKeyFacts.map((fact) => (
              <div
                key={fact.label}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="text-2xl mb-2">{fact.icon}</div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                  {fact.label}
                </p>
                <p className="font-display font-bold text-ink-800 text-sm">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contribution breakdown explanation */}
      <section className="py-12 bg-white" aria-labelledby="breakdown-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="breakdown-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            How EPF Contributions are Split
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card mb-6">
            <table
              className="w-full text-sm"
              aria-label="EPF contribution split"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Component
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Rate
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Goes To
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    comp: "Employee",
                    rate: "12%",
                    to: "EPF Account",
                    purpose: "Retirement savings",
                    color: "bg-zest-50 text-zest-700",
                  },
                  {
                    comp: "Employer EPF",
                    rate: "3.67%",
                    to: "EPF Account",
                    purpose: "Retirement savings",
                    color: "bg-blue-50 text-blue-700",
                  },
                  {
                    comp: "Employer EPS",
                    rate: "8.33%",
                    to: "Pension Fund",
                    purpose: "Monthly pension at retirement",
                    color: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    comp: "Employer EDLI",
                    rate: "0.5%",
                    to: "Insurance Fund",
                    purpose: "Life insurance cover",
                    color: "bg-amber-50 text-amber-700",
                  },
                  {
                    comp: "Admin Charges",
                    rate: "0.5%",
                    to: "EPFO Admin",
                    purpose: "Administration",
                    color: "bg-gray-100 text-gray-600",
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={i < 4 ? "border-b border-gray-50" : ""}
                  >
                    <td className="px-5 py-3.5 font-medium text-ink-700">
                      {row.comp}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${row.color}`}
                      >
                        {row.rate}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{row.to}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell text-xs">
                      {row.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Withdrawal rules */}
          <h3 className="font-display font-bold text-lg text-ink-800 mb-4">
            Partial Withdrawal Rules
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🏥",
                title: "Medical Emergency",
                rule: "Up to 6 months' basic salary. No minimum service required.",
              },
              {
                icon: "💍",
                title: "Marriage / Education",
                rule: "50% of employee's share. Minimum 7 years of service.",
              },
              {
                icon: "🏠",
                title: "Home Purchase / Loan",
                rule: "Up to 90% of balance. Minimum 5 years of service.",
              },
              {
                icon: "🔧",
                title: "Home Renovation",
                rule: "Up to 12 times monthly wages. Minimum 5 years.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-display font-semibold text-ink-800 text-sm mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interest rate history */}
      <section className="py-12 bg-gray-50" aria-labelledby="history-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="history-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            EPF Interest Rate History
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              aria-label="EPF interest rate history"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Financial Year
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Interest Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { year: "FY 2023-24", rate: "8.25%", current: true },
                  { year: "FY 2022-23", rate: "8.15%", current: false },
                  { year: "FY 2021-22", rate: "8.10%", current: false },
                  { year: "FY 2020-21", rate: "8.50%", current: false },
                  { year: "FY 2019-20", rate: "8.50%", current: false },
                  { year: "FY 2018-19", rate: "8.65%", current: false },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={`${i < 5 ? "border-b border-gray-50" : ""} ${row.current ? "bg-zest-500/5" : ""}`}
                  >
                    <td
                      className={`px-5 py-3.5 font-medium ${row.current ? "text-zest-600" : "text-ink-600"}`}
                    >
                      {row.year}{" "}
                      {row.current && (
                        <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-zest-500/10 text-zest-500">
                          Current
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-5 py-3.5 font-display font-bold ${row.current ? "text-zest-600" : "text-ink-700"}`}
                    >
                      {row.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            calculator is for estimation purposes only. The actual EPF maturity
            amount may vary based on salary changes, withdrawal history, and
            EPFO interest rate revisions. EPS pension is an approximation based
            on simplified formula. Please refer to your official EPFO passbook
            for accurate balances.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-glow-sm transition-all"
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
