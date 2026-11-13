/**
 * Prepares an image for placing on a PDF: PNG/JPEG bytes (other formats are
 * re-encoded to PNG), an object URL for the preview, and its pixel size.
 * Optionally removes a near-white background (for photographed signatures).
 */
export interface PlacedImage {
  bytes: Uint8Array;
  mime: "image/png" | "image/jpeg";
  src: string;
  width: number;
  height: number;
}

const MAX_SIDE = 2400;

export async function prepareImage(blob: Blob, opts: { removeWhite?: number; trim?: boolean } = {}): Promise<PlacedImage> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That image couldn't be opened. Use a PNG or JPG file.");
  }
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const keepAsIs = !opts.removeWhite && !opts.trim && (blob.type === "image/png" || blob.type === "image/jpeg") && k === 1;
  if (opts.removeWhite || opts.trim) {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    if (opts.removeWhite) {
      const t = opts.removeWhite; // 0–255: pixels brighter than this become transparent, with a soft edge
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum >= t) d[i + 3] = 0;
        else if (lum > t - 40) d[i + 3] = Math.round((d[i + 3] * (t - lum)) / 40);
      }
      ctx.putImageData(img, 0, 0);
    }
    if (opts.trim) {
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (d[(y * c.width + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 >= x0 && y1 >= y0) {
        const pad = 4;
        x0 = Math.max(0, x0 - pad);
        y0 = Math.max(0, y0 - pad);
        x1 = Math.min(c.width - 1, x1 + pad);
        y1 = Math.min(c.height - 1, y1 + pad);
        const t = document.createElement("canvas");
        t.width = x1 - x0 + 1;
        t.height = y1 - y0 + 1;
        t.getContext("2d")!.drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
        c.width = t.width;
        c.height = t.height;
        c.getContext("2d")!.drawImage(t, 0, 0);
        t.width = t.height = 0;
      }
    }
  }
  let out: Blob;
  if (keepAsIs) out = blob;
  else {
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!b) throw new Error("The image couldn't be prepared.");
    out = b;
  }
  const width = c.width;
  const height = c.height;
  c.width = c.height = 0;
  return { bytes: new Uint8Array(await out.arrayBuffer()), mime: out.type === "image/jpeg" ? "image/jpeg" : "image/png", src: URL.createObjectURL(out), width, height };
}
