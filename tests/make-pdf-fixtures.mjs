// Generates PDF fixtures with pdf-lib: an image-heavy PDF (embedded high-quality JPEGs),
// a text-only PDF, and a PDF with an /Encrypt dictionary.
import { PDFDocument, StandardFonts, PDFName } from "pdf-lib";
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./fixtures/", import.meta.url);
const jpg = readFileSync(new URL("photo-rotated.jpg", dir));

const heavy = await PDFDocument.create();
const font = await heavy.embedFont(StandardFonts.Helvetica);
const image = await heavy.embedJpg(jpg);
for (let i = 0; i < 3; i++) {
  const page = heavy.addPage([595, 842]);
  page.drawText(`Selectable text on page ${i + 1} — ZSpace Tools test`, { x: 50, y: 790, size: 16, font });
  page.drawImage(image, { x: 50, y: 300, width: 495, height: 371 });
}
writeFileSync(new URL("image-heavy.pdf", dir), await heavy.save());

const text = await PDFDocument.create();
const f2 = await text.embedFont(StandardFonts.TimesRoman);
for (let i = 0; i < 4; i++) {
  const p = text.addPage();
  for (let l = 0; l < 40; l++) p.drawText(`Line ${l} of a text-only document. Nothing here to compress.`, { x: 40, y: 760 - l * 18, size: 11, font: f2 });
}
writeFileSync(new URL("text-only.pdf", dir), await text.save({ useObjectStreams: true }));

const enc = await PDFDocument.create();
enc.addPage().drawText("secret", { x: 50, y: 700 });
enc.context.trailerInfo.Encrypt = enc.context.register(
  enc.context.obj({ Filter: "Standard", V: 2, R: 3, Length: 128, P: -4, O: PDFName.of("x"), U: PDFName.of("y") }),
);
writeFileSync(new URL("encrypted.pdf", dir), await enc.save());
// 20 pages; page N is (300 + 5·(N−1)) pt wide so tests can identify pages in any output.
const numbered = await PDFDocument.create();
const f3 = await numbered.embedFont(StandardFonts.HelveticaBold);
for (let n = 1; n <= 20; n++) {
  const w = 300 + 5 * (n - 1);
  const p = numbered.addPage([w, 420]);
  p.drawText(`Page ${n}`, { x: 40, y: 200, size: 48, font: f3 });
}
writeFileSync(new URL("pages-20.pdf", dir), await numbered.save());
console.log("pdfs ok");
