declare module "libheif-js/wasm-bundle" {
  const lib: unknown;
  export default lib;
}

declare module "@jsquash/avif/codec/enc/avif_enc.js";
declare module "@jsquash/avif/codec/dec/avif_dec.js";

declare module "exceljs/dist/exceljs.min.js" {
  const ExcelJS: typeof import("exceljs");
  export default ExcelJS;
}
