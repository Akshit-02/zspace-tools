"use client";

import { useState } from "react";
import { Segmented, Toggle } from "./ui";
import CodeFormatter from "./CodeFormatter";
import { CSS_SAMPLE, beautify, checkCss, minifyCss, setFinalSemicolon, type CommentMode } from "@/lib/css-tools";

export default function CssMinifier() {
  const [comments, setComments] = useState<CommentMode>("license");
  const [finalSemi, setFinalSemi] = useState(false);
  return (
    <CodeFormatter
      tool="css-minifier"
      language="CSS"
      accept=".css,text/css,text/plain"
      acceptLabel="a .css file"
      sample={CSS_SAMPLE}
      fileBase="styles"
      ext="css"
      mime="text/css"
      placeholder={".card { color: #252525; }"}
      deps={[comments, finalSemi]}
      run={async (input, mode, indent) => {
        if (mode === "minify") {
          const r = await minifyCss(input, { comments, keepFinalSemicolon: finalSemi });
          return { output: r.css, issues: r.issues };
        }
        const pretty = beautify(input, indent, comments !== "none");
        return { output: finalSemi ? setFinalSemicolon(pretty, true) : pretty, issues: await checkCss(input) };
      }}
      options={
        <>
          <div className="rounded-[12px] border border-line bg-card px-4 py-3 sm:col-span-2 lg:col-span-1">
            <p className="mb-2 text-[0.95rem] font-medium">Comments</p>
            <Segmented
              label="Comments"
              size="sm"
              className="w-full whitespace-nowrap"
              value={comments}
              onChange={(v) => setComments(v as CommentMode)}
              options={[
                { value: "license", label: "Keep /*! */" },
                { value: "none", label: "Remove" },
                { value: "all", label: "Keep all" },
              ]}
            />
          </div>
          <Toggle checked={finalSemi} onChange={setFinalSemi} label="Keep final semicolons" description="a{color:red;} vs a{color:red}" />
          <p className="rounded-[12px] border border-line bg-ivory px-4 py-3 text-xs leading-relaxed text-ink-2">
            Minify never merges or reorders rules. “Keep all” comments only collapses whitespace, so savings are smaller.
          </p>
        </>
      }
    />
  );
}
