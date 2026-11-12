import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = join(process.cwd(), "src/fonts");
  const [clash, satoshi] = await Promise.all([
    readFile(join(dir, "ClashDisplay-Semibold.ttf")),
    readFile(join(dir, "Satoshi-Medium.ttf")),
  ]);
  return [
    { name: "Clash", data: clash, weight: 600 as const, style: "normal" as const },
    { name: "Satoshi", data: satoshi, weight: 500 as const, style: "normal" as const },
  ];
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="9" fill="#252525" />
      <rect x="8" y="8" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
      <rect x="8" y="20.6" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
      <path d="M22.4 11.4 9.6 20.6" stroke="#F07845" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

/** Shared editorial OG card: ivory canvas, charcoal headline, orange accent. */
export function OgCard({ eyebrow, title, footer }: { eyebrow: string; title: string; footer?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#FAF7F2",
        padding: "64px 72px",
        fontFamily: "Satoshi",
        color: "#252525",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", right: 0, top: 0, width: 360, height: 630, borderLeft: "1px solid #E8DED2", background: "#F2ECE3", display: "flex" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark size={56} />
        <div style={{ display: "flex", fontFamily: "Clash", fontSize: 34, letterSpacing: "-0.02em" }}>
          zspace<span style={{ color: "#77716B", marginLeft: 8 }}>tools</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, color: "#77716B", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: "#F07845" }} />
          {eyebrow}
        </div>
        <div style={{ fontFamily: "Clash", fontSize: title.length > 40 ? 64 : 84, lineHeight: 1.02, letterSpacing: "-0.03em", marginTop: 20 }}>{title}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#77716B" }}>
        <span>{footer ?? "Free · In your browser · No sign-up"}</span>
      </div>
    </div>
  );
}
