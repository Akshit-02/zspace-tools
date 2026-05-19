import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ChevronRight, Calculator, FileText } from "lucide-react";
import UnitConverterClient from "./UnitConverterClient";

export const metadata: Metadata = {
  title: "Free Unit Converter — Length, Weight, Temperature, Area & More",
  description:
    "Free online unit converter for length, weight, temperature, area, volume, speed, time, data, pressure, and energy. Instant conversions with all units in one place.",
  keywords: [
    "unit converter",
    "unit converter online",
    "length converter",
    "weight converter",
    "temperature converter",
    "area converter",
    "volume converter",
    "speed converter",
    "metric converter",
    "unit conversion calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/unit-converter" },
  openGraph: {
    title: "Free Unit Converter — ZSpace Tools",
    description:
      "Convert length, weight, temperature, area, volume, speed, time, and more instantly.",
    url: "https://tools.zspace.in/tools/unit-converter",
  },
};

const categories = [
  {
    icon: "📏",
    name: "Length",
    desc: "mm, cm, m, km, inch, foot, yard, mile, nautical mile",
  },
  {
    icon: "⚖️",
    name: "Weight",
    desc: "mg, g, kg, tonne, oz, lb, stone, quintal",
  },
  { icon: "🌡️", name: "Temperature", desc: "Celsius, Fahrenheit, Kelvin" },
  {
    icon: "📐",
    name: "Area",
    desc: "m², km², hectare, acre, bigha, sq ft, sq inch",
  },
  {
    icon: "🧪",
    name: "Volume",
    desc: "ml, litre, m³, tsp, tbsp, cup, pint, gallon",
  },
  { icon: "💨", name: "Speed", desc: "m/s, km/h, mph, knot, mach" },
  {
    icon: "⏱️",
    name: "Time",
    desc: "ms, sec, min, hour, day, week, month, year",
  },
  { icon: "💾", name: "Data", desc: "bit, byte, KB, MB, GB, TB, PB" },
  { icon: "🔵", name: "Pressure", desc: "Pa, kPa, bar, atm, PSI, mmHg" },
  { icon: "⚡", name: "Energy", desc: "J, kJ, cal, kcal, Wh, kWh, BTU" },
];

const faqs = [
  {
    q: "How does the unit converter work?",
    a: "All unit conversions are done using precise conversion factors. Each unit is first converted to a base unit (e.g. metres for length, kilograms for weight), then converted to the target unit. Temperature is handled separately using the standard formulas.",
  },
  {
    q: "How do I convert Celsius to Fahrenheit?",
    a: "Use the formula: °F = (°C × 9/5) + 32. For example, 100°C = (100 × 9/5) + 32 = 212°F. You can also just use the Temperature tab in our converter above.",
  },
  {
    q: "What is a bigha in square metres?",
    a: "A bigha is a traditional Indian land measurement unit. Its size varies by state, but our converter uses 1 bigha = 1,337.8 m², which is the commonly used standard in northern India.",
  },
  {
    q: "How many kilometres in a mile?",
    a: "1 mile = 1.60934 kilometres. Conversely, 1 kilometre = 0.62137 miles.",
  },
  {
    q: "What is the difference between KB and KiB?",
    a: "1 KB (Kilobyte) = 1,000 bytes in the SI standard. 1 KiB (Kibibyte) = 1,024 bytes in the binary standard. Most operating systems use 1 KB = 1,024 bytes historically, but the SI definition is 1,000 bytes.",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Calculator },
  { name: "Word Counter", href: "/tools/word-counter", icon: FileText },
  { name: "BMI Calculator", href: "/tools/bmi-calculator", icon: Scale },
];

export default function UnitConverterPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Unit Converter — ZSpace Tools",
            url: "https://tools.zspace.in/tools/unit-converter",
            description:
              "Free online unit converter for 10 categories including length, weight, temperature, area, volume, speed, time, data, pressure, and energy.",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Length Converter",
              "Weight Converter",
              "Temperature Converter",
              "Area Converter",
              "Volume Converter",
              "Speed Converter",
              "Time Converter",
              "Data Storage Converter",
              "Pressure Converter",
              "Energy Converter",
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
            <span className="text-ink-600 font-medium">Unit Converter</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Free Unit Converter
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
                  10 Categories
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Convert between all common units — length, weight, temperature,
                area, volume, speed, time, data, pressure, and energy. All
                conversions are instant and accurate.
              </p>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs text-gray-500 shadow-sm"
              >
                <span>{cat.icon}</span>
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Converter */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UnitConverterClient />
        </div>
      </section>

      {/* All categories reference */}
      <section
        className="py-12 bg-gray-50"
        aria-labelledby="categories-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="categories-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            All Supported Unit Categories
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="font-display font-semibold text-ink-800">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion tips */}
      <section className="py-12 bg-white" aria-labelledby="tips-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="tips-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Handy Conversion Facts to Remember
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { fact: "1 km = 0.621 miles", sub: "Length" },
              { fact: "1 kg = 2.205 pounds", sub: "Weight" },
              { fact: "0°C = 32°F = 273.15K", sub: "Temperature" },
              { fact: "1 litre = 0.264 US gallons", sub: "Volume" },
              { fact: "1 acre = 0.405 hectares", sub: "Area" },
              { fact: "1 GB = 1,024 MB", sub: "Data" },
              { fact: "1 atm = 14.696 PSI", sub: "Pressure" },
              { fact: "1 kcal = 4,184 joules", sub: "Energy" },
              { fact: "1 knot = 1.852 km/h", sub: "Speed" },
            ].map((item) => (
              <div
                key={item.fact}
                className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3"
              >
                <span className="font-mono text-sm font-medium text-ink-700">
                  {item.fact}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 flex-shrink-0">
                  {item.sub}
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-violet-300 hover:text-violet-600 hover:shadow-glow-sm transition-all"
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
