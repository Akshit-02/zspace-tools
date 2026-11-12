// Checks UPNG quantisation keeps fully-opaque and fully-transparent pixels exact.
import UPNG from "upng-js";
import { PNG } from "pngjs";
import { readFileSync } from "node:fs";
import { pngColours } from "../src/lib/image-compress";

const src = PNG.sync.read(readFileSync(new URL("./fixtures/transparent.png", import.meta.url)));
const count = (d: Uint8Array) => {
  let opaque = 0, clear = 0;
  for (let i = 3; i < d.length; i += 4) { if (d[i] === 255) opaque++; else if (d[i] === 0) clear++; }
  return { opaque, clear };
};
const before = count(src.data);
console.log("source", before);
for (const q of [0.9, 0.75, 0.4, 0.1]) {
  const enc = UPNG.encode([new Uint8Array(src.data).buffer], src.width, src.height, pngColours(q));
  const dec = PNG.sync.read(Buffer.from(enc));
  const after = count(dec.data);
  const ok = after.opaque === before.opaque && after.clear === before.clear;
  if (!ok) process.exitCode = 1;
  console.log(`${ok ? "PASS" : "FAIL"} q=${q} colours=${pngColours(q)} bytes=${enc.byteLength}`, after);
}
