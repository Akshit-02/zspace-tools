"use client";

import { useEffect, useState } from "react";
import { ImageOff, Globe } from "lucide-react";
import { clsx } from "clsx";

/**
 * Illustrative previews of how a link may look in search results and on
 * social platforms. These are simulations, not platform renderings — layout,
 * cropping, truncation and caching vary by platform, device and time.
 */

export interface PreviewData {
  title: string;
  description: string;
  url: string;
  image: string; // http(s) URL or blob: URL for a local file
  siteName: string;
  twitterCard: "summary" | "summary_large_image";
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export interface ImageInfo {
  status: "none" | "loading" | "ok" | "error";
  w?: number;
  h?: number;
}

/** Loads the image once to read its natural size (and whether it loads at all). */
export function useImageInfo(src: string): ImageInfo {
  const [info, setInfo] = useState<{ src: string; info: ImageInfo } | null>(null);
  useEffect(() => {
    if (!src) return;
    let live = true;
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => live && setInfo({ src, info: { status: "ok", w: img.naturalWidth, h: img.naturalHeight } });
    img.onerror = () => live && setInfo({ src, info: { status: "error" } });
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);
  if (!src) return { status: "none" };
  return info?.src === src ? info.info : { status: "loading" };
}

function Img({ src, info, className, ratio }: { src: string; info: ImageInfo; className?: string; ratio: string }) {
  return (
    <div className={clsx("relative overflow-hidden bg-[#e9e5df]", className)} style={{ aspectRatio: ratio }}>
      {src && info.status === "ok" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[#8a847d]">
          <span className="flex flex-col items-center gap-1 text-[0.7rem]">
            <ImageOff aria-hidden className="size-5" />
            {info.status === "loading" ? "Loading image…" : info.status === "error" ? "Image couldn't load" : "No image"}
          </span>
        </div>
      )}
    </div>
  );
}

export function SerpPreview({ d, mobile }: { d: PreviewData; mobile?: boolean }) {
  const host = hostOf(d.url);
  let crumbs = "";
  try {
    crumbs = new URL(d.url).pathname.split("/").filter(Boolean).slice(0, 3).join(" › ");
  } catch {
    /* empty */
  }
  return (
    <div className={clsx("rounded-[12px] border border-line bg-white p-4 font-[arial,sans-serif]", mobile ? "max-w-[380px]" : "")} data-testid="serp-preview">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#dadce0] bg-[#f1f3f4]">
          <Globe aria-hidden className="size-3.5 text-[#5f6368]" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[14px] text-[#202124]">{d.siteName || host || "example.com"}</span>
          <span className="block truncate text-[12px] text-[#4d5156]">
            {host ? `https://${host}` : "https://example.com"}
            {crumbs && ` › ${crumbs}`}
          </span>
        </span>
      </div>
      <p className={clsx("mt-2 text-[#1a0dab]", mobile ? "line-clamp-2 text-[18px] leading-[1.3]" : "truncate text-[20px] leading-[1.3]")}>{d.title || "Your page title"}</p>
      <p className={clsx("mt-1 text-[14px] leading-[1.58] text-[#4d5156]", mobile ? "line-clamp-3" : "line-clamp-2")}>{d.description || "Your meta description appears here when the search engine chooses to use it."}</p>
    </div>
  );
}

export function FacebookPreview({ d, info }: { d: PreviewData; info: ImageInfo }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#dddfe2] bg-white font-[Helvetica,Arial,sans-serif]" data-testid="fb-preview">
      <Img src={d.image} info={info} ratio="1.91 / 1" />
      <div className="border-t border-[#dddfe2] bg-[#f0f2f5] px-3 py-2.5">
        <p className="truncate text-[12px] uppercase text-[#65676b]">{hostOf(d.url) || "example.com"}</p>
        <p className="mt-0.5 line-clamp-2 text-[16px] font-semibold leading-[1.25] text-[#050505]">{d.title || "Page title"}</p>
        <p className="mt-0.5 line-clamp-1 text-[14px] text-[#65676b]">{d.description}</p>
      </div>
    </div>
  );
}

export function LinkedInPreview({ d, info }: { d: PreviewData; info: ImageInfo }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e0dfdc] bg-white font-[system-ui,sans-serif]" data-testid="li-preview">
      <Img src={d.image} info={info} ratio="1.91 / 1" />
      <div className="px-3 py-2.5">
        <p className="line-clamp-2 text-[14px] font-semibold leading-[1.35] text-[rgba(0,0,0,0.9)]">{d.title || "Page title"}</p>
        <p className="mt-1 truncate text-[12px] text-[rgba(0,0,0,0.6)]">{hostOf(d.url) || "example.com"}</p>
      </div>
    </div>
  );
}

export function WhatsAppPreview({ d, info }: { d: PreviewData; info: ImageInfo }) {
  return (
    <div className="rounded-[10px] bg-[#d9fdd3] p-1.5 font-[system-ui,sans-serif] shadow-sm" data-testid="wa-preview">
      <div className="overflow-hidden rounded-[7px] bg-[#c5eebc]/70">
        <Img src={d.image} info={info} ratio="1.91 / 1" />
        <div className="px-2.5 py-2">
          <p className="line-clamp-2 text-[14px] font-medium leading-[1.3] text-[#111b21]">{d.title || "Page title"}</p>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[#54656f]">{d.description}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#667781]">{hostOf(d.url) || "example.com"}</p>
        </div>
      </div>
      <p className="break-all px-1.5 pb-0.5 pt-1.5 text-[13.5px] text-[#027eb5]">{d.url || "https://example.com/"}</p>
    </div>
  );
}

export function XPreview({ d, info }: { d: PreviewData; info: ImageInfo }) {
  const large = d.twitterCard === "summary_large_image";
  return (
    <div className="font-[system-ui,sans-serif]" data-testid="x-preview">
      {large ? (
        <div className="relative overflow-hidden rounded-[16px] border border-[#cfd9de]">
          <Img src={d.image} info={info} ratio="1.91 / 1" />
          <span className="absolute bottom-2.5 left-2.5 max-w-[85%] truncate rounded-[4px] bg-black/75 px-1.5 py-0.5 text-[13px] text-white">{d.title || "Page title"}</span>
        </div>
      ) : (
        <div className="flex overflow-hidden rounded-[16px] border border-[#cfd9de]">
          <Img src={d.image} info={info} ratio="1 / 1" className="w-[120px] shrink-0 border-r border-[#cfd9de]" />
          <div className="min-w-0 self-center px-3 py-2">
            <p className="truncate text-[15px] text-[#536471]">{hostOf(d.url) || "example.com"}</p>
            <p className="truncate text-[15px] text-[#0f1419]">{d.title || "Page title"}</p>
            <p className="line-clamp-2 text-[15px] text-[#536471]">{d.description}</p>
          </div>
        </div>
      )}
      {large && <p className="mt-1 truncate text-[13px] text-[#536471]">From {hostOf(d.url) || "example.com"}</p>}
    </div>
  );
}

export function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-ink-2">{children}</p>;
}

/** Image size guidance — common practice, not platform requirements. */
export function imageAdvice(info: ImageInfo): { tone: "ok" | "warn" | "info"; text: string } | null {
  if (info.status === "error") return { tone: "warn", text: "The image couldn't be loaded here. Check the address is public and points to an image file. (Some sites block loading their images from other websites.)" };
  if (info.status !== "ok" || !info.w || !info.h) return null;
  const r = info.w / info.h;
  if (info.w < 200 || info.h < 200) return { tone: "warn", text: `${info.w} × ${info.h} px is very small — many platforms won't show an image this size.` };
  if (Math.abs(r - 1.91) < 0.08 && info.w >= 1200) return { tone: "ok", text: `${info.w} × ${info.h} px (≈1.91:1) — a common landscape size for link previews.` };
  if (Math.abs(r - 1) < 0.05) return { tone: "info", text: `${info.w} × ${info.h} px (square). Large landscape cards will crop it; the X “summary” card shows it well.` };
  return { tone: "info", text: `${info.w} × ${info.h} px (${r.toFixed(2)}:1). Platforms may crop it to about 1.91:1 — keep key content centred. 1200 × 630 is a common choice.` };
}
