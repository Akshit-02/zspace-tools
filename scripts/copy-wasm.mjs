// Copies OCR and image-codec runtime assets into /public so they're served from
// our own origin (CSP 'self'; no CDN): Tesseract worker + LSTM cores, the six
// language models (4.0.0_best_int) and the AVIF encoder wasm. Generated —
// git-ignored. Runs on postinstall, predev and prebuild.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const nm = (p) => join(root, "node_modules", p);
if (!existsSync(nm("tesseract.js"))) process.exit(0);

const tjs = JSON.parse(readFileSync(nm("tesseract.js/package.json"), "utf8")).version;
const core = JSON.parse(readFileSync(nm("tesseract.js-core/package.json"), "utf8")).version;
const out = join(root, "public/ocr");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "core"), { recursive: true });
mkdirSync(join(out, "lang"), { recursive: true });
cpSync(nm("tesseract.js/dist/worker.min.js"), join(out, "worker.min.js"));
for (const v of ["", "-simd", "-relaxedsimd"]) {
  for (const ext of [".wasm.js", ".js", ".wasm"]) cpSync(nm(`tesseract.js-core/tesseract-core${v}-lstm${ext}`), join(out, "core", `tesseract-core${v}-lstm${ext}`));
}
for (const lang of ["eng", "hin", "guj", "spa", "fra", "deu"]) cpSync(nm(`@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`), join(out, "lang", `${lang}.traineddata.gz`));

const wasm = join(root, "public/wasm");
rmSync(wasm, { recursive: true, force: true });
mkdirSync(wasm, { recursive: true });
const avif = JSON.parse(readFileSync(nm("@jsquash/avif/package.json"), "utf8")).version;
cpSync(nm("@jsquash/avif/codec/enc/avif_enc.wasm"), join(wasm, "avif_enc.wasm"));
cpSync(nm("@jsquash/avif/codec/dec/avif_dec.wasm"), join(wasm, "avif_dec.wasm"));
console.log(`OCR (tesseract.js ${tjs}, core ${core}) and AVIF encoder ${avif} copied to public/`);
cpSync(nm("@neslinesli93/qpdf-wasm/dist/qpdf.wasm"), join(wasm, "qpdf.wasm"));
