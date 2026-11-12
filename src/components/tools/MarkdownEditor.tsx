"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Bold, Code, Download, Eraser, FileCode2, Heading2, Image as ImageIcon, Italic, Link2, List, ListChecks, ListOrdered, Minus, Quote, Sparkles, Strikethrough, Table } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Segmented, Toggle } from "./ui";
import { MARKDOWN_SAMPLE, exportHtml, markdownStats, renderMarkdown } from "@/lib/markdown";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DRAFT_KEY = "zs-markdown-draft";
const DRAFT_ON = "zs-markdown-draft-on";
const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage unavailable (private mode) — drafts simply aren't kept */
  }
};

type ToolId = "heading" | "bold" | "italic" | "strike" | "link" | "image" | "ul" | "ol" | "task" | "quote" | "code" | "table" | "hr";
const TOOLS: { id: ToolId; label: string; icon: typeof Bold; key?: string }[] = [
  { id: "heading", label: "Heading", icon: Heading2 },
  { id: "bold", label: "Bold", icon: Bold, key: "b" },
  { id: "italic", label: "Italic", icon: Italic, key: "i" },
  { id: "strike", label: "Strikethrough", icon: Strikethrough },
  { id: "link", label: "Link", icon: Link2, key: "k" },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "ul", label: "Bulleted list", icon: List },
  { id: "ol", label: "Numbered list", icon: ListOrdered },
  { id: "task", label: "Task list", icon: ListChecks },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "code", label: "Code", icon: Code },
  { id: "table", label: "Table", icon: Table },
  { id: "hr", label: "Horizontal rule", icon: Minus },
];

export default function MarkdownEditor() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [keepDraft, setKeepDraft] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const deferred = useDeferredValue(text);
  const stats = markdownStats(deferred);

  useEffect(() => {
    if (safeGet(DRAFT_ON) === "1") {
      setKeepDraft(true); // eslint-disable-line react-hooks/set-state-in-effect
      setText(safeGet(DRAFT_KEY) ?? "");
    }
    track("tool_opened", { tool: "markdown-editor" });
  }, []);

  useEffect(() => {
    let alive = true;
    renderMarkdown(deferred).then((h) => alive && setHtml(h));
    return () => {
      alive = false;
    };
  }, [deferred]);

  useEffect(() => {
    if (keepDraft) safeSet(DRAFT_KEY, deferred);
  }, [deferred, keepDraft]);

  /** Replaces the selection with `insert`, preserving the browser's undo stack where possible. */
  const replaceSelection = (insert: string, selectFrom?: number, selectTo?: number) => {
    const el = area.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart;
    const ok = typeof document.execCommand === "function" && document.execCommand("insertText", false, insert);
    if (!ok) {
      const end = el.selectionEnd;
      const next = el.value.slice(0, start) + insert + el.value.slice(end);
      setText(next);
      requestAnimationFrame(() => el.setSelectionRange(start + (selectFrom ?? insert.length), start + (selectTo ?? insert.length)));
      return;
    }
    if (selectFrom !== undefined) el.setSelectionRange(start + selectFrom, start + (selectTo ?? selectFrom));
  };

  const wrap = (before: string, after: string, placeholder: string) => {
    const el = area.current!;
    const sel = el.value.slice(el.selectionStart, el.selectionEnd) || placeholder;
    replaceSelection(before + sel + after, before.length, before.length + sel.length);
  };

  /** Adds a prefix to every selected line (headings, lists, quotes). */
  const prefixLines = (prefix: (i: number) => string, placeholder: string) => {
    const el = area.current!;
    const v = el.value;
    const ls = v.lastIndexOf("\n", el.selectionStart - 1) + 1;
    let le = v.indexOf("\n", el.selectionEnd);
    if (le === -1) le = v.length;
    el.setSelectionRange(ls, le);
    const block = v.slice(ls, le) || placeholder;
    const out = block
      .split("\n")
      .map((l, i) => prefix(i) + l.replace(/^(#{1,6}\s|>\s|[-*+]\s(\[[ x]\]\s)?|\d+\.\s)/, ""))
      .join("\n");
    replaceSelection(out, out.length);
  };

  const block = (snippet: string) => {
    const el = area.current!;
    const before = el.value.slice(0, el.selectionStart);
    const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    replaceSelection(`${lead}${snippet}\n`);
  };

  const runTool = (id: ToolId) => {
    const el = area.current;
    if (!el) return;
    switch (id) {
      case "heading":
        return prefixLines(() => "## ", "Heading");
      case "bold":
        return wrap("**", "**", "bold text");
      case "italic":
        return wrap("*", "*", "italic text");
      case "strike":
        return wrap("~~", "~~", "struck text");
      case "link":
        return wrap("[", "](https://)", "link text");
      case "image":
        return wrap("![", "](https://)", "alt text");
      case "ul":
        return prefixLines(() => "- ", "List item");
      case "ol":
        return prefixLines((i) => `${i + 1}. `, "List item");
      case "task":
        return prefixLines(() => "- [ ] ", "Task");
      case "quote":
        return prefixLines(() => "> ", "Quote");
      case "code": {
        const sel = el.value.slice(el.selectionStart, el.selectionEnd);
        if (sel.includes("\n")) return replaceSelection("```\n" + sel + "\n```", 4, 4 + sel.length);
        return wrap("`", "`", "code");
      }
      case "table":
        return block("| Column | Column |\n| --- | --- |\n| Cell | Cell |");
      case "hr":
        return block("---");
    }
  };

  const title = (deferred.match(/^#\s+(.+)$/m)?.[1] ?? "Document").trim();

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 rounded-[12px] border border-line bg-card p-1">
          {TOOLS.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.key ? `${t.label} (Ctrl/⌘+${t.key.toUpperCase()})` : t.label}
              aria-label={t.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (view === "preview") setView("edit");
                requestAnimationFrame(() => runTool(t.id));
              }}
              className="grid size-9 place-items-center rounded-[8px] text-charcoal/80 transition-colors hover:bg-ivory-2 hover:text-charcoal"
            >
              <t.icon aria-hidden className="size-4" />
            </button>
          ))}
        </div>
        <Segmented
          label="View"
          size="sm"
          className="w-full sm:w-[200px] lg:hidden"
          value={view}
          onChange={(v) => setView(v as "edit" | "preview")}
          options={[
            { value: "edit", label: "Edit" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <div className={clsx("flex flex-col overflow-hidden rounded-[16px] border border-line bg-card focus-within:border-charcoal focus-within:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]", view !== "edit" && "hidden lg:flex")}>
          <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
            <label htmlFor="md-input" className="text-sm font-bold">
              Markdown
            </label>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => setText(MARKDOWN_SAMPLE)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </button>
              <button type="button" onClick={() => setText("")} disabled={!text} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                <Eraser aria-hidden className="size-3.5" /> Clear
              </button>
            </div>
          </div>
          <textarea
            id="md-input"
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (!(e.metaKey || e.ctrlKey)) return;
              const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
              if (t) {
                e.preventDefault();
                runTool(t.id);
              }
            }}
            placeholder={"# Start writing\n\nUse **bold**, *italic*, [links](https://example.com), lists and more."}
            spellCheck
            className="min-h-[520px] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[0.88rem] leading-[1.7] outline-none placeholder:text-ink-3 focus-visible:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2">
            <p className="font-mono text-xs text-ink-2" aria-live="polite">
              {stats.words.toLocaleString("en-US")} words · {stats.characters.toLocaleString("en-US")} chars · {stats.minutes} min read
            </p>
            <Toggle
              checked={keepDraft}
              onChange={(v) => {
                setKeepDraft(v);
                safeSet(DRAFT_ON, v ? "1" : null);
                safeSet(DRAFT_KEY, v ? text : null);
              }}
              label="Keep draft in this browser"
              description={keepDraft ? "Saved on this device only · switch off to delete it" : "Off — nothing is saved"}
            />
          </div>
        </div>

        <div className={clsx("flex flex-col overflow-hidden rounded-[16px] border border-line bg-card", view !== "preview" && "hidden lg:flex")}>
          <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
            <p className="text-sm font-bold">Preview</p>
            <div className="flex flex-wrap gap-1">
              <CopyButton text={() => text} label="Copy Markdown" className="!h-8" onCopied={() => track("copy_clicked", { tool: "markdown-editor", format: "md" })} />
              <CopyButton text={() => html} label="Copy HTML" className="!h-8" onCopied={() => track("copy_clicked", { tool: "markdown-editor", format: "html" })} />
            </div>
          </div>
          <article className="md-preview min-h-[520px] flex-1 overflow-auto px-5 py-4 sm:px-7" data-testid="md-preview" dangerouslySetInnerHTML={{ __html: html || '<p class="md-empty">Your formatted preview appears here.</p>' }} />
          <div className="flex flex-wrap gap-2 border-t border-line px-3 py-2">
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([text], { type: "text/markdown;charset=utf-8" }), `${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "document"}.md`);
                track("download_clicked", { tool: "markdown-editor", format: "md" });
              }}
              disabled={!text}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40"
            >
              <Download aria-hidden className="size-4" /> Download .md
            </button>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([exportHtml(html, title)], { type: "text/html;charset=utf-8" }), `${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "document"}.html`);
                track("download_clicked", { tool: "markdown-editor", format: "html" });
              }}
              disabled={!text}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal disabled:opacity-40"
            >
              <FileCode2 aria-hidden className="size-4" /> Export HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
