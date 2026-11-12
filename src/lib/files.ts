/** Shared upload validation for every file tool. */
export interface ValidateOptions {
  accept: (file: File) => boolean;
  /** Shown in "not a … file" messages, e.g. "JPG, PNG or WebP image". */
  kindLabel: string;
  maxBytes: number;
  maxCount: number;
  /** Files already in the tool. */
  current: number;
}

export function validateFiles(files: File[], o: ValidateOptions) {
  const accepted: File[] = [];
  const rejected: string[] = [];
  const room = o.maxCount - o.current;
  const mb = Math.round(o.maxBytes / 1048576);
  for (const file of files) {
    if (!o.accept(file)) rejected.push(`${file.name}: not a ${o.kindLabel}.`);
    else if (file.size === 0) rejected.push(`${file.name}: the file is empty.`);
    else if (file.size > o.maxBytes) rejected.push(`${file.name}: larger than ${mb} MB.`);
    else if (accepted.length >= room) rejected.push(`${file.name}: limit of ${o.maxCount} files reached.`);
    else accepted.push(file);
  }
  return { accepted, rejected };
}

let uid = 0;
export const fileId = (prefix = "f") => `${prefix}-${Date.now().toString(36)}-${uid++}`;
