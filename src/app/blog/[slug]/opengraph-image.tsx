import { ImageResponse } from "next/og";
import { OgCard, ogFonts, ogSize } from "@/lib/og";
import { getPost, posts } from "@/content/blog";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "ZSpace Tools guide";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  return new ImageResponse(<OgCard eyebrow="Guide" title={post?.title ?? "ZSpace Tools"} />, { ...size, fonts: await ogFonts() });
}
