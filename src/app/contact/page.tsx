import type { Metadata } from "next";
import { Bug, Lightbulb, Mail, MessageCircle } from "lucide-react";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const description = "Contact ZSpace Tools to report a bug, suggest a new tool or ask a question. We read every message.";

export const metadata: Metadata = pageMetadata({ title: "Contact", description, path: "/contact/" });

const reasons = [
  { icon: Bug, title: "Report a bug", body: "Tell us which tool, what you expected and what happened. Your browser and device help too — but please don't attach private files." },
  { icon: Lightbulb, title: "Suggest a tool", body: "Describe the everyday task you wish was simpler. Requests shape what we build next." },
  { icon: MessageCircle, title: "Anything else", body: "Questions about privacy, feedback on the design, or partnership enquiries." },
];

export default function ContactPage() {
  return (
    <ProsePage
      path="/contact/"
      eyebrow="Contact"
      title="Say hello."
      intro="The quickest way to reach us is by email. We read every message and reply as soon as we can."
      description={description}
      type="ContactPage"
    >
      <a
        href={`mailto:${site.contactEmail}`}
        className="group not-prose flex items-center gap-4 rounded-[16px] border border-line bg-card p-6 !no-underline transition-colors hover:border-charcoal"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-orange text-charcoal">
          <Mail aria-hidden className="size-5" />
        </span>
        <span>
          <span className="block text-sm text-ink-2">Email</span>
          <span className="block font-display text-xl font-semibold text-charcoal sm:text-2xl">{site.contactEmail}</span>
        </span>
      </a>
      <div className="not-prose mt-8 grid gap-3 sm:grid-cols-3">
        {reasons.map((r) => (
          <div key={r.title} className="rounded-[14px] border border-line bg-card p-5">
            <r.icon aria-hidden className="size-5 text-orange-ink" strokeWidth={1.7} />
            <p className="mt-3 font-bold">{r.title}</p>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{r.body}</p>
          </div>
        ))}
      </div>
      <p>
        Please never email passwords, private documents or other sensitive information. Our tools are designed so that you never need to share them with us.
      </p>
    </ProsePage>
  );
}
