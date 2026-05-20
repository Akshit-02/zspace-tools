import type { Metadata } from "next";
import Link from "next/link";
import { Users, ChevronRight, IndianRupee, Calculator } from "lucide-react";
import GratuityCalculatorClient from "./GratuityCalculatorClient";

export const metadata: Metadata = {
  title: "Free Gratuity Calculator India — Calculate Gratuity Amount Online",
  description:
    "Calculate your gratuity amount as per the Payment of Gratuity Act 1972. Covers both covered and non-covered employees. Includes tax exemption status and milestone table.",
  keywords: [
    "gratuity calculator",
    "gratuity calculator India",
    "gratuity amount calculator",
    "gratuity act calculator",
    "gratuity formula India",
    "how to calculate gratuity",
    "gratuity tax exemption",
  ],
  alternates: {
    canonical: "https://tools.zspace.in/tools/gratuity-calculator",
  },
  openGraph: {
    title: "Free Gratuity Calculator India — ZSpace Tools",
    description:
      "Calculate gratuity as per the Gratuity Act. Includes tax exemption check and milestone table.",
    url: "https://tools.zspace.in/tools/gratuity-calculator",
  },
};

const faqs = [
  {
    q: "What is gratuity and who is eligible?",
    a: "Gratuity is a lump-sum payment made by an employer to an employee as a token of appreciation for their service. Under the Payment of Gratuity Act 1972, employees who have completed at least 5 years of continuous service are eligible for gratuity upon resignation, retirement, death, or disablement.",
  },
  {
    q: "What is the gratuity formula?",
    a: "For employees covered under the Gratuity Act: Gratuity = (Basic Salary + DA) × 15 × Years of Service ÷ 26. For employees not covered: Gratuity = (Basic Salary + DA) × 15 × Years of Service ÷ 30. The divisor 26 represents working days in a month (excluding 4 Sundays).",
  },
  {
    q: "Is gratuity taxable in India?",
    a: "Gratuity received by government employees is fully tax-exempt. For private sector employees covered under the Gratuity Act, the exemption is the least of: actual gratuity received, ₹20,00,000, or (Last Salary × 15 × Years) ÷ 26. Any amount above ₹20 lakh is taxable as income.",
  },
  {
    q: "What is the minimum service period for gratuity?",
    a: "An employee must complete a minimum of 5 years of continuous service to be eligible for gratuity. However, in case of death or disablement, gratuity is payable regardless of the years of service completed.",
  },
  {
    q: "How are months counted in gratuity calculation?",
    a: "As per the Supreme Court ruling and Gratuity Act, if an employee has served for 6 months or more in the last year, it is rounded up to the next full year. For example, 4 years and 7 months is treated as 5 years.",
  },
  {
    q: "What is the maximum gratuity amount?",
    a: "As per the Payment of Gratuity (Amendment) Act 2018, the maximum gratuity payable is ₹20,00,000 (20 lakhs). Any gratuity beyond this limit is taxable in the hands of the employee.",
  },
  {
    q: "What is the difference between covered and non-covered employees?",
    a: 'Employees working in organisations with 10 or more employees are "covered" under the Gratuity Act and use the ÷26 formula. Employees in smaller organisations are "not covered" and gratuity, if paid, uses the ÷30 formula. Once an organisation crosses 10 employees, the Act applies permanently.',
  },
];

const eligibilityPoints = [
  {
    icon: "✅",
    title: "5 Years Service",
    desc: "Minimum 5 continuous years of employment required (except death/disability).",
  },
  {
    icon: "🏢",
    title: "10+ Employees",
    desc: "Organisation must have 10 or more employees at any point to be covered under the Act.",
  },
  {
    icon: "💼",
    title: "All Employee Types",
    desc: "Covers permanent, temporary, apprentices, and piece-rate workers alike.",
  },
  {
    icon: "📅",
    title: "Triggers",
    desc: "Payable on retirement, resignation, death, disablement, or retrenchment.",
  },
];

const relatedTools = [
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  { name: "PF Calculator", href: "/tools/pf-calculator", icon: Users },
];

export default function GratuityCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Gratuity Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/gratuity-calculator",
            description:
              "Calculate gratuity amount as per the Payment of Gratuity Act 1972 for covered and non-covered employees.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Covered & Non-Covered Employee Calculation",
              "Tax Exemption Status",
              "Service Milestone Table",
              "Formula Breakdown",
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
              Gratuity Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Gratuity Calculator India
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600">
                  As per Gratuity Act
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your gratuity amount as per the Payment of Gratuity
                Act 1972. Supports both covered and non-covered employees, with
                tax exemption status and year-wise milestone table.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GratuityCalculatorClient />
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-gray-50" aria-labelledby="howto-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="howto-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            How to Calculate Gratuity
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                step: "1",
                title: "Select Employee Type",
                desc: "Choose whether your organisation has 10+ employees (covered under Gratuity Act) or fewer (not covered).",
              },
              {
                step: "2",
                title: "Enter Basic Salary",
                desc: "Enter your last drawn basic salary per month. DA (Dearness Allowance) is usually 0 for private sector.",
              },
              {
                step: "3",
                title: "Enter Service Period",
                desc: "Enter total years and months of continuous service. Months ≥ 6 are rounded up automatically.",
              },
              {
                step: "4",
                title: "Get Result",
                desc: "Instantly see gratuity amount, tax exemption status, formula breakdown, and milestone projections.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-card"
              >
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
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

          {/* Formula cards */}
          <h3 className="font-display font-semibold text-lg text-ink-800 mb-4">
            Gratuity Formulas
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zest-500/10 text-zest-500">
                  Covered (÷26)
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-ink-700 mb-3">
                (Basic + DA) × 15 × Years ÷ <strong>26</strong>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                For organisations with 10 or more employees. Divisor 26 =
                average working days per month (excluding Sundays).
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
                  Not Covered (÷30)
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-ink-700 mb-3">
                (Basic + DA) × 15 × Years ÷ <strong>30</strong>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                For smaller organisations not covered under the Act. Ex-gratia
                payments typically follow this formula.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-12 bg-white" aria-labelledby="eligibility-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="eligibility-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Gratuity Eligibility Criteria
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {eligibilityPoints.map((item) => (
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

      {/* Tax exemption table */}
      <section className="py-12 bg-gray-50" aria-labelledby="tax-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="tax-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Gratuity Tax Exemption Limits
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Tax treatment differs based on employee category under the Income
            Tax Act:
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Gratuity tax exemption by employee type"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Employee Category
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Exemption Limit
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    cat: "Government Employees",
                    limit: "Fully Exempt",
                    note: "No upper limit. Entire gratuity is tax-free.",
                    badge: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    cat: "Private (Covered under Act)",
                    limit: "Up to ₹20,00,000",
                    note: "Least of actual, ₹20L, or formula amount.",
                    badge: "bg-blue-50 text-blue-700",
                  },
                  {
                    cat: "Private (Not Covered)",
                    limit: "Up to ₹20,00,000",
                    note: "Least of actual, ₹20L, or half-month salary × years.",
                    badge: "bg-amber-50 text-amber-700",
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={i < 2 ? "border-b border-gray-50" : ""}
                  >
                    <td className="px-5 py-4 text-ink-700 font-medium">
                      {row.cat}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${row.badge}`}
                      >
                        {row.limit}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs hidden sm:table-cell">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
            <span>ℹ️</span>
            The ₹20 lakh exemption limit was revised upward from ₹10 lakh by the
            Payment of Gratuity (Amendment) Act, 2018.
          </p>
        </div>
      </section>

      {/* About the Act */}
      <section className="py-12 bg-white" aria-labelledby="about-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="about-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-4"
          >
            About the Payment of Gratuity Act 1972
          </h2>
          <div className="prose prose-sm max-w-none text-gray-500 leading-relaxed space-y-3">
            <p>
              The Payment of Gratuity Act, 1972 is a central legislation in
              India that makes it mandatory for certain employers to pay
              gratuity to their employees. The Act applies to factories, mines,
              oilfields, plantations, ports, railway companies, shops, and other
              establishments with 10 or more employees.
            </p>
            <p>
              The gratuity amount is calculated based on the last drawn salary
              (Basic + DA) and the number of years of completed service. The "15
              days" factor represents roughly half a month's salary per year,
              and the divisor (26 for covered employees) represents the average
              number of working days in a month.
            </p>
            <p>
              Gratuity must be paid within 30 days from the date it becomes
              payable. If the employer fails to pay within this period, simple
              interest at the rate specified by the government is payable for
              the delay period.
            </p>
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
            calculator provides estimates based on the Payment of Gratuity Act
            1972. Actual gratuity may vary based on your employment contract,
            company policy, and applicable amendments. Consult an HR
            professional or legal advisor for your specific situation.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-pink-300 hover:text-pink-600 hover:shadow-glow-sm transition-all"
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
