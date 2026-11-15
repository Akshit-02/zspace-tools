"use client";

import { motion } from "motion/react";

/**
 * Small dependency-free SVG charts for calculators. Each chart has a text
 * alternative (aria-label) and every calculator also shows the same numbers
 * in a table, so nothing is conveyed by the chart alone.
 */

export const CHART = { orange: "#F07845", charcoal: "#252525", muted: "#B9AE9F", line: "#E8DED2", ink2: "#77716B" };

export interface Series {
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((s) => (
        <li key={s.label} className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[3px]" style={s.dashed ? { border: `2px dashed ${s.color}`, height: 0 } : { background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Two-or-more-part ring, e.g. invested vs returns. */
export function Donut({ parts, label, size = 112, track = "rgba(250,247,242,0.9)" }: { parts: { value: number; color: string }[]; label: string; size?: number; track?: string }) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  const C = 2 * Math.PI * 40;
  const lens = parts.map((p) => (Math.max(0, p.value) / total) * C);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, l) => a + l, 0));
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0 -rotate-90" role="img" aria-label={label}>
      <circle cx="50" cy="50" r="40" fill="none" stroke={track} strokeWidth="16" />
      {parts.map((p, i) => (
        <motion.circle key={i} cx="50" cy="50" r="40" fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${lens[i]} ${C - lens[i]}`} initial={false} animate={{ strokeDashoffset: -starts[i] }} transition={{ duration: 0.4 }} />
      ))}
    </svg>
  );
}

function ticks(max: number) {
  if (max <= 0) return [0];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}

function niceRange(values: number[]) {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const t = ticks(max - min).map((v) => v + min);
  return { lo: min, hi: Math.max(t[t.length - 1], min + 1), t };
}

const W = 640;
const H = 260;
const PAD = { l: 64, r: 12, t: 12, b: 28 };

/** Vertical bars; stacked when `stacked`, otherwise grouped. */
export function BarChart({ labels, series, stacked, format, label }: { labels: string[]; series: Series[]; stacked?: boolean; format: (v: number) => string; label: string }) {
  const totals = labels.map((_, i) => (stacked ? series.reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0) : Math.max(...series.map((s) => s.values[i] ?? 0))));
  const { hi, t } = niceRange(totals);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / labels.length;
  const y = (v: number) => PAD.t + ih - (v / hi) * ih;
  const every = Math.ceil(labels.length / 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {t.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={CHART.line} />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={CHART.ink2} fontFamily="var(--font-mono)">
            {format(v)}
          </text>
        </g>
      ))}
      {labels.map((l, i) => {
        const x0 = PAD.l + i * bw + bw * 0.15;
        const w = bw * 0.7;
        let acc = 0;
        return (
          <g key={l}>
            {series.map((s, k) => {
              const v = Math.max(0, s.values[i] ?? 0);
              const top = stacked ? y(acc + v) : y(v);
              const h = stacked ? y(acc) - y(acc + v) : y(0) - y(v);
              const x = stacked ? x0 : x0 + (w / series.length) * k;
              acc += v;
              return <rect key={s.label} x={x} y={top} width={stacked ? w : w / series.length - 1} height={Math.max(0, h)} rx={Math.min(3, w / 6)} fill={s.color} />;
            })}
            {(i % every === 0 || i === labels.length - 1) && (
              <text x={x0 + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={CHART.ink2} fontFamily="var(--font-mono)">
                {l}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Line chart for growth over time; values can be negative. */
export function LineChart({ labels, series, format, label }: { labels: string[]; series: Series[]; format: (v: number) => string; label: string }) {
  const { lo, hi, t } = niceRange(series.flatMap((s) => s.values));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - ((v - lo) / (hi - lo)) * ih;
  const every = Math.ceil(labels.length / 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {t.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={CHART.line} />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={CHART.ink2} fontFamily="var(--font-mono)">
            {format(v)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % every === 0 || i === labels.length - 1 ? (
          <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={CHART.ink2} fontFamily="var(--font-mono)">
            {l}
          </text>
        ) : null,
      )}
      {series.map((s) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={s.dashed ? "6 5" : undefined} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
          {s.values.length <= 40 && s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} />)}
        </g>
      ))}
    </svg>
  );
}

/**
 * Compact axis labels: ₹1.2L / ₹3.4Cr in the Indian system, $1.2M elsewhere.
 * Built by hand rather than with Intl compact notation, whose output differs
 * between Node and browsers and would break hydration.
 */
export function compactMoney(locale: string, currency: string) {
  const symbol = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(0).replace(/[\d.,\s]/g, "");
  const scales: [number, string][] = locale === "en-IN" ? [[1e7, "Cr"], [1e5, "L"], [1e3, "K"]] : [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  return (v: number) => {
    const a = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    for (const [n, unit] of scales) if (a >= n) return `${sign}${symbol}${+(a / n).toFixed(1)}${unit}`;
    return `${sign}${symbol}${+a.toFixed(0)}`;
  };
}
