/**
 * Overlay objects (text, images, shapes, ink, highlights, notes) drawn on top of
 * existing PDF pages — shared by the PDF Editor and Sign PDF.
 *
 * Objects live in "display space": the page as you see it at 100% (points,
 * origin top-left, y down, page rotation already applied). On export each
 * object is drawn in its own local frame (centre origin, y up, rotated as on
 * screen) mapped into the page's user space with one transformation matrix, so
 * placement matches the preview on any page size, crop box or /Rotate value.
 * The original page content is never rasterised or altered.
 */
import type { PDFDocument, PDFPage } from "pdf-lib";
import { baselineOffset, fontSet, hexToRgb01, type FontLoader, LINE_HEIGHT, needsShaping, textToPng, wrap, type Family, type FontSet } from "./pdf-text";

export type Kind = "text" | "image" | "rect" | "ellipse" | "line" | "arrow" | "highlight" | "underline" | "path" | "note";

export interface OverlayObject {
  id: string;
  kind: Kind;
  page: number; // 0-based
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number; // degrees, clockwise as seen on screen
  color: string; // text / stroke colour
  fill?: string | null; // shape fill
  stroke?: number; // line width (pt)
  opacity?: number;
  // text & note
  text?: string;
  size?: number;
  family?: Family;
  bold?: boolean;
  align?: "left" | "center" | "right";
  // path: points normalised to the box (0–1, y down)
  points?: [number, number][];
  // line/arrow direction: false = top-left → bottom-right, true = bottom-left → top-right
  flip?: boolean;
  // line/arrow drawn from the far end back (arrowhead at the start corner)
  rev?: boolean;
  // image
  src?: string;
  bytes?: Uint8Array;
  mime?: "image/png" | "image/jpeg";
}

export type M = [number, number, number, number, number, number];

export const mul = (a: M, b: M): M => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];

export function invert(m: M): M {
  const det = m[0] * m[3] - m[1] * m[2];
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}

export const apply = (m: M, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/**
 * Display space (scale 1) → PDF user space for a page. Equivalent to the inverse
 * of pdf.js's viewport transform at scale 1, computed from the page box and /Rotate
 * so it can also be built from pdf-lib alone.
 */
export function displayToUser(box: { x: number; y: number; width: number; height: number }, rotate: number): M {
  const { x, y, width: w, height: h } = box;
  const r = ((rotate % 360) + 360) % 360;
  // user → display (same as pdf.js PageViewport at scale 1)
  let u2d: M;
  if (r === 0) u2d = [1, 0, 0, -1, -x, y + h];
  else if (r === 90) u2d = [0, 1, 1, 0, -y, -x];
  else if (r === 180) u2d = [-1, 0, 0, 1, x + w, -y];
  else u2d = [0, -1, -1, 0, y + h, x + w];
  return invert(u2d);
}

/** Display size (scale 1) of a page with the given box and rotation. */
export const displaySize = (box: { width: number; height: number }, rotate: number) => (((rotate % 360) + 360) % 360) % 180 === 0 ? { w: box.width, h: box.height } : { w: box.height, h: box.width };

/** Local object frame (centre origin, y up, rotated) → display space. */
export function localToDisplay(o: Pick<OverlayObject, "x" | "y" | "w" | "h" | "rot">): M {
  const t = (o.rot * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [c, s, s, -c, o.x + o.w / 2, o.y + o.h / 2];
}

/** Text lines exactly as laid out on screen and in the PDF. */
export function textLines(o: Pick<OverlayObject, "text" | "w" | "size" | "family" | "bold">, widthOf: (s: string) => number) {
  return wrap(o.text ?? "", Math.max(4, o.w), widthOf);
}

export const textHeight = (lines: number, size: number) => Math.max(1, lines) * size * LINE_HEIGHT;

let uid = 0;
export const newId = () => `o${Date.now().toString(36)}${(uid++).toString(36)}`;

/* ---------------- Export ---------------- */

async function draw(doc: PDFDocument, page: PDFPage, o: OverlayObject, fonts: FontSet, images: Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>) {
  const P = await import("pdf-lib");
  const { r, g, b } = hexToRgb01(o.color);
  const color = P.rgb(r, g, b);
  const fill = o.fill ? (({ r, g, b }) => P.rgb(r, g, b))(hexToRgb01(o.fill)) : undefined;
  const w = o.w;
  const h = o.h;
  const sw = o.stroke ?? 2;
  const opacity = o.opacity ?? 1;
  const ops = () => page.pushOperators.bind(page);
  switch (o.kind) {
    case "image": {
      if (!o.bytes) return;
      const key = o.src ?? o.id; // the same image (e.g. a tiled logo) is embedded once
      let img = images.get(key);
      if (!img) {
        img = o.mime === "image/jpeg" ? await doc.embedJpg(o.bytes) : await doc.embedPng(o.bytes);
        images.set(key, img);
      }
      page.drawImage(img, { x: -w / 2, y: -h / 2, width: w, height: h, opacity });
      return;
    }
    case "text": {
      const size = o.size ?? 14;
      const family = o.family ?? "sans";
      const text = o.text ?? "";
      if (!text.trim()) return;
      if (needsShaping(text)) {
        const { measure } = await import("./pdf-text");
        const lines = wrap(text, Math.max(4, w), (s) => measure(s, size, family, !!o.bold));
        const png = await textToPng(lines, size, family, !!o.bold, o.color, w);
        const img = await doc.embedPng(png.bytes);
        page.drawImage(img, { x: -w / 2, y: h / 2 - png.height, width: png.width, height: png.height, opacity });
        return;
      }
      const font = await fonts.pick(family, !!o.bold, text);
      const lines = wrap(text, Math.max(4, w), (s) => font.widthOfTextAtSize(s, size));
      lines.forEach((line, i) => {
        if (!line) return;
        const y = h / 2 - i * size * LINE_HEIGHT - baselineOffset(family, size);
        const lw = font.widthOfTextAtSize(line, size);
        const x = o.align === "right" ? w / 2 - lw : o.align === "center" ? -lw / 2 : -w / 2;
        page.drawText(line, { x, y, size, font, color, opacity });
      });
      return;
    }
    case "rect":
    case "highlight":
      page.drawRectangle({
        x: -w / 2,
        y: -h / 2,
        width: w,
        height: h,
        color: o.kind === "highlight" ? color : fill,
        opacity: o.kind === "highlight" ? (o.opacity ?? 0.35) : fill ? opacity : undefined,
        borderColor: o.kind === "highlight" ? undefined : color,
        borderWidth: o.kind === "highlight" ? 0 : sw,
        borderOpacity: opacity,
        blendMode: o.kind === "highlight" ? P.BlendMode.Multiply : undefined,
      });
      return;
    case "ellipse":
      page.drawEllipse({ x: 0, y: 0, xScale: w / 2, yScale: h / 2, color: fill, opacity: fill ? opacity : undefined, borderColor: color, borderWidth: sw, borderOpacity: opacity });
      return;
    case "underline":
      page.drawLine({ start: { x: -w / 2, y: 0 }, end: { x: w / 2, y: 0 }, thickness: sw, color, opacity });
      return;
    case "line":
    case "arrow": {
      let start = o.flip ? { x: -w / 2, y: -h / 2 } : { x: -w / 2, y: h / 2 };
      let end = o.flip ? { x: w / 2, y: h / 2 } : { x: w / 2, y: -h / 2 };
      if (o.rev) [start, end] = [end, start];
      page.drawLine({ start, end, thickness: sw, color, opacity, lineCap: P.LineCapStyle.Round });
      if (o.kind === "arrow") {
        const a = Math.atan2(end.y - start.y, end.x - start.x);
        const len = Math.max(8, sw * 4);
        for (const d of [-0.45, 0.45]) {
          page.drawLine({ start: end, end: { x: end.x - len * Math.cos(a + d), y: end.y - len * Math.sin(a + d) }, thickness: sw, color, opacity, lineCap: P.LineCapStyle.Round });
        }
      }
      return;
    }
    case "path": {
      const pts = (o.points ?? []).map(([px, py]) => [px * w - w / 2, h / 2 - py * h] as const);
      if (pts.length < 2) return;
      ops()(
        P.pushGraphicsState(),
        P.setStrokingRgbColor(color.red, color.green, color.blue),
        P.setLineWidth(sw),
        P.setLineCap(P.LineCapStyle.Round),
        P.setLineJoin(P.LineJoinStyle.Round),
        P.moveTo(pts[0][0], pts[0][1]),
        ...pts.slice(1).map(([x, y]) => P.lineTo(x, y)),
        P.stroke(),
        P.popGraphicsState(),
      );
      return;
    }
  }
}

/** Adds a real PDF sticky-note (/Text) annotation, shown by PDF readers as a note icon. */
async function addNote(doc: PDFDocument, page: PDFPage, o: OverlayObject, d2u: M) {
  const P = await import("pdf-lib");
  const [x1, y1] = apply(d2u, o.x, o.y);
  const [x2, y2] = apply(d2u, o.x + o.w, o.y + o.h);
  const { r, g, b } = hexToRgb01(o.color);
  const annot = doc.context.obj({
    Type: "Annot",
    Subtype: "Text",
    Rect: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)],
    Contents: P.PDFHexString.fromText(o.text ?? ""),
    Name: "Comment",
    C: [r, g, b],
    Open: false,
    M: P.PDFString.fromDate(new Date()),
    T: P.PDFHexString.fromText("ZSpace Tools"),
  });
  const ref = doc.context.register(annot);
  const annots = page.node.Annots();
  if (annots) annots.push(ref);
  else page.node.set(P.PDFName.of("Annots"), doc.context.obj([ref]));
}

/**
 * Returns a new PDF with the overlays drawn on. `bytes` (the original file) is
 * never modified.
 */
export async function exportWithOverlays(bytes: Uint8Array, objects: OverlayObject[], opts: { flatten?: boolean; loadFont?: FontLoader } = {}) {
  const P = await import("pdf-lib");
  const doc = await P.PDFDocument.load(bytes, { updateMetadata: false });
  const fonts = fontSet(doc, opts.loadFont);
  const images = new Map();
  const pages = doc.getPages();
  for (const o of objects) {
    const page = pages[o.page];
    if (!page) continue;
    const box = page.getCropBox();
    const d2u = displayToUser(box, page.getRotation().angle);
    if (o.kind === "note" && !opts.flatten) {
      await addNote(doc, page, o, d2u);
      continue;
    }
    const m = mul(d2u, localToDisplay(o));
    page.pushOperators(P.pushGraphicsState(), P.concatTransformationMatrix(m[0], m[1], m[2], m[3], m[4], m[5]));
    await draw(doc, page, o.kind === "note" ? { ...o, kind: "text" } : o, fonts, images);
    page.pushOperators(P.popGraphicsState());
  }
  doc.setProducer("ZSpace Tools");
  return doc.save();
}
