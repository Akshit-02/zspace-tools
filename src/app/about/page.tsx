import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { tools, toolPath } from "@/lib/tools";

const description = "ZSpace Tools makes simple, free online tools for everyday tasks — fast, private by design and free of clutter. Here's what we build and why.";

export const metadata: Metadata = pageMetadata({ title: "About ZSpace Tools", description, path: "/about/" });

export default function AboutPage() {
  return (
    <ProsePage
      path="/about/"
      eyebrow="About"
      title="Everyday tools. Made effortlessly simple."
      intro="ZSpace Tools is a growing collection of free online utilities for the small jobs that come up every day — shrinking a photo, making a PDF fit in an email, creating a QR code, checking a word count or generating a password."
      description={description}
      type="AboutPage"
    >
      <h2>Why we built it</h2>
      <p>
        Most online tools for simple tasks have become hard work. You arrive with a two-second job and are met with pop-ups, sign-up walls, upload queues and
        pages of text before the tool itself. Often your file is uploaded to a server you know nothing about, just to do something your own device could have
        done in a moment.
      </p>
      <p>
        ZSpace Tools takes the opposite approach. Each page does one job, puts the tool first and gets out of your way. Less effort, more done.
      </p>

      <h2>How we build tools</h2>
      <ul>
        <li>
          <strong>On your device.</strong> All of our current tools run entirely in your browser using standard web technologies such as the Canvas API and the
          Web Crypto API. Your files and text are not uploaded to our servers.
        </li>
        <li>
          <strong>Honest results.</strong> Compression results are measured from the actual output. If a file can&rsquo;t be made smaller, the tool tells you
          rather than handing back the same file with a new name.
        </li>
        <li>
          <strong>Free, without catches.</strong> No accounts, watermarks or artificial limits. Size limits exist only where your browser&rsquo;s memory makes them
          sensible.
        </li>
        <li>
          <strong>Built to last.</strong> Every tool is tested on phones, tablets and desktops before it&rsquo;s published. We don&rsquo;t publish placeholders.
        </li>
      </ul>

      <h2>The tools</h2>
      <ul>
        {tools.map((t) => (
          <li key={t.slug}>
            <Link href={toolPath(t.slug)}>{t.name}</Link> — {t.short}
          </li>
        ))}
      </ul>
      <p>
        More are on the way, including image resizing, PDF merging and splitting, text utilities, calculators and developer tools. See the{" "}
        <Link href="/all-tools/">full directory</Link> for what&rsquo;s live and what&rsquo;s coming.
      </p>

      <h2>Get in touch</h2>
      <p>
        Found a bug, have an idea for a tool, or want to say hello? Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or visit the{" "}
        <Link href="/contact/">contact page</Link>.
      </p>
    </ProsePage>
  );
}
