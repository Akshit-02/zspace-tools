import QRCode from "qrcode";

export type QrType = "url" | "text" | "email" | "phone" | "wifi";
export type Ecc = "L" | "M" | "Q" | "H";

export interface QrFields {
  url: string;
  text: string;
  email: string;
  subject: string;
  body: string;
  phone: string;
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

/** Escape special characters for the Wi-Fi QR (ZXing "MECARD-like") format. */
export function escapeWifi(v: string) {
  return v.replace(/([\;,:"])/g, "\\$1");
}

/** Builds the standard payload string for each QR type. Returns "" if incomplete. */
export function buildPayload(type: QrType, f: QrFields): string {
  switch (type) {
    case "url": {
      const v = f.url.trim();
      if (!v) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
    }
    case "text":
      return f.text;
    case "email": {
      const to = f.email.trim();
      if (!to) return "";
      const params = [
        f.subject && `subject=${encodeURIComponent(f.subject)}`,
        f.body && `body=${encodeURIComponent(f.body)}`,
      ].filter(Boolean);
      return `mailto:${to}${params.length ? `?${params.join("&")}` : ""}`;
    }
    case "phone": {
      const v = f.phone.trim().replace(/[^\d+*#]/g, "");
      return v ? `tel:${v}` : "";
    }
    case "wifi": {
      if (!f.ssid) return "";
      const parts = [`T:${f.security}`, `S:${escapeWifi(f.ssid)}`];
      if (f.security !== "nopass") parts.push(`P:${escapeWifi(f.password)}`);
      if (f.hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }
  }
}

export interface Matrix {
  size: number;
  get: (x: number, y: number) => boolean;
}

/** Logo width as a fraction of the full symbol (verified scannable at ECC H, version ≥ 4). */
export const LOGO_SCALE = 0.2;
const LOGO_MIN_VERSION = 4;

export function makeMatrix(payload: string, ecc: Ecc, withLogo = false): Matrix {
  let qr = QRCode.create(payload, { errorCorrectionLevel: ecc });
  // Tiny symbols have too few modules around the centre to tolerate a logo.
  if (withLogo && qr.version < LOGO_MIN_VERSION) {
    qr = QRCode.create(payload, { errorCorrectionLevel: ecc, version: LOGO_MIN_VERSION });
  }
  const { size, data } = qr.modules;
  return { size, get: (x, y) => Boolean(data[y * size + x]) };
}

/** One compact SVG path for all dark modules (merges horizontal runs). */
export function modulesPath(m: Matrix, margin: number) {
  let d = "";
  for (let y = 0; y < m.size; y++) {
    let x = 0;
    while (x < m.size) {
      if (!m.get(x, y)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < m.size && m.get(x + run, y)) run++;
      d += `M${x + margin} ${y + margin}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return d;
}

export interface RenderOpts {
  fg: string;
  bg: string;
  margin: number;
  logo?: { dataUrl: string; scale: number } | null;
}

export function toSvg(m: Matrix, o: RenderOpts) {
  const n = m.size + o.margin * 2;
  let logo = "";
  if (o.logo) {
    const box = n * o.logo.scale;
    const pad = box * 0.12;
    const x = (n - box) / 2;
    logo =
      `<rect x="${x - pad}" y="${x - pad}" width="${box + pad * 2}" height="${box + pad * 2}" rx="${pad * 1.4}" fill="${o.bg}"/>` +
      `<image href="${o.logo.dataUrl}" x="${x}" y="${x}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">` +
    `<rect width="${n}" height="${n}" fill="${o.bg}"/>` +
    `<path fill="${o.fg}" d="${modulesPath(m, o.margin)}"/>` +
    logo +
    `</svg>`
  );
}

/** WCAG relative luminance contrast between two hex colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [x, y] = [lum(a), lum(b)];
  return { ratio: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05), inverted: x > y };
}
