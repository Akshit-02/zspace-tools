import type { Metadata } from "next";
import Link from "next/link";
import {
  Receipt,
  ChevronRight,
  Calculator,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import GSTCalculatorClient from "./GSTCalculatorClient";

export const metadata: Metadata = {
  title: "Free GST Calculator India — Calculate GST Online Instantly",
  description:
    "Free online GST calculator for India. Calculate GST inclusive and exclusive amounts for all slabs — 5%, 12%, 18%, 28%. Instant CGST, SGST & IGST breakdown.",
  keywords: [
    "GST calculator",
    "GST calculator India",
    "online GST calculator",
    "CGST SGST calculator",
    "GST percentage calculator",
    "free GST calculator 2024",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/gst-calculator" },
  openGraph: {
    title: "Free GST Calculator India — ZSpace Tools",
    description:
      "Calculate GST in seconds. All slabs, CGST/SGST breakdown, instant results.",
    url: "https://tools.zspace.in/tools/gst-calculator",
  },
};

const gstSlabInfo = [
  {
    slab: "0%",
    examples: "Essential food items, healthcare, education",
    color: "bg-gray-100 text-gray-700",
  },
  {
    slab: "5%",
    examples: "Packaged food, medicines, transport services",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    slab: "12%",
    examples: "Processed food, computers, mobiles",
    color: "bg-blue-50 text-blue-700",
  },
  {
    slab: "18%",
    examples: "Most goods & services, restaurants, IT",
    color: "bg-violet-50 text-violet-700",
  },
  {
    slab: "28%",
    examples: "Luxury goods, vehicles, tobacco, aerated drinks",
    color: "bg-rose-50 text-rose-700",
  },
];

const gstTypes = [
  {
    name: "CGST",
    full: "Central GST",
    desc: "Collected by the Central Government on intra-state (within same state) supply of goods and services.",
    color: "border-violet-100",
    iconColor: "text-violet-500 bg-violet-50",
  },
  {
    name: "SGST",
    full: "State GST",
    desc: "Collected by the State Government on intra-state supply. Always charged alongside CGST at the same rate.",
    color: "border-blue-100",
    iconColor: "text-blue-500 bg-blue-50",
  },
  {
    name: "IGST",
    full: "Integrated GST",
    desc: "Collected by the Central Government on inter-state (between states) supply of goods and services and imports.",
    color: "border-emerald-100",
    iconColor: "text-emerald-500 bg-emerald-50",
  },
  {
    name: "UTGST",
    full: "Union Territory GST",
    desc: "Applicable on supply in Union Territories. Charged in place of SGST for UT transactions.",
    color: "border-orange-100",
    iconColor: "text-orange-500 bg-orange-50",
  },
];

const relatedTools = [
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  {
    name: "Compound Interest",
    href: "/tools/compound-interest",
    icon: TrendingUp,
  },
];

export default function GSTCalculatorPage() {
  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "GST Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/gst-calculator",
            description:
              "Free online GST calculator for India. Calculate GST inclusive/exclusive with CGST, SGST, IGST breakdown.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "GST Exclusive Calculation",
              "GST Inclusive Calculation",
              "CGST SGST IGST Breakdown",
              "All GST Slabs",
            ],
          }),
        }}
      />

      {/* Breadcrumb + Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white pt-28 pb-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
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
            <span className="text-ink-600 font-medium">GST Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Free GST Calculator India
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600">
                  Popular
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Instantly calculate GST on any amount — inclusive or exclusive.
                Get CGST, SGST, and IGST breakdown for all slabs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GSTCalculatorClient />
        </div>
      </section>

      {/* How to use */}
      <section className="py-12 bg-gray-50" aria-labelledby="howto-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="howto-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            How to use the GST Calculator
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Enter the Amount",
                desc: "Type in the price of your goods or services in rupees.",
              },
              {
                step: "2",
                title: "Select GST Slab",
                desc: "Choose the applicable GST rate — 0%, 5%, 12%, 18%, or 28%. Or enter a custom rate.",
              },
              {
                step: "3",
                title: "Choose Price Type",
                desc: "Select whether your amount is exclusive of GST (price before tax) or inclusive of GST (price after tax).",
              },
              {
                step: "4",
                title: "Get Instant Results",
                desc: "The calculator automatically shows you the GST amount, CGST, SGST, and the total.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-card"
              >
                <div className="w-8 h-8 rounded-full bg-zest-500 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
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

      {/* GST Slabs */}
      <section className="py-12 bg-white" aria-labelledby="slabs-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="slabs-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            GST Slabs in India
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            As per the GST regime, goods and services are taxed under the
            following slabs:
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="GST slabs in India"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    GST Rate
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Common Examples
                  </th>
                </tr>
              </thead>
              <tbody>
                {gstSlabInfo.map((row, i) => (
                  <tr
                    key={row.slab}
                    className={
                      i < gstSlabInfo.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }
                  >
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-display font-bold ${row.color}`}
                      >
                        {row.slab}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{row.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Types of GST */}
      <section className="py-12 bg-gray-50" aria-labelledby="types-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="types-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Types of GST in India
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {gstTypes.map((type) => (
              <div
                key={type.name}
                className={`bg-white rounded-2xl border ${type.color} p-5 shadow-card`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-display font-extrabold ${type.iconColor}`}
                  >
                    {type.name}
                  </div>
                  <div>
                    <div className="font-display font-bold text-ink-800 text-sm">
                      {type.name}
                    </div>
                    <div className="text-xs text-gray-400">{type.full}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {type.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About GST */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-4">
            About GST — Goods and Services Tax
          </h2>
          <div className="prose prose-sm max-w-none text-gray-500 leading-relaxed space-y-3">
            <p>
              The Goods and Services Tax (GST) is an indirect tax introduced in
              India on 1st July 2017. It replaced multiple cascading taxes
              including central excise duty, service tax, VAT, and others —
              bringing a unified, simplified tax structure to the country.
            </p>
            <p>
              GST is a destination-based tax, meaning it is collected at the
              point of consumption, not production. It is levied at every stage
              of the supply chain, but the tax paid at each stage is available
              as input tax credit, effectively eliminating the cascade effect.
            </p>
            <p>
              For businesses, GST applies to all goods and services supplied
              within India, subject to the applicable slab. Certain essential
              goods and services are exempt from GST (0% slab), while luxury
              items attract the highest 28% slab, sometimes with an additional
              cess.
            </p>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-zest-500/30 hover:text-zest-500 hover:shadow-glow-sm transition-all"
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
