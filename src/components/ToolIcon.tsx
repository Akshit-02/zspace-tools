import { Ampersand, Bot, Globe, Network, Share2, Tags, BadgePercent, FileCode, FileCode2, Regex, Binary, Link2 as LinkSlug, Briefcase, Crop, Fingerprint, Palette, PenTool, Pilcrow, Receipt, CalendarDays, Clock, FileSpreadsheet, Landmark, Link, Braces, CaseSensitive, Cake, Code2, ReceiptIndianRupee, Ruler, Combine, FileImage, FileText, ImageIcon, KeyRound, Percent, QrCode, Repeat2, Scaling, Split, Type, Zap, type LucideProps } from "lucide-react";
import type { IconName } from "@/lib/tools";

const map = {
  image: ImageIcon,
  "file-text": FileText,
  qr: QrCode,
  type: Type,
  key: KeyRound,
  code: Code2,
  repeat: Repeat2,
  zap: Zap,
  resize: Scaling,
  merge: Combine,
  split: Split,
  "image-pdf": FileImage,
  percent: Percent,
  braces: Braces,
  cake: Cake,
  receipt: ReceiptIndianRupee,
  ruler: Ruler,
  case: CaseSensitive,
  link: Link,
  binary: Binary,
  sheet: FileSpreadsheet,
  calendar: CalendarDays,
  loan: Landmark,
  clock: Clock,
  palette: Palette,
  fingerprint: Fingerprint,
  markdown: Pilcrow,
  invoice: Receipt,
  crop: Crop,
  brush: PenTool,
  briefcase: Briefcase,
  slug: LinkSlug,
  regex: Regex,
  html: FileCode2,
  css: FileCode,
  discount: BadgePercent,
  meta: Tags,
  sitemap: Network,
  robots: Bot,
  share: Share2,
  entity: Ampersand,
  globe: Globe,
} satisfies Record<IconName, React.ComponentType<LucideProps>>;

export function ToolIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = map[name];
  return <Icon aria-hidden strokeWidth={1.6} {...props} />;
}
