/**
 * Privacy-safe event tracking. Sends to GA4 (gtag) or GTM (dataLayer) only if
 * configured; otherwise a no-op. Parameters are restricted to a whitelist of
 * primitive, non-sensitive fields — never pass file names, text, URLs that a
 * user typed, QR contents or passwords.
 */
export type EventName =
  | "tool_opened"
  | "file_uploaded"
  | "compression_completed"
  | "qr_generated"
  | "password_generated"
  | "download_clicked"
  | "copy_clicked";

type SafeParams = {
  tool?: string;
  file_count?: number;
  file_type?: string; // MIME family, e.g. "image/png" — never a filename
  size_bucket?: string;
  reduction_pct?: number;
  level?: string;
  qr_type?: string;
  format?: string;
  count?: number;
  length?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function sizeBucket(bytes: number) {
  const mb = bytes / 1048576;
  if (mb < 0.1) return "<100KB";
  if (mb < 1) return "100KB-1MB";
  if (mb < 5) return "1-5MB";
  if (mb < 20) return "5-20MB";
  return "20MB+";
}

export function track(event: EventName, params: SafeParams = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...params });
    }
  } catch {
    // Analytics must never break a tool.
  }
}
