"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Drop-in replacement for next/link that does NOT prefetch on viewport entry.
 *
 * The default <Link> prefetches every link the moment it scrolls into view. Pages
 * like the home page and footer render dozens of links, so each visit triggered
 * dozens of RSC requests — each one billed by Vercel as an ISR read plus origin
 * transfer. Here we prefetch only on hover / touch / focus, which still makes the
 * click feel instant but only for links the user actually shows intent on.
 */
export default function Link({ href, onMouseEnter, onTouchStart, onFocus, prefetch, ...rest }: ComponentProps<typeof NextLink>) {
  const router = useRouter();
  const url = typeof href === "string" ? href : null;
  const warm = () => {
    if (url && url.startsWith("/") && !url.startsWith("/#")) router.prefetch(url);
  };
  return (
    <NextLink
      href={href}
      prefetch={prefetch ?? false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}
