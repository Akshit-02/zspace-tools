import { absoluteUrl, site, limits } from "./site";
import { categories, getCategory, plannedTools, tools } from "./tools";
import { posts } from "@/content/blog";

/** llms.txt (https://llmstxt.org): concise, link-first summary for AI/answer engines. */
export function buildLlmsTxt() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} (brand tagline: "${site.tagline}") is a free, no-sign-up collection of single-purpose online tools. All current tools run entirely in the user's web browser: files and text are processed on-device and are not uploaded to ${site.name} servers. There are no watermarks, accounts or usage caps.`,
    "",
    "## Tools",
    "",
    ...tools.map((t) => `- [${t.name}](${absoluteUrl(`/${t.slug}/`)}): ${t.short} Formats: ${t.formats.join(", ")}.`),
    "",
    "## Guides",
    "",
    ...posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}/`)}): ${p.description}`),
    "",
    "## Key pages",
    "",
    `- [All tools](${absoluteUrl("/all-tools/")}): Directory of live and planned tools by category.`,
    `- [About](${absoluteUrl("/about/")}): What ${site.name} is and how tools are built.`,
    `- [Privacy policy](${absoluteUrl("/privacy-policy/")}): How data is handled (on-device processing).`,
    `- [Contact](${absoluteUrl("/contact/")}): ${site.contactEmail}`,
    "",
    "## Optional",
    "",
    `- [Full details](${absoluteUrl("/llms-full.txt")}): Complete tool specifications, how each tool works, and FAQs.`,
    "",
  ];
  return lines.join("\n");
}

/** llms-full.txt: everything an answer engine needs to describe each tool accurately. */
export function buildLlmsFullTxt() {
  const out: string[] = [
    `# ${site.name} — full reference`,
    "",
    `> ${site.description}`,
    "",
    "## About",
    "",
    `- Name: ${site.name}`,
    `- Website: ${absoluteUrl("/")}`,
    `- Tagline: ${site.tagline}`,
    `- Contact: ${site.contactEmail}`,
    `- Price: Free. No account required.`,
    `- Processing: In the browser (client-side). Files are not uploaded.`,
    `- Limits: images up to ${limits.imageMaxMB} MB each (${limits.maxImages} per batch); PDFs up to ${limits.pdfMaxMB} MB.`,
    `- Categories: ${categories.map((c) => c.name).join(", ")}.`,
    "",
  ];
  for (const t of tools) {
    out.push(
      `## ${t.name}`,
      "",
      `URL: ${absoluteUrl(`/${t.slug}/`)}`,
      `Category: ${getCategory(t.category).name}`,
      "",
      `What it is: ${t.what}`,
      "",
      `How it works: ${t.how}`,
      "",
      "Features:",
      ...t.features.map((f) => `- ${f.title}: ${f.body}`),
      "",
      "How to use:",
      ...t.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.body}`),
      "",
      "Specifications:",
      ...t.specs.map((s) => `- ${s.label}: ${s.value}`),
      "",
      `Privacy: ${t.privacy}`,
      "",
      "FAQ:",
      ...t.faqs.flatMap((f) => [`Q: ${f.q}`, `A: ${f.a}`, ""]),
    );
  }
  out.push("## Planned tools (not yet available)", "", ...plannedTools.map((p) => `- ${p.name} (${getCategory(p.category).name})`), "");
  return out.join("\n");
}
