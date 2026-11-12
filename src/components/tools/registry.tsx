import dynamic from "next/dynamic";
import { ToolSkeleton } from "./ui";

/**
 * Maps a registry slug to its interactive client component. Each tool is a
 * separate chunk so a page only downloads the code for its own tool.
 */
const components: Record<string, React.ComponentType> = {
  "image-compressor": dynamic(() => import("./ImageCompressor"), { loading: () => <ToolSkeleton /> }),
  "pdf-compressor": dynamic(() => import("./PdfCompressor"), { loading: () => <ToolSkeleton /> }),
  "qr-code-generator": dynamic(() => import("./QrGenerator"), { loading: () => <ToolSkeleton /> }),
  "word-counter": dynamic(() => import("./WordCounter"), { loading: () => <ToolSkeleton /> }),
  "password-generator": dynamic(() => import("./PasswordGenerator"), { loading: () => <ToolSkeleton /> }),
};

export function ToolRenderer({ slug }: { slug: string }) {
  const Component = components[slug];
  return Component ? <Component /> : null;
}
