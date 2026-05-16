import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface ToolCardProps {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  accentColor?: string;
  popular?: boolean;
}

export default function ToolCard({
  name,
  description,
  href,
  icon: Icon,
  badge,
  badgeColor = "bg-zest-500/10 text-zest-500",
  accentColor = "text-zest-500 bg-zest-50",
  popular,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="tool-card group block"
      aria-label={`Open ${name}`}
    >
      {/* Hover glow bg */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zest-500/0 to-zest-500/0 group-hover:from-zest-500/3 group-hover:to-transparent transition-all duration-500" />

      <div className="relative">
        {/* Icon */}
        <div
          className={`w-11 h-11 rounded-xl ${accentColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-semibold text-base text-ink-800 group-hover:text-ink-900 transition-colors">
            {name}
          </h3>
          {popular && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-600">
              Popular
            </span>
          )}
          {badge && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-4 group-hover:text-gray-600 transition-colors">
          {description}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1 text-sm font-medium text-zest-500 group-hover:gap-2 transition-all">
          Use Tool
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
