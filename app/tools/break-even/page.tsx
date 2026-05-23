import type { Metadata } from "next";
import Link from "next/link";
import { BarChart2, ChevronRight, TrendingUp, IndianRupee } from "lucide-react";
import BreakEvenCalculatorClient from "./BreakEvenCalculatorClient";

export const metadata: Metadata = {
  title: "Free Break-Even Calculator — Find Your Break-Even Point Online",
  description:
    "Calculate your break-even point in units and revenue. Enter fixed costs, variable cost per unit, and selling price to find when your business becomes profitable.",
  keywords: [
    "break even calculator",
    "break-even point calculator",
    "break even analysis",
    "BEP calculator",
    "break even units calculator",
    "contribution margin calculator",
    "margin of safety calculator",
    "business break even calculator India",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/break-even" },
  openGraph: {
    title: "Free Break-Even Calculator — ZSpace Tools",
    description:
      "Find your break-even point in units and revenue. Includes contribution margin, margin of safety, and profit scenario table.",
    url: "https://tools.zspace.in/tools/break-even",
  },
};

const faqs = [
  {
    q: "What is the break-even point?",
    a: "The break-even point (BEP) is the level of sales at which total revenue equals total costs, resulting in zero profit or loss. Below the BEP, a business makes a loss; above it, a business makes a profit. It is a critical metric for pricing, budgeting, and feasibility analysis.",
  },
  {
    q: "What is the break-even formula?",
    a: "Break-Even Units = Fixed Costs ÷ Contribution Margin Per Unit, where Contribution Margin = Selling Price − Variable Cost per unit. Break-Even Revenue = Break-Even Units × Selling Price. Alternatively, Break-Even Revenue = Fixed Costs ÷ Contribution Margin Ratio.",
  },
  {
    q: "What is contribution margin?",
    a: 'Contribution margin is the selling price minus variable cost per unit. It represents how much each unit sold "contributes" toward covering fixed costs and generating profit. A higher contribution margin means fewer units are needed to break even.',
  },
  {
    q: "What is margin of safety?",
    a: "Margin of safety is the difference between actual or projected sales and the break-even sales. It shows by how much sales can fall before the business starts making a loss. Expressed as a percentage: (Sales − BEP Sales) ÷ Sales × 100. A higher margin of safety is better.",
  },
  {
    q: "What are fixed costs vs variable costs?",
    a: "Fixed costs remain constant regardless of production volume — examples include rent, salaries, insurance, and loan EMIs. Variable costs change in proportion to production — examples include raw materials, packaging, sales commission, and direct labour per unit.",
  },
  {
    q: "How is break-even analysis used in business decisions?",
    a: "Break-even analysis helps businesses set minimum pricing, evaluate new products, plan production volumes, assess risk before launching, decide whether to accept a bulk order at a discount, and determine how much sales growth is needed to justify a cost increase.",
  },
];

const costExamples = [
  {
    category: "Fixed Costs",
    icon: "🏢",
    color: "border-blue-100 bg-blue-50",
    titleColor: "text-blue-700",
    items: [
      "Office / factory rent",
      "Employee salaries",
      "Insurance premiums",
      "Loan EMIs",
      "Software subscriptions",
      "Depreciation on equipment",
    ],
  },
  {
    category: "Variable Costs",
    icon: "📦",
    color: "border-emerald-100 bg-emerald-50",
    titleColor: "text-emerald-700",
    items: [
      "Raw materials",
      "Packaging per unit",
      "Sales commission",
      "Direct labour per unit",
      "Shipping per order",
      "Payment gateway fees",
    ],
  },
];

const relatedTools = [
  {
    name: "Profit Margin Calculator",
    href: "/tools/profit-margin",
    icon: BarChart2,
  },
  { name: "ROI Calculator", href: "/tools/roi-calculator", icon: TrendingUp },
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: IndianRupee },
];

export default function BreakEvenCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Break-Even Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/break-even",
            description:
              "Calculate business break-even point in units and revenue with contribution margin, margin of safety, and profit scenario table.",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Break-Even Units",
              "Break-Even Revenue",
              "Contribution Margin",
              "Margin of Safety",
              "Target Profit Units",
              "Profit/Loss Scenario Table",
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
              Break-Even Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Break-Even Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-700">
                  With Scenario Table
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Find your break-even point in units and revenue. Calculate
                contribution margin, margin of safety, and units required for
                your target profit — all instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreakEvenCalculatorClient />
        </div>
      </section>

      {/* Formula section */}
      <section className="py-12 bg-gray-50" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Break-Even Formulas Explained
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              {
                title: "Break-Even Units",
                formula: "Fixed Costs ÷ Contribution Margin",
                note: "Number of units you must sell to cover all costs.",
                color: "border-amber-100",
                tag: "bg-amber-50 text-amber-700",
              },
              {
                title: "Break-Even Revenue",
                formula: "Fixed Costs ÷ CM Ratio",
                note: "Total revenue needed to cover all fixed and variable costs.",
                color: "border-zest-100",
                tag: "bg-zest-50 text-zest-700",
              },
              {
                title: "Contribution Margin",
                formula: "Selling Price − Variable Cost per Unit",
                note: "How much each unit sold contributes toward fixed costs and profit.",
                color: "border-blue-100",
                tag: "bg-blue-50 text-blue-700",
              },
              {
                title: "Margin of Safety",
                formula: "(Sales − BEP Sales) ÷ Sales × 100",
                note: "How much sales can drop before you start making a loss.",
                color: "border-emerald-100",
                tag: "bg-emerald-50 text-emerald-700",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`bg-white rounded-2xl border p-5 shadow-card ${item.color}`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${item.tag}`}
                >
                  {item.title}
                </span>
                <div className="bg-gray-50 rounded-xl px-3 py-2 font-mono text-sm text-ink-700 my-3">
                  {item.formula}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.note}
                </p>
              </div>
            ))}
          </div>

          {/* Step by step */}
          <h3 className="font-display font-bold text-lg text-ink-800 mb-4">
            How to Use the Calculator
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Fixed Costs",
                desc: "Enter total periodic fixed costs — rent, salaries, and overheads that don't change.",
              },
              {
                step: "2",
                title: "Selling Price",
                desc: "Enter your selling price per unit or per customer transaction.",
              },
              {
                step: "3",
                title: "Variable Cost",
                desc: "Enter cost per unit — materials, labour, packaging, commission.",
              },
              {
                step: "4",
                title: "Target Profit",
                desc: "Set your desired profit goal to see how many units you need beyond BEP.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-3 shadow-card"
              >
                <div className="w-7 h-7 rounded-full bg-lime-500 text-white font-display font-bold text-xs flex items-center justify-center flex-shrink-0">
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

      {/* Fixed vs Variable costs */}
      <section className="py-12 bg-white" aria-labelledby="costs-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="costs-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Fixed Costs vs Variable Costs
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {costExamples.map((cat) => (
              <div
                key={cat.category}
                className={`rounded-2xl border p-5 shadow-card ${cat.color}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3
                    className={`font-display font-bold text-base ${cat.titleColor}`}
                  >
                    {cat.category}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.titleColor.replace("text-", "bg-")}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-12 bg-gray-50" aria-labelledby="uses-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="uses-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            When to Use Break-Even Analysis
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "🚀",
                title: "Launching a New Product",
                desc: "Understand the minimum sales needed before investing in production or marketing.",
              },
              {
                icon: "💰",
                title: "Setting Price Points",
                desc: "Evaluate whether your current pricing covers all costs at realistic sales volumes.",
              },
              {
                icon: "📉",
                title: "Cost Reduction Decisions",
                desc: "See how much your BEP drops when you reduce fixed or variable costs.",
              },
              {
                icon: "🏭",
                title: "Expansion Planning",
                desc: "Before adding capacity, calculate the additional sales needed to cover new fixed costs.",
              },
              {
                icon: "🤝",
                title: "Bulk Order Pricing",
                desc: "Determine the minimum discount you can offer on bulk orders while still covering costs.",
              },
              {
                icon: "📊",
                title: "Investor Presentations",
                desc: "Show investors when your business will become profitable at different sales scenarios.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
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
            calculator provides estimates based on the inputs entered. Actual
            break-even points may differ due to product mix, seasonal
            variations, credit terms, and other business-specific factors.
            Consult a chartered accountant or business advisor for detailed
            financial planning.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-lime-300 hover:text-lime-700 hover:shadow-glow-sm transition-all"
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
