import { buildPayload, type QrType, type QrFields, makeMatrix, toSvg, LOGO_SCALE } from "../src/lib/qr";
import jsQR from "jsqr";
const base = { url: "", text: "", email: "", subject: "", body: "", phone: "", ssid: "", password: "", security: "WPA" as QrFields["security"], hidden: false };
const cases: [QrType, QrFields][] = [
  ["url", { ...base, url: "zspace.in/tools?a=1" }],
  ["text", { ...base, text: "Hello, ZSpace — ünïcödé ✓" }],
  ["email", { ...base, email: "hi@example.com", subject: "Hi there", body: "Line & more" }],
  ["phone", { ...base, phone: "+91 98765 43210" }],
  ["wifi", { ...base, ssid: 'My;Net"work', password: "p@ss:w,rd\\" }],
];
for (const [type, f] of cases) {
  for (const ecc of ["L", "H"] as const) {
    const payload = buildPayload(type, f);
    const m = makeMatrix(payload, ecc, ecc === "H");
    const scale = 8, margin = 4, n = (m.size + margin * 2) * scale;
    const px = new Uint8ClampedArray(n * n * 4).fill(255);
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.get(x, y))
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const i = (((y + margin) * scale + dy) * n + (x + margin) * scale + dx) * 4; px[i] = px[i + 1] = px[i + 2] = 0; }
    // simulate centered logo covering 22% width at ECC H
    if (ecc === "H") { const b = Math.floor(n * LOGO_SCALE * 1.24), s = Math.floor((n - b) / 2); for (let y = s; y < s + b; y++) for (let x = s; x < s + b; x++) { const i = (y * n + x) * 4; px[i] = px[i+1] = px[i+2] = 255; } }
    const r = jsQR(px, n, n);
    const ok = r?.data === payload; if (!ok) process.exitCode = 1;
    console.log(type, ecc === "H" ? "H+logo" : ecc, ok ? "OK" : "FAIL", JSON.stringify(payload));
  }
}
console.log(toSvg(makeMatrix("hi", "M"), { fg: "#252525", bg: "#fff", margin: 4 }).slice(0, 160));
