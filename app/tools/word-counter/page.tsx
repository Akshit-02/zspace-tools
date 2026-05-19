import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ChevronRight, Calculator, Activity } from "lucide-react";
import WordCounterClient from "./WordCounterClient";

export const metadata: Metadata = {
  title: "Free Word Counter — Count Words, Characters & Reading Time Online",
  description:
    "Free online word counter. Count words, characters, sentences, paragraphs, unique words, and estimate reading & speaking time. Supports .txt file upload.",
  keywords: [
    "word counter",
    "word count online",
    "character counter",
    "word counter free",
    "online word counter",
    "reading time calculator",
    "word frequency counter",
    "sentence counter",
  ],
  alternates: { canonical: "https://tools.zspace.in/tools/word-counter" },
  openGraph: {
    title: "Free Word Counter — ZSpace Tools",
    description:
      "Count words, characters, sentences, and estimate reading time instantly.",
    url: "https://tools.zspace.in/tools/word-counter",
  },
};

const faqs = [
  {
    q: "How does the word counter work?",
    a: "The word counter splits your text by whitespace and counts distinct tokens as words. Characters are counted individually including spaces, while sentences are detected by punctuation marks (. ! ?). All counting happens instantly in your browser — your text is never sent to any server.",
  },
  {
    q: "How is reading time calculated?",
    a: "Reading time is estimated based on the average adult reading speed of 238 words per minute (wpm), as established by research. Speaking time uses 130 wpm, which is typical for presentations and podcasts.",
  },
  {
    q: "What is vocabulary density?",
    a: "Vocabulary density (also called type-token ratio) is the ratio of unique words to total words. A higher percentage means more varied vocabulary. Academic writing typically scores 40–60%, while casual text may score lower due to word repetition.",
  },
  {
    q: "Can I use this for SEO keyword density?",
    a: 'Yes! The Top Keywords tab shows you the most frequently used non-trivial words in your text (stop words like "the", "and", "is" are excluded). This is useful for checking keyword density in blog posts and web content.',
  },
  {
    q: "Does this work with uploaded files?",
    a: "Yes. You can upload a .txt file or drag and drop it onto the text area. The file is read entirely in your browser — nothing is uploaded to our servers.",
  },
];

const useCases = [
  {
    icon: "✍️",
    title: "Blog & Articles",
    desc: "Ensure your posts hit target word counts for SEO (1,500–2,500 words for most blogs).",
  },
  {
    icon: "🎓",
    title: "Academic Writing",
    desc: "Meet essay and dissertation word limits set by your institution.",
  },
  {
    icon: "🎙️",
    title: "Speeches & Talks",
    desc: "Estimate your speaking time before a presentation or podcast recording.",
  },
  {
    icon: "📱",
    title: "Social Media",
    desc: "Check character limits before posting on Twitter/X (280), LinkedIn (3,000), etc.",
  },
  {
    icon: "📧",
    title: "Email & Copy",
    desc: "Keep marketing emails concise. Studies show under 200 words get higher read rates.",
  },
  {
    icon: "📖",
    title: "Books & Chapters",
    desc: "Track progress toward novel or non-fiction manuscript targets (50,000–100,000 words).",
  },
];

const relatedTools = [
  { name: "GST Calculator", href: "/tools/gst-calculator", icon: Calculator },
  { name: "BMI Calculator", href: "/tools/bmi-calculator", icon: Activity },
  { name: "Age Calculator", href: "/tools/age-calculator", icon: FileText },
];

export default function WordCounterPage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Word Counter — ZSpace Tools",
            url: "https://tools.zspace.in/tools/word-counter",
            description:
              "Free online word counter with character count, reading time, and keyword frequency.",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web browser",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            featureList: [
              "Word Count",
              "Character Count",
              "Sentence Counter",
              "Paragraph Counter",
              "Reading Time",
              "Speaking Time",
              "Keyword Frequency",
              "Vocabulary Density",
              "TXT File Upload",
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
            <span className="text-ink-600 font-medium">Word Counter</span>
          </nav>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-ink-800">
                  Free Word Counter
                </h1>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600">
                  Instant
                </span>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm lg:text-base max-w-2xl">
                Count words, characters, sentences, and paragraphs in real-time.
                Get reading & speaking time estimates, top keyword frequency,
                and vocabulary density — all in your browser, completely
                private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WordCounterClient />
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50" aria-labelledby="usecases-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="usecases-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-2"
          >
            Who uses a Word Counter?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            From students to marketers, word counters are essential for anyone
            working with text.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((item) => (
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

      {/* Word count targets */}
      <section className="py-12 bg-white" aria-labelledby="targets-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="targets-heading"
            className="font-display font-bold text-xl lg:text-2xl text-ink-800 mb-6"
          >
            Common Word Count Targets
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Word count targets by content type"
            >
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Content Type
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700">
                    Word Count
                  </th>
                  <th className="text-left px-5 py-3.5 font-display font-semibold text-ink-700 hidden sm:table-cell">
                    Reading Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: "Tweet / X post", range: "280 chars", time: "~5s" },
                  {
                    type: "LinkedIn post",
                    range: "150–300 words",
                    time: "1–2 min",
                  },
                  {
                    type: "Short blog post",
                    range: "500–800 words",
                    time: "2–4 min",
                  },
                  {
                    type: "Standard blog post",
                    range: "1,500–2,500 words",
                    time: "6–10 min",
                  },
                  {
                    type: "Long-form / Pillar page",
                    range: "3,000–5,000 words",
                    time: "12–20 min",
                  },
                  {
                    type: "Short story",
                    range: "1,000–7,500 words",
                    time: "5–30 min",
                  },
                  {
                    type: "Novella",
                    range: "17,500–40,000 words",
                    time: "1.5–3 hrs",
                  },
                  {
                    type: "Novel",
                    range: "50,000–100,000 words",
                    time: "4–8 hrs",
                  },
                  { type: "5-min speech", range: "~650 words", time: "5 min" },
                  {
                    type: "10-min presentation",
                    range: "~1,300 words",
                    time: "10 min",
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={i < 9 ? "border-b border-gray-50" : ""}
                  >
                    <td className="px-5 py-3 text-ink-700">{row.type}</td>
                    <td className="px-5 py-3 text-gray-600">{row.range}</td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Privacy note */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔒</span>
            <div className="text-sm text-emerald-800 leading-relaxed">
              <strong className="font-semibold">100% Private:</strong>{" "}
              Everything happens in your browser. Your text is never sent to our
              servers, stored, or logged. You can paste sensitive documents with
              confidence.
            </div>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-card text-sm font-medium text-ink-700 hover:border-sky-300 hover:text-sky-600 hover:shadow-glow-sm transition-all"
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
