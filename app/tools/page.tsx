import type { Metadata } from "next";
import {
  Receipt,
  IndianRupee,
  Calculator,
  TrendingUp,
  Percent,
  BarChart2,
  FileText,
  Scale,
  Activity,
  PiggyBank,
  Briefcase,
  Hash,
  Users,
} from "lucide-react";
import ToolCard from "../components/ToolCard";

export const metadata: Metadata = {
  title: "All Free Online Tools — ZSpace Tools",
  description:
    "Browse 50+ free online tools for GST, income tax, EMI, profit margins, word count, and more. No sign-up required. Instant results.",
  alternates: { canonical: "https://tools.zspace.in/tools" },
};

const tools = [
  // Finance & Tax
  {
    category: "Finance & Tax",
    name: "GST Calculator",
    description:
      "Calculate GST inclusive/exclusive with CGST, SGST, IGST breakdown for all slabs.",
    href: "/tools/gst-calculator",
    icon: Receipt,
    popular: true,
    accentColor: "text-violet-500 bg-violet-50",
  },
  {
    category: "Finance & Tax",
    name: "Income Tax Calculator",
    description:
      "Estimate income tax liability under old and new regime for FY 2024-25.",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
    badge: "Updated",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    accentColor: "text-emerald-500 bg-emerald-50",
  },
  {
    category: "Finance & Tax",
    name: "HRA Calculator",
    description:
      "Calculate your House Rent Allowance exemption for tax saving.",
    href: "/tools/hra-calculator",
    icon: IndianRupee,
    accentColor: "text-blue-500 bg-blue-50",
  },
  {
    category: "Finance & Tax",
    name: "Compound Interest",
    description:
      "Calculate compound interest with monthly, quarterly, and annual compounding.",
    href: "/tools/compound-interest",
    icon: TrendingUp,
    accentColor: "text-rose-500 bg-rose-50",
  },
  // Loan & EMI
  {
    category: "Loan & EMI",
    name: "EMI Calculator",
    description:
      "Calculate monthly EMI for home, car, or personal loans with amortisation schedule.",
    href: "/tools/emi-calculator",
    icon: Calculator,
    popular: true,
    accentColor: "text-blue-500 bg-blue-50",
  },
  {
    category: "Loan & EMI",
    name: "Home Loan EMI",
    description:
      "Specialised home loan EMI calculator with tax benefit analysis.",
    href: "/tools/home-loan-emi",
    icon: PiggyBank,
    accentColor: "text-teal-500 bg-teal-50",
  },
  // Business
  {
    category: "Business",
    name: "Profit Margin",
    description:
      "Calculate gross, operating, and net profit margins instantly.",
    href: "/tools/profit-margin",
    icon: BarChart2,
    accentColor: "text-orange-500 bg-orange-50",
  },
  {
    category: "Business",
    name: "Markup Calculator",
    description:
      "Calculate selling price from cost and desired markup percentage.",
    href: "/tools/markup-calculator",
    icon: Percent,
    accentColor: "text-amber-500 bg-amber-50",
  },
  {
    category: "Business",
    name: "Break-even Calculator",
    description: "Find your break-even point in units and revenue.",
    href: "/tools/break-even",
    icon: BarChart2,
    accentColor: "text-lime-600 bg-lime-50",
  },
  {
    category: "Business",
    name: "ROI Calculator",
    description:
      "Calculate return on investment and annualised ROI for any investment.",
    href: "/tools/roi-calculator",
    icon: TrendingUp,
    accentColor: "text-cyan-500 bg-cyan-50",
  },
  // Payroll
  {
    category: "Payroll & HR",
    name: "Gratuity Calculator",
    description:
      "Calculate gratuity amount for employees as per the Gratuity Act.",
    href: "/tools/gratuity-calculator",
    icon: Users,
    accentColor: "text-pink-500 bg-pink-50",
  },
  {
    category: "Payroll & HR",
    name: "PF Calculator",
    description:
      "Calculate EPF (Employee Provident Fund) contributions and maturity.",
    href: "/tools/pf-calculator",
    icon: Briefcase,
    accentColor: "text-indigo-500 bg-indigo-50",
  },
  // Utility
  {
    category: "Utility",
    name: "Percentage Calculator",
    description:
      "Solve all percentage problems — of, increase, decrease, and comparison.",
    href: "/tools/percentage-calculator",
    icon: Percent,
    accentColor: "text-pink-500 bg-pink-50",
  },
  {
    category: "Utility",
    name: "Word Counter",
    description:
      "Count words, characters, sentences, and estimate reading time.",
    href: "/tools/word-counter",
    icon: FileText,
    accentColor: "text-sky-500 bg-sky-50",
  },
  {
    category: "Utility",
    name: "Unit Converter",
    description:
      "Convert between all units — length, weight, area, temperature.",
    href: "/tools/unit-converter",
    icon: Scale,
    accentColor: "text-violet-500 bg-violet-50",
  },
  {
    category: "Utility",
    name: "Age Calculator",
    description:
      "Calculate exact age in years, months, and days from date of birth.",
    href: "/tools/age-calculator",
    icon: Hash,
    accentColor: "text-teal-500 bg-teal-50",
  },
  // Health
  {
    category: "Health",
    name: "BMI Calculator",
    description:
      "Calculate Body Mass Index with healthy weight range for your height.",
    href: "/tools/bmi-calculator",
    icon: Activity,
    accentColor: "text-green-500 bg-green-50",
  },
];

const categories = [
  "All",
  "Finance & Tax",
  "Loan & EMI",
  "Business",
  "Payroll & HR",
  "Utility",
  "Health",
];

export default function ToolsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gray-50 pt-28 pb-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-tag mb-4">All Tools</span>
          <h1 className="font-display font-extrabold text-3xl lg:text-4xl text-ink-800 mb-3">
            50+ Free Online Tools
          </h1>
          <p className="text-gray-500 max-w-xl">
            Every tool is free, instant, and requires no sign-up. Built for
            Indian businesses, professionals, and individuals.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-display font-medium transition-all
                  bg-gray-100 text-ink-600 hover:bg-gray-200 first:bg-ink-800 first:text-white"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.slice(1).map((category) => {
            const catTools = tools.filter((t) => t.category === category);
            if (!catTools.length) return null;
            return (
              <div key={category} className="mb-12">
                <h2 className="font-display font-bold text-lg text-ink-800 mb-5 flex items-center gap-3">
                  {category}
                  <span className="text-xs font-medium text-gray-400 font-body">
                    {catTools.length} tools
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catTools.map((tool) => (
                    <ToolCard key={tool.href} {...tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
