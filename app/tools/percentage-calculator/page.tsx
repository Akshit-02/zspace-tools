import type { Metadata } from "next";
import Link from "next/link";
import {
  Percent,
  ChevronRight,
  Receipt,
  Calculator,
  TrendingUp,
} from "lucide-react";
import PercentageCalculatorClient from "./PercentageCalculatorClient";

export const metadata: Metadata = {
  title: "Free Percentage Calculator — All Percentage Formulas Online",
  description:
    "Calculate percentages instantly — find X% of Y, percentage change, add/subtract %, ratio to percentage, and more. 8 percentage calculators in one free tool.",
  keywords: [
    "percentage calculator",
    "percentage calculator online",
    "percent of a number",
    "percentage change calculator",
    "discount calculator",
    "percentage increase decrease",
    "ratio to percentage",
    "percentage formula",
  ],
  alternates: {
    canonical: "https://tools.zspace.in/tools/percentage-calculator",
  },
  openGraph: {
    title: "Free Percentage Calculator — ZSpace Tools",
    description:
      "8 percentage calculators in one — % of, % change, add/subtract %, ratio, and more.",
    url: "https://tools.zspace.in/tools/percentage-calculator",
  },
};

const faqs = [
  {
    q: "How do I calculate what percentage X is of Y?",
    a: "Divide X by Y and multiply by 100. Formula: (X ÷ Y) × 100. For example, 25 is what % of 200? → (25 ÷ 200) × 100 = 12.5%.",
  },
  {
    q: "How do I calculate percentage change?",
    a: "Subtract the old value from the new value, divide by the old value, and multiply by 100. Formula: ((New − Old) ÷ Old) × 100. A positive result is an increase; negative is a decrease.",
  },
  {
    q: "How do I add a percentage to a number?",
    a: "Multiply the number by (1 + percentage/100). For example, to add 18% GST to ₹1,000: 1000 × 1.18 = ₹1,180.",
  },
  {
    q: "How do I find the original price after a discount?",
    a: "Divide the discounted price by (1 − discount%/100). For example, if a product costs ₹800 after a 20% discount, the original price is 800 ÷ 0.8 = ₹1,000.",
  },
  {
    q: "What is percentage and how is it used in daily life?",
    a: "Percentage is a way of expressing a number as a fraction of 100. It is used in taxes (GST, income tax), discounts, interest rates, exam scores, profit/loss calculations, and many other everyday situations.",
  },
];

const useCases = [
  {
    icon: "🛒",
    title: "Discounts",
    desc: "Calculate final price after 10%, 20%, or 50% off on products.",
  },
  {
    icon: "🧾",
    title: "GST & Taxes",
    desc: "Add or subtract GST (5%, 12%, 18%, 28%) from any amount.",
  },
  {
    icon: "📊",
    title: "Profit & Loss",
    desc: "Find % profit or loss on buying and selling price.",
  },
  {
    icon: "🎓",
    title: "Exam Scores",
    desc: "Convert marks to percentage and check grade.",
  },
  {
    icon: "📈",
    title: "Stock Returns",
    desc: "Calculate % gain or loss on your investments.",
  },
  {
    icon: "🏦",
    title: "Interest Rates",
    desc: "Find how much interest you earn or pay as a percentage.",
  },
  {
    icon: "💰",
    title: "Salary Hike",
    desc: "Calculate new salary after a % increment.",
  },
  {
    icon: "🏷️",
    title: "Markup Pricing",
    desc: "Find selling price after adding a % markup on cost.",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Receipt },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  {
    name: "Compound Interest",
    href: "/tools/compound-interest",
    icon: TrendingUp,
  },
  {
    name: "Profit Margin Calculator",
    href: "/tools/profit-margin",
    icon: Percent,
  },
];

export default function PercentageCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Percentage Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/percentage-calculator",
            description:
              "8-in-1 free percentage calculator for all common percentage problems.",
            applicationCategory: "UtilityApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "X% of Y",
              "X is what % of Y",
              "Percentage Change",
              "Add Percentage",
              "Subtract Percentage",
              "Find Original Value",
              "Ratio to Percentage",
              "Split by Percentage",
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
              Percentage Calculator
            </span>
          </nav>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Percentage Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600">
                  8-in-1
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Solve any percentage problem instantly — from finding X% of a
                number to calculating percentage change, discounts, original
                values, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PercentageCalculatorClient />
        </div>
      </section>

      {/* Common Use Cases */}
      <section className="py-12 bg-gray-50" aria-labelledby="usecases-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="usecases-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Common Uses of Percentage Calculations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card text-center"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-display font-semibold text-ink-800 text-sm mb-1">
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

      {/* Formulas reference */}
      <section className="py-12 bg-white" aria-labelledby="formulas-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formulas-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Percentage Formulas Reference
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "P% of N",
                formula: "(P ÷ 100) × N",
                example: "18% of 50,000 = 9,000",
              },
              {
                title: "X is what % of Y",
                formula: "(X ÷ Y) × 100",
                example: "25 is 12.5% of 200",
              },
              {
                title: "% Increase",
                formula: "((New − Old) ÷ Old) × 100",
                example: "1000 → 1200 = +20%",
              },
              {
                title: "% Decrease",
                formula: "((Old − New) ÷ Old) × 100",
                example: "1000 → 800 = −20%",
              },
              {
                title: "Add X% to Y",
                formula: "Y × (1 + X/100)",
                example: "1000 + 18% = 1180",
              },
              {
                title: "Subtract X% from Y",
                formula: "Y × (1 − X/100)",
                example: "1000 − 20% = 800",
              },
              {
                title: "Original before %",
                formula: "Result ÷ (1 + X/100)",
                example: "1180 before +18% = 1000",
              },
              {
                title: "Ratio as %",
                formula: "(Part ÷ Whole) × 100",
                example: "45/60 = 75%",
              },
            ].map((row) => (
              <div
                key={row.title}
                className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 px-5 py-3.5"
              >
                <span className="font-display font-semibold text-ink-800 text-sm w-44 flex-shrink-0">
                  {row.title}
                </span>
                <code className="font-mono text-xs text-zest-500 bg-zest-500/5 px-2.5 py-1 rounded-lg flex-1">
                  {row.formula}
                </code>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {row.example}
                </span>
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
