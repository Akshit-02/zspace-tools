// Copies pdf.js runtime assets (worker, standard fonts, CMaps) into /public so
// they are served from our own origin (CSP: worker-src 'self'). Generated —
// public/pdfjs is git-ignored. Runs on postinstall, predev and prebuild.
import { cpSync, mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const src = join(root, "node_modules/pdfjs-dist");
if (!existsSync(src)) process.exit(0);
const { version } = JSON.parse(readFileSync(join(src, "package.json"), "utf8"));
const out = join(root, "public/pdfjs");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(src, "build/pdf.worker.min.mjs"), join(out, `pdf.worker.${version}.min.mjs`));
cpSync(join(src, "standard_fonts"), join(out, "standard_fonts"), { recursive: true });
cpSync(join(src, "cmaps"), join(out, "cmaps"), { recursive: true });
console.log(`pdf.js ${version} assets copied to public/pdfjs`);
