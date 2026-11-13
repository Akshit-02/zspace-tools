// Fixtures for tools 36–40: table PDFs (bank statement over 2 pages, invoice with
// two tables, identifiers) and Excel workbooks (styles, merges, formulas with
// cached results, image, wide/long sheets, several worksheets).
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./fixtures/", import.meta.url);
const png = readFileSync(new URL("quadrants.png", dir));

/* ---------- statement.pdf: 2 pages, repeated header, wrapped description ---------- */
{
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const cols = [40, 115, 330, 410, 490];
  const right = (p, t, x, y, f = reg) => p.drawText(t, { x: x + 70 - f.widthOfTextAtSize(t, 9), y, size: 9, font: f });
  const header = (p, y) => ["Date", "Description", "Debit", "Credit", "Balance"].forEach((h, i) => (i >= 2 ? right(p, h, cols[i], y, bold) : p.drawText(h, { x: cols[i], y, size: 9, font: bold })));
  const rows = [
    ["01/04/2026", ["Opening balance"], "", "", "1,20,000.00"],
    ["02/04/2026", ["UPI/Sharma General Stores", "Ref 004512345678"], "2,500.00", "", "1,17,500.00"],
    ["05/04/2026", ["Salary credit April"], "", "85,000.00", "2,02,500.00"],
    ["07/04/2026", ["Electricity bill"], "(1,250.50)", "", "2,01,249.50"],
  ];
  const page2 = [["10/04/2026", ["Rent transfer"], "20,000.00", "", "1,81,249.50"], ["15/04/2026", ["Interest"], "", "312.00", "1,81,561.50"]];
  const draw = (p, list, y0) => {
    let y = y0;
    for (const [d, desc, dr, cr, bal] of list) {
      p.drawText(d, { x: cols[0], y, size: 9, font: reg });
      desc.forEach((t, i) => p.drawText(t, { x: cols[1], y: y - i * 11, size: 9, font: reg }));
      if (dr) right(p, dr, cols[2], y);
      if (cr) right(p, cr, cols[3], y);
      right(p, bal, cols[4], y);
      y -= 11 * desc.length + 6;
    }
  };
  const p1 = pdf.addPage([595.28, 841.89]);
  p1.drawText("Statement of Account", { x: 40, y: 790, size: 16, font: bold });
  p1.drawText("Account number: 004512345678901 · Period: April 2026", { x: 40, y: 770, size: 9, font: reg });
  header(p1, 740);
  draw(p1, rows, 722);
  const p2 = pdf.addPage([595.28, 841.89]);
  header(p2, 790);
  draw(p2, page2, 772);
  writeFileSync(new URL("statement.pdf", dir), await pdf.save());
}

/* ---------- invoice-tables.pdf: two tables on one page ---------- */
{
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const p = pdf.addPage([595.28, 841.89]);
  p.drawText("Invoice INV-0042", { x: 40, y: 790, size: 18, font: bold });
  const t1 = [["Item", "Qty", "Rate", "Amount"], ["Design work", "10", "₹".length ? "1,500.00" : "", "15,000.00"], ["Hosting (12 months)", "1", "6,000.00", "6,000.00"], ["Domain", "2", "899.00", "1,798.00"]];
  t1.forEach((r, ri) => r.forEach((c, ci) => p.drawText(c, { x: [40, 280, 360, 460][ci], y: 740 - ri * 18, size: 10, font: ri ? reg : bold })));
  p.drawText("Thank you for your business. Payment is due within 15 days of the invoice date.", { x: 40, y: 640, size: 10, font: reg });
  const t2 = [["Tax", "Rate", "Amount"], ["CGST", "9%", "2,060.82"], ["SGST", "9%", "2,060.82"]];
  t2.forEach((r, ri) => r.forEach((c, ci) => p.drawText(c, { x: [40, 200, 360][ci], y: 590 - ri * 18, size: 10, font: ri ? reg : bold })));
  writeFileSync(new URL("invoice-tables.pdf", dir), await pdf.save());
}

/* ---------- ids.pdf: identifiers that must stay text ---------- */
{
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const p = pdf.addPage([595.28, 841.89]);
  const rows = [["Code", "Account", "Phone", "Joined", "Amount"], ["00123", "1234567890123456", "+91 98765 43210", "03/02/2026", "1,500"], ["00456", "9876543210987654", "+44 20 7946 0000", "12/11/2025", "2,750.25"]];
  rows.forEach((r, ri) => r.forEach((c, ci) => p.drawText(c, { x: [40, 110, 240, 360, 470][ci], y: 780 - ri * 18, size: 10, font: reg })));
  writeFileSync(new URL("ids.pdf", dir), await pdf.save());
}

/* ---------- multi-page.pdf for organizer/editor (4 pages, different sizes, one rotated) ---------- */
{
  const pdf = await PDFDocument.create();
  const f = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sizes = [[595.28, 841.89], [612, 792], [841.89, 595.28], [595.28, 841.89]];
  sizes.forEach(([w, h], i) => {
    const p = pdf.addPage([w, h]);
    p.drawText(`PAGE ${i + 1}`, { x: 50, y: h - 80, size: 36, font: f });
    if (i === 3) p.setRotation(degrees(90));
  });
  writeFileSync(new URL("multi-page.pdf", dir), await pdf.save());
}

/* ---------- workbook.xlsx ---------- */
{
  const wb = new ExcelJS.Workbook();
  const s = wb.addWorksheet("Sales");
  s.columns = [{ width: 18 }, { width: 12 }, { width: 14 }, { width: 14 }];
  s.mergeCells("A1:D1");
  s.getCell("A1").value = "Quarterly Sales Report";
  s.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF1F3FA8" } };
  s.getCell("A1").alignment = { horizontal: "center" };
  s.addRow(["Region", "Units", "Revenue", "Share"]);
  s.getRow(2).eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF252525" } };
  });
  const data = [["North", 120, 120000.5], ["South", 95, 98500], ["West", 140, 145250.75]];
  data.forEach((d, i) => {
    const r = s.addRow(d);
    r.getCell(3).numFmt = '"₹"#,##0.00';
    r.getCell(4).value = { formula: `C${i + 3}/SUM(C3:C5)`, result: d[2] / 363751.25 };
    r.getCell(4).numFmt = "0.0%";
    r.eachCell((c) => (c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }));
  });
  const tot = s.addRow(["Total", { formula: "SUM(B3:B5)", result: 355 }, { formula: "SUM(C3:C5)", result: 363751.25 }, ""]);
  tot.font = { bold: true };
  tot.getCell(3).numFmt = '"₹"#,##0.00';
  s.addRow([]);
  s.addRow(["Report date", new Date(Date.UTC(2026, 10, 13))]);
  s.getCell("B8").numFmt = "dd mmm yyyy";
  s.addRow(["Note", "This long note should wrap inside its cell because wrap text is turned on."]);
  s.getCell("B9").alignment = { wrapText: true, vertical: "top" };
  s.mergeCells("B9:D9");
  const img = wb.addImage({ buffer: png, extension: "png" });
  s.addImage(img, { tl: { col: 0, row: 10 }, ext: { width: 160, height: 120 } });
  s.pageSetup.printTitlesRow = "2:2";

  const wide = wb.addWorksheet("Wide");
  wide.addRow(Array.from({ length: 30 }, (_, i) => `Column ${i + 1}`));
  for (let r = 0; r < 20; r++) wide.addRow(Array.from({ length: 30 }, (_, i) => (r + 1) * (i + 1)));
  wide.columns.forEach((c) => (c.width = 12));

  const long = wb.addWorksheet("Long");
  long.addRow(["#", "Item", "Amount"]);
  long.getRow(1).font = { bold: true };
  for (let i = 1; i <= 150; i++) long.addRow([i, `Line item ${i}`, i * 10.5]);
  long.columns = [{ width: 6 }, { width: 30 }, { width: 12 }];
  long.pageSetup.printTitlesRow = "1:1";

  const nf = wb.addWorksheet("Missing");
  nf.addRow(["Value", "Formula"]);
  nf.addRow([5, { formula: "A2*2" }]);
  writeFileSync(new URL("workbook.xlsx", dir), Buffer.from(await wb.xlsx.writeBuffer()));
}
writeFileSync(new URL("legacy.xls", dir), Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(504)]));
writeFileSync(new URL("prices.csv", dir), "Item,Price,Code\nTea,120,007\nCoffee,180.50,012\n\"Biscuits, assorted\",60,099\n");
console.log("sheet fixtures written");
