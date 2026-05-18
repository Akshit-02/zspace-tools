import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChevronRight, Calculator, IndianRupee } from "lucide-react";
import BMICalculatorClient from "./BMICalculatorClient";

export const metadata: Metadata = {
  title: "Free BMI Calculator — Body Mass Index Calculator Online",
  description:
    "Calculate your Body Mass Index (BMI) instantly. Supports metric (kg/cm) and imperial (lb/ft). Get your BMI category, healthy weight range, and personalised tips.",
  keywords: [
    "BMI calculator",
    "body mass index calculator",
    "BMI calculator India",
    "healthy weight calculator",
    "BMI chart",
    "BMI calculator kg cm",
    "online BMI calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/bmi-calculator" },
  openGraph: {
    title: "Free BMI Calculator — ZSpace Tools",
    description:
      "Calculate your BMI and healthy weight range. Metric & imperial supported.",
    url: "https://tools.zspace.in/tools/bmi-calculator",
  },
};

const bmiCategories = [
  {
    range: "Below 18.5",
    label: "Underweight",
    color: "bg-blue-50 border-blue-100 text-blue-700",
  },
  {
    range: "18.5 – 24.9",
    label: "Normal weight",
    color: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  {
    range: "25 – 29.9",
    label: "Overweight",
    color: "bg-amber-50 border-amber-100 text-amber-700",
  },
  {
    range: "30 – 34.9",
    label: "Obese (Class I)",
    color: "bg-orange-50 border-orange-100 text-orange-700",
  },
  {
    range: "35 – 39.9",
    label: "Obese (Class II)",
    color: "bg-rose-50 border-rose-100 text-rose-700",
  },
  {
    range: "40 and above",
    label: "Obese (Class III)",
    color: "bg-red-50 border-red-100 text-red-700",
  },
];

const faqs = [
  {
    q: "What is BMI and how is it calculated?",
    a: "BMI (Body Mass Index) is a value derived from a person's weight and height. It is calculated by dividing weight in kilograms by the square of height in metres: BMI = kg/m². It is used as a screening tool for weight categories.",
  },
  {
    q: "Is BMI an accurate measure of body fat?",
    a: "BMI is a useful screening tool but not a diagnostic measure. It does not account for muscle mass, bone density, or fat distribution. Athletes may have a high BMI without excess body fat. Consult a doctor for a complete health assessment.",
  },
  {
    q: "What is a healthy BMI for Indians?",
    a: "The WHO standard uses 18.5–24.9 as normal. However, some studies suggest that for South Asians (including Indians), a BMI above 23 may indicate increased health risks. Consult a healthcare provider for personalised advice.",
  },
  {
    q: "Does BMI differ for men and women?",
    a: "Standard BMI ranges are the same for adult men and women. However, women naturally have more body fat than men at the same BMI. Body fat percentage measurements can give a more accurate picture for each gender.",
  },
  {
    q: "What is the BMI for children?",
    a: "BMI for children (2–19 years) is interpreted differently using age and gender-specific percentile charts. A standard adult BMI calculator is not appropriate for children. Consult a paediatrician for children's weight assessment.",
  },
];

const relatedTools = [
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  {
    name: "Income Tax Calculator",
    href: "/tools/income-tax-calculator",
    icon: IndianRupee,
  },
  { name: "Age Calculator", href: "/tools/age-calculator", icon: Activity },
];

export default function BMICalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "BMI Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/bmi-calculator",
            description:
              "Free online BMI calculator with category, healthy weight range, and tips.",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Metric & Imperial",
              "BMI Category",
              "Healthy Weight Range",
              "Gender & Age Input",
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
            <span className="text-ink-600 font-medium">BMI Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  BMI Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                  Metric & Imperial
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your Body Mass Index instantly. Get your BMI category,
                healthy weight range, and personalised health tips. Supports
                both metric and imperial units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BMICalculatorClient />
        </div>
      </section>

      {/* BMI Formula */}
      <section className="py-12 bg-gray-50" aria-labelledby="formula-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="formula-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-4"
          >
            How is BMI Calculated?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            BMI uses a simple formula based on your height and weight:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-ink-900 rounded-2xl p-6 text-center">
              <p className="font-mono text-white/40 text-xs uppercase tracking-widest mb-3">
                Metric
              </p>
              <p className="font-mono text-white text-lg font-medium">
                BMI = kg ÷ m²
              </p>
              <p className="text-white/30 text-xs mt-2">
                Weight (kg) ÷ Height² (metres)
              </p>
            </div>
            <div className="bg-ink-900 rounded-2xl p-6 text-center">
              <p className="font-mono text-white/40 text-xs uppercase tracking-widest mb-3">
                Imperial
              </p>
              <p className="font-mono text-white text-lg font-medium">
                BMI = (lb ÷ in²) × 703
              </p>
              <p className="text-white/30 text-xs mt-2">
                Weight (lb) ÷ Height² (inches) × 703
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Measure Height",
                desc: "Stand straight against a wall and measure from floor to the top of your head.",
              },
              {
                step: "2",
                title: "Measure Weight",
                desc: "Use a calibrated scale in the morning, before eating, for the most accurate reading.",
              },
              {
                step: "3",
                title: "Calculate BMI",
                desc: "Enter your values above. Our calculator instantly gives you your BMI and category.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 shadow-card"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink-800 mb-1 text-sm">
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

      {/* BMI Chart */}
      <section className="py-12 bg-white" aria-labelledby="chart-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="chart-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            BMI Categories (WHO Standard)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The World Health Organisation defines the following BMI ranges for
            adults 20 years and older:
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="BMI categories"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    BMI Range
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Category
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Health Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    range: "Below 18.5",
                    label: "Underweight",
                    risk: "Moderate",
                    color: "bg-blue-50 border-blue-100 text-blue-700",
                  },
                  {
                    range: "18.5 – 24.9",
                    label: "Normal weight",
                    risk: "Low",
                    color: "bg-emerald-50 border-emerald-100 text-emerald-700",
                  },
                  {
                    range: "25.0 – 29.9",
                    label: "Overweight",
                    risk: "Increased",
                    color: "bg-amber-50 border-amber-100 text-amber-700",
                  },
                  {
                    range: "30.0 – 34.9",
                    label: "Obese (Class I)",
                    risk: "High",
                    color: "bg-orange-50 border-orange-100 text-orange-700",
                  },
                  {
                    range: "35.0 – 39.9",
                    label: "Obese (Class II)",
                    risk: "Very High",
                    color: "bg-rose-50 border-rose-100 text-rose-700",
                  },
                  {
                    range: "40.0+",
                    label: "Obese (Class III)",
                    risk: "Extremely High",
                    color: "bg-red-50 border-red-100 text-red-700",
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={i < 5 ? "border-b border-gray-50" : ""}
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-ink-700">
                      {row.range}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${row.color}`}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm hidden sm:table-cell">
                      {row.risk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-12 bg-gray-50" aria-labelledby="limits-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="limits-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Limitations of BMI
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "💪",
                title: "Doesn't Measure Fat",
                desc: "BMI can't distinguish between muscle and fat. Muscular athletes may have high BMI despite low body fat.",
              },
              {
                icon: "👴",
                title: "Age Not Considered",
                desc: "Older adults tend to have more body fat at the same BMI. A lower BMI may still carry risks for elderly individuals.",
              },
              {
                icon: "🌍",
                title: "Ethnicity Differences",
                desc: "South Asians may face health risks at lower BMI thresholds (23+) compared to Western populations.",
              },
              {
                icon: "🤰",
                title: "Not for Pregnant Women",
                desc: "BMI is not applicable during pregnancy. Consult your doctor for appropriate weight gain guidance during pregnancy.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card"
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
            <strong className="font-semibold">Medical Disclaimer:</strong> This
            BMI calculator is for informational purposes only and does not
            constitute medical advice. BMI is a screening tool, not a diagnostic
            measure. Please consult a qualified healthcare professional for a
            complete health assessment and personalised advice.
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-green-300 hover:text-green-600 hover:shadow-glow-sm transition-all"
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
