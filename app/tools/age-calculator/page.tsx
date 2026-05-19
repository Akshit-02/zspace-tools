import type { Metadata } from "next";
import Link from "next/link";
import { Hash, ChevronRight, Calculator, Scale } from "lucide-react";
import AgeCalculatorClient from "./AgeCalculatorClient";

export const metadata: Metadata = {
  title: "Free Age Calculator — Calculate Exact Age in Years, Months & Days",
  description:
    "Calculate your exact age in years, months, days, hours, and minutes. Find your next birthday countdown, zodiac sign, life milestones, and more. 100% free.",
  keywords: [
    "age calculator",
    "age calculator online",
    "date of birth calculator",
    "exact age calculator",
    "birthday calculator",
    "how old am I",
    "age in days calculator",
    "next birthday calculator",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/age-calculator" },
  openGraph: {
    title: "Free Age Calculator — ZSpace Tools",
    description:
      "Calculate your exact age and find your next birthday, zodiac sign, and life milestones.",
    url: "https://tools.zspace.in/tools/age-calculator",
  },
};

const faqs = [
  {
    q: "How is exact age calculated?",
    a: "The calculator computes age by finding the difference between your date of birth and the reference date (today by default). It accounts for varying month lengths and leap years to give you the precise count of years, months, and remaining days.",
  },
  {
    q: "Can I calculate age on a specific date?",
    a: 'Yes! You can change the "Calculate Age As Of" date to any date you want — past or future. This is useful for calculating age at a historical event, or how old you will be on a future date.',
  },
  {
    q: "How is the zodiac sign determined?",
    a: "Zodiac signs (Western astrology) are determined by the month and day of birth. For example, Aries runs from March 21 to April 19, Taurus from April 20 to May 20, and so on. The calculator automatically assigns the correct sign.",
  },
  {
    q: 'What is the "Calculate Age As Of" date?',
    a: "This is the reference date for the age calculation. By default it is set to today. Change it to calculate your age on any specific date — useful for legal, educational, or historical purposes.",
  },
];

const relatedTools = [
  { name: "BMI Calculator", href: "/tools/bmi-calculator", icon: Scale },
  { name: "EMI Calculator", href: "/tools/emi-calculator", icon: Calculator },
  { name: "Unit Converter", href: "/tools/unit-converter", icon: Hash },
];

export default function AgeCalculatorPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Age Calculator — ZSpace Tools",
            url: "https://tools.zspace.in/tools/age-calculator",
            description:
              "Free age calculator. Find exact age in years, months, days, hours, and minutes.",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Exact Age in Years Months Days",
              "Total Days Weeks Hours Minutes",
              "Next Birthday Countdown",
              "Zodiac Sign",
              "Life Milestones",
              "Custom Reference Date",
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
            <span className="text-ink-600 font-medium">Age Calculator</span>
          </nav>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Age Calculator
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
                  Exact Age
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Calculate your exact age in years, months, days, hours, and
                minutes. Get your next birthday countdown, zodiac sign,
                birthstone, and life milestone dates — all instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgeCalculatorClient />
        </div>
      </section>

      {/* What you get */}
      <section className="py-12 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="features-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            What this Age Calculator gives you
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "🎂",
                title: "Exact Age",
                desc: "Precise age in years, months, and remaining days — accounting for leap years and month lengths.",
              },
              {
                icon: "📅",
                title: "Total Time Lived",
                desc: "Your age expressed as total days, weeks, months, hours, minutes, and even seconds.",
              },
              {
                icon: "🎉",
                title: "Next Birthday",
                desc: "Exact days remaining until your next birthday, with the day of the week it falls on.",
              },
              {
                icon: "♑",
                title: "Zodiac Sign",
                desc: "Your Western zodiac sign and symbol, automatically determined from your birth date.",
              },
              {
                icon: "💎",
                title: "Birthstone",
                desc: "Your traditional birthstone, one of 12 gemstones assigned to each calendar month.",
              },
              {
                icon: "🏆",
                title: "Life Milestones",
                desc: "Key birthday milestones — 18th, 21st, 30th, 50th, 100th — with exact dates and countdowns.",
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

      {/* Zodiac reference */}
      <section className="py-12 bg-white" aria-labelledby="zodiac-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="zodiac-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Zodiac Sign Date Ranges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { symbol: "♈", sign: "Aries", dates: "Mar 21 – Apr 19" },
              { symbol: "♉", sign: "Taurus", dates: "Apr 20 – May 20" },
              { symbol: "♊", sign: "Gemini", dates: "May 21 – Jun 20" },
              { symbol: "♋", sign: "Cancer", dates: "Jun 21 – Jul 22" },
              { symbol: "♌", sign: "Leo", dates: "Jul 23 – Aug 22" },
              { symbol: "♍", sign: "Virgo", dates: "Aug 23 – Sep 22" },
              { symbol: "♎", sign: "Libra", dates: "Sep 23 – Oct 22" },
              { symbol: "♏", sign: "Scorpio", dates: "Oct 23 – Nov 21" },
              { symbol: "♐", sign: "Sagittarius", dates: "Nov 22 – Dec 21" },
              { symbol: "♑", sign: "Capricorn", dates: "Dec 22 – Jan 19" },
              { symbol: "♒", sign: "Aquarius", dates: "Jan 20 – Feb 18" },
              { symbol: "♓", sign: "Pisces", dates: "Feb 19 – Mar 20" },
            ].map((z) => (
              <div
                key={z.sign}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3"
              >
                <span className="text-2xl">{z.symbol}</span>
                <div>
                  <p className="text-sm font-display font-semibold text-ink-800">
                    {z.sign}
                  </p>
                  <p className="text-[10px] text-gray-400">{z.dates}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Birthstones */}
      <section
        className="py-12 bg-gray-50"
        aria-labelledby="birthstone-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="birthstone-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Birthstones by Month
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { month: "January", stone: "Garnet", emoji: "🔴" },
              { month: "February", stone: "Amethyst", emoji: "💜" },
              { month: "March", stone: "Aquamarine", emoji: "🔵" },
              { month: "April", stone: "Diamond", emoji: "💎" },
              { month: "May", stone: "Emerald", emoji: "💚" },
              { month: "June", stone: "Pearl", emoji: "🤍" },
              { month: "July", stone: "Ruby", emoji: "❤️" },
              { month: "August", stone: "Peridot", emoji: "🟢" },
              { month: "September", stone: "Sapphire", emoji: "💙" },
              { month: "October", stone: "Opal", emoji: "🌈" },
              { month: "November", stone: "Topaz", emoji: "🟡" },
              { month: "December", stone: "Turquoise", emoji: "🩵" },
            ].map((b) => (
              <div
                key={b.month}
                className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-card"
              >
                <span className="text-xl">{b.emoji}</span>
                <div>
                  <p className="text-xs text-gray-400">{b.month}</p>
                  <p className="text-sm font-display font-semibold text-ink-800">
                    {b.stone}
                  </p>
                </div>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-teal-300 hover:text-teal-600 hover:shadow-glow-sm transition-all"
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
