"use client";

import { useState } from "react";
import { Toggle } from "./ui";
import CodeFormatter from "./CodeFormatter";
import { HTML_SAMPLE, beautify, minify, validate } from "@/lib/html-format";

export default function HtmlFormatter() {
  const [keepComments, setKeepComments] = useState(true);
  const [keepBlankLines, setKeepBlankLines] = useState(false);
  return (
    <CodeFormatter
      tool="html-formatter"
      language="HTML"
      accept=".html,.htm,text/html,text/plain"
      acceptLabel="an .html file"
      sample={HTML_SAMPLE}
      fileBase="index"
      ext="html"
      mime="text/html"
      placeholder={"<div><p>Paste your HTML here</p></div>"}
      deps={[keepComments, keepBlankLines]}
      run={async (input, mode, indent) => ({
        output: mode === "minify" ? minify(input, { keepComments }) : beautify(input, { indent, keepComments, keepBlankLines }),
        issues: validate(input),
      })}
      options={
        <>
          <Toggle checked={keepComments} onChange={setKeepComments} label="Keep comments" description="<!-- … --> blocks" />
          <Toggle checked={keepBlankLines} onChange={setKeepBlankLines} label="Keep blank lines" description="Beautify only" />
          <p className="rounded-[12px] border border-line bg-ivory px-4 py-3 text-xs leading-relaxed text-ink-2 sm:col-span-2 lg:col-span-1">
            &lt;pre&gt;, &lt;textarea&gt;, &lt;script&gt; and &lt;style&gt; contents are kept exactly as written. Your HTML is never rendered or run.
          </p>
        </>
      }
    />
  );
}
