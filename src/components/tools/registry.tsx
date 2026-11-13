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
  "image-resizer": dynamic(() => import("./ImageResizer"), { loading: () => <ToolSkeleton /> }),
  "pdf-merger": dynamic(() => import("./PdfMerger"), { loading: () => <ToolSkeleton /> }),
  "pdf-splitter": dynamic(() => import("./PdfSplitter"), { loading: () => <ToolSkeleton /> }),
  "image-to-pdf": dynamic(() => import("./ImageToPdf"), { loading: () => <ToolSkeleton /> }),
  "percentage-calculator": dynamic(() => import("./PercentageCalculator"), { loading: () => <ToolSkeleton /> }),
  "json-formatter": dynamic(() => import("./JsonFormatter"), { loading: () => <ToolSkeleton /> }),
  "age-calculator": dynamic(() => import("./AgeCalculator"), { loading: () => <ToolSkeleton /> }),
  "gst-calculator": dynamic(() => import("./GstCalculator"), { loading: () => <ToolSkeleton /> }),
  "unit-converter": dynamic(() => import("./UnitConverter"), { loading: () => <ToolSkeleton /> }),
  "case-converter": dynamic(() => import("./CaseConverter"), { loading: () => <ToolSkeleton /> }),
  "url-encoder-decoder": dynamic(() => import("./UrlEncoder"), { loading: () => <ToolSkeleton /> }),
  "base64-encoder-decoder": dynamic(() => import("./Base64Tool"), { loading: () => <ToolSkeleton /> }),
  "csv-to-json": dynamic(() => import("./CsvToJson"), { loading: () => <ToolSkeleton /> }),
  "days-between-dates": dynamic(() => import("./DateCalculator"), { loading: () => <ToolSkeleton /> }),
  "emi-calculator": dynamic(() => import("./LoanEmiCalculator"), { loading: () => <ToolSkeleton /> }),
  "color-picker": dynamic(() => import("./ColorPicker"), { loading: () => <ToolSkeleton /> }),
  "uuid-generator": dynamic(() => import("./UuidGenerator"), { loading: () => <ToolSkeleton /> }),
  "markdown-editor": dynamic(() => import("./MarkdownEditor"), { loading: () => <ToolSkeleton /> }),
  "invoice-generator": dynamic(() => import("./InvoiceGenerator"), { loading: () => <ToolSkeleton /> }),
  "image-cropper": dynamic(() => import("./ImageCropper"), { loading: () => <ToolSkeleton /> }),
  "url-slug-generator": dynamic(() => import("./SlugGenerator"), { loading: () => <ToolSkeleton /> }),
  "regex-tester": dynamic(() => import("./RegexTester"), { loading: () => <ToolSkeleton /> }),
  "html-formatter": dynamic(() => import("./HtmlFormatter"), { loading: () => <ToolSkeleton /> }),
  "css-minifier": dynamic(() => import("./CssMinifier"), { loading: () => <ToolSkeleton /> }),
  "discount-calculator": dynamic(() => import("./DiscountCalculator"), { loading: () => <ToolSkeleton /> }),
  "meta-tag-generator": dynamic(() => import("./MetaTagGenerator"), { loading: () => <ToolSkeleton /> }),
  "xml-sitemap-generator": dynamic(() => import("./SitemapGenerator"), { loading: () => <ToolSkeleton /> }),
  "robots-txt-generator": dynamic(() => import("./RobotsTxtGenerator"), { loading: () => <ToolSkeleton /> }),
  "open-graph-preview": dynamic(() => import("./OpenGraphPreview"), { loading: () => <ToolSkeleton /> }),
  "html-entity-encoder": dynamic(() => import("./HtmlEntityEncoder"), { loading: () => <ToolSkeleton /> }),
  "pdf-to-word": dynamic(() => import("./PdfToWord"), { loading: () => <ToolSkeleton /> }),
  "word-to-pdf": dynamic(() => import("./WordToPdf"), { loading: () => <ToolSkeleton /> }),
  "pdf-to-jpg": dynamic(() => import("./PdfToImage"), { loading: () => <ToolSkeleton /> }),
  "image-converter": dynamic(() => import("./ImageConverter"), { loading: () => <ToolSkeleton /> }),
  "image-to-text": dynamic(() => import("./ImageToText"), { loading: () => <ToolSkeleton /> }),
  "pdf-to-excel": dynamic(() => import("./PdfToExcel"), { loading: () => <ToolSkeleton /> }),
  "excel-to-pdf": dynamic(() => import("./ExcelToPdf"), { loading: () => <ToolSkeleton /> }),
  "pdf-editor": dynamic(() => import("./PdfEditor"), { loading: () => <ToolSkeleton /> }),
  "pdf-organizer": dynamic(() => import("./PdfOrganizer"), { loading: () => <ToolSkeleton /> }),
  "sign-pdf": dynamic(() => import("./SignPdf"), { loading: () => <ToolSkeleton /> }),
  "protect-pdf": dynamic(() => import("./ProtectPdf"), { loading: () => <ToolSkeleton /> }),
  "unlock-pdf": dynamic(() => import("./UnlockPdf"), { loading: () => <ToolSkeleton /> }),
  "watermark-pdf": dynamic(() => import("./WatermarkPdf"), { loading: () => <ToolSkeleton /> }),
  "add-page-numbers": dynamic(() => import("./AddPageNumbers"), { loading: () => <ToolSkeleton /> }),
  "pdf-to-powerpoint": dynamic(() => import("./PdfToPowerpoint"), { loading: () => <ToolSkeleton /> }),
};

export function ToolRenderer({ slug }: { slug: string }) {
  const Component = components[slug];
  return Component ? <Component /> : null;
}
