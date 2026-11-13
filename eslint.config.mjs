import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated vendor assets (pdf.js worker), copied by scripts/copy-pdfjs.mjs
    "public/pdfjs/**",
    // OCR engine, language data and AVIF codec, copied by scripts/copy-wasm.mjs
    "public/ocr/**",
    "public/wasm/**",
  ]),
]);

export default eslintConfig;
