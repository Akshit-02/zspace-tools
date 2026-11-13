// Fixtures for tools 31–35: a structured text PDF (headings, paragraphs, table,
// image, centred line, 2 pages), a two-column PDF, DOCX files (via `docx`),
// a fake legacy .doc, an animated GIF and a corrupted JPEG.
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as D from "docx";
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./fixtures/", import.meta.url);
const png = readFileSync(new URL("quadrants.png", dir));

/* ---------- report.pdf ---------- */
{
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const img = await pdf.embedPng(png);
  const p = pdf.addPage([595.28, 841.89]);
  let y = 780;
  p.drawText("Quarterly Report", { x: 56, y, size: 26, font: bold });
  y -= 40;
  const para = [
    "This report summarises the results for the third quarter. Revenue grew",
    "steadily across every region, and operating costs stayed within the",
    "budget agreed at the start of the year.",
  ];
  for (const l of para) {
    p.drawText(l, { x: 56, y, size: 11, font: reg });
    y -= 15;
  }
  y -= 6;
  p.drawText("Figures are unaudited and may change.", { x: 56, y, size: 11, font: ital });
  y -= 34;
  p.drawText("Regional results", { x: 56, y, size: 17, font: bold });
  y -= 26;
  const rows = [["Region", "Revenue", "Growth"], ["North", "1,20,000", "12%"], ["South", "98,500", "8%"], ["West", "1,45,250", "15%"]];
  for (const r of rows) {
    r.forEach((c, i) => p.drawText(c, { x: 56 + i * 150, y, size: 11, font: r === rows[0] ? bold : reg }));
    y -= 18;
  }
  y -= 20;
  p.drawImage(img, { x: 56, y: y - 150, width: 200, height: 150 });
  y -= 180;
  p.drawText("Thank you for reading", { x: (595.28 - reg.widthOfTextAtSize("Thank you for reading", 12)) / 2, y, size: 12, font: reg });
  const p2 = pdf.addPage([595.28, 841.89]);
  p2.drawText("Next steps", { x: 56, y: 780, size: 17, font: bold });
  ["We will expand the sales team in the West and review pricing", "in the South before the next quarter begins."].forEach((l, i) => p2.drawText(l, { x: 56, y: 750 - i * 15, size: 11, font: reg }));
  writeFileSync(new URL("report.pdf", dir), await pdf.save());
}

/* ---------- two-column.pdf ---------- */
{
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const p = pdf.addPage([595.28, 841.89]);
  p.drawText("Newsletter Title Across Both Columns", { x: 56, y: 780, size: 20, font: bold });
  for (let i = 0; i < 14; i++) {
    p.drawText(`Left column line ${i + 1} continues here`, { x: 56, y: 740 - i * 14, size: 10, font: reg });
    p.drawText(`Right column line ${i + 1} continues here`, { x: 320, y: 740 - i * 14, size: 10, font: reg });
  }
  writeFileSync(new URL("two-column.pdf", dir), await pdf.save());
}

/* ---------- blank-ish corrupted PDF ---------- */
writeFileSync(new URL("corrupt.pdf", dir), Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog >> broken stream without xref\n"));

/* ---------- DOCX ---------- */
{
  const cell = (t, b = false) => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: t, bold: b })] })] });
  const doc = new D.Document({
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        headers: { default: new D.Header({ children: [new D.Paragraph({ children: [new D.TextRun("ZSpace Header Text")] })] }) },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ children: [new D.TextRun("Confidential footer")] })] }) },
        children: [
          new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun("Project Proposal")] }),
          new D.Paragraph({ children: [new D.TextRun("This proposal describes the scope, budget and timeline. "), new D.TextRun({ text: "Bold words", bold: true }), new D.TextRun(" and "), new D.TextRun({ text: "italic words", italics: true }), new D.TextRun(".")] }),
          new D.Table({ rows: [new D.TableRow({ children: [cell("Item", true), cell("Cost", true)] }), new D.TableRow({ children: [cell("Design"), cell("₹40,000")] }), new D.TableRow({ children: [cell("Build"), cell("₹1,10,000")] })] }),
          new D.Paragraph({ children: [new D.ImageRun({ type: "png", data: png, transformation: { width: 200, height: 150 } })] }),
          new D.Paragraph({ children: [new D.PageBreak()] }),
          new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun("Second Page Heading")] }),
          new D.Paragraph("Text on the second page."),
        ],
      },
    ],
  });
  writeFileSync(new URL("proposal.docx", dir), await D.Packer.toBuffer(doc));
  const land = new D.Document({
    sections: [{ properties: { page: { size: { width: 12240, height: 15840, orientation: D.PageOrientation.LANDSCAPE } } }, children: [new D.Paragraph("Landscape Letter document")] }],
  });
  writeFileSync(new URL("landscape.docx", dir), await D.Packer.toBuffer(land));
  const long = new D.Document({ sections: [{ children: Array.from({ length: 120 }, (_, i) => new D.Paragraph(`Flowing paragraph number ${i + 1} with enough words to take up a full line of text on the page.`)) }] });
  writeFileSync(new URL("long.docx", dir), await D.Packer.toBuffer(long));
}
writeFileSync(new URL("legacy.doc", dir), Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(504)]));
writeFileSync(new URL("not-word.docx", dir), Buffer.from("PK\u0003\u0004 this is not really a zip"));

/* ---------- images ---------- */
const frame = [0x21, 0xf9, 0x04, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0x02, 0x02, 0x44, 0x01, 0x00];
writeFileSync(new URL("animated.gif", dir), Buffer.from([...Buffer.from("GIF89a"), 1, 0, 1, 0, 0x80, 0, 0, 0xff, 0xff, 0xff, 0, 0, 0, ...frame, ...frame, 0x3b]));
writeFileSync(new URL("corrupt.jpg", dir), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("garbage that is not a real jpeg")]));
console.log("conversion fixtures written");
