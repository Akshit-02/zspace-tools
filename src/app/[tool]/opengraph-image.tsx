import { ImageResponse } from "next/og";
import { OgCard, ogFonts, ogSize } from "@/lib/og";
import { getCategory, getTool, toolSlugs } from "@/lib/tools";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "ZSpace Tools";

export function generateStaticParams() {
  return toolSlugs.map((tool) => ({ tool }));
}

export default async function Image({ params }: { params: Promise<{ tool: string }> }) {
  const tool = getTool((await params).tool);
  return new ImageResponse(
    <OgCard eyebrow={tool ? getCategory(tool.category).name : "Tools"} title={tool?.name ?? "ZSpace Tools"} footer={tool?.short} />,
    { ...size, fonts: await ogFonts() },
  );
}
