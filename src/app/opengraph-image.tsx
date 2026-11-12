import { ImageResponse } from "next/og";
import { OgCard, ogFonts, ogSize } from "@/lib/og";

export const alt = "ZSpace Tools — Less effort. More done.";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(<OgCard eyebrow="Free online tools" title="Less effort. More done." />, { ...size, fonts: await ogFonts() });
}
