import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { ToolIcon } from "./ToolIcon";
import { getTool, toolPath } from "@/lib/tools";
import type { Block } from "@/lib/blog-types";

/** Renders the inline subset: **bold**, `code`, [text](href). */
export function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={k++}><Inline text={m[1]} /></strong>);
    else if (m[2] !== undefined) out.push(<code key={k++}>{m[2]}</code>);
    else {
      const href = m[4];
      out.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href}>
            {m[3]}
          </Link>
        ) : (
          <a key={k++} href={href} rel="noopener noreferrer" target="_blank">
            {m[3]}
          </a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function ToolCallout({ slug, text }: { slug: string; text: string }) {
  const tool = getTool(slug);
  if (!tool) return null;
  return (
    <Link
      href={toolPath(slug)}
      className="group not-prose my-8 flex items-center gap-4 rounded-[14px] border border-line bg-card p-5 !no-underline transition-[border-color,box-shadow] hover:border-charcoal hover:shadow-[0_18px_40px_-28px_rgba(37,37,37,0.45)]"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-charcoal text-ivory transition-colors group-hover:bg-orange group-hover:text-charcoal">
        <ToolIcon name={tool.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-[0.12em] text-ink-2">Free tool</span>
        <span className="block font-display text-lg font-semibold text-charcoal">{tool.name}</span>
        <span className="block text-[0.95rem] leading-snug text-ink-2">{text}</span>
      </span>
      <ArrowRight aria-hidden className="size-5 shrink-0 text-charcoal transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-z">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={b.id} className="scroll-mt-24">
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "ul":
          case "ol": {
            const L = b.type;
            return (
              <L key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </L>
            );
          }
          case "callout":
            return (
              <aside key={i} className="rounded-[14px] border border-line bg-ivory-2 p-5">
                <p className="flex items-center gap-2 font-bold">
                  <Lightbulb aria-hidden className="size-4 text-orange-ink" />
                  {b.title ?? "Tip"}
                </p>
                <p className="mt-1.5 text-[1rem] leading-relaxed">
                  <Inline text={b.text} />
                </p>
              </aside>
            );
          case "tool":
            return <ToolCallout key={i} slug={b.slug} text={b.text} />;
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-[12px] border border-line bg-card">
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "example":
            return (
              <figure key={i} className="overflow-hidden rounded-[12px] border border-line bg-card">
                <figcaption className="border-b border-line bg-ivory px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-2">
                  {b.title}
                </figcaption>
                <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[0.86rem] leading-relaxed">{b.text}</pre>
              </figure>
            );
        }
      })}
    </div>
  );
}
