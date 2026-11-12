import { Code2, FileText, ImageIcon, KeyRound, QrCode, Repeat2, Type, Zap, type LucideProps } from "lucide-react";
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
} satisfies Record<IconName, React.ComponentType<LucideProps>>;

export function ToolIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = map[name];
  return <Icon aria-hidden strokeWidth={1.6} {...props} />;
}
