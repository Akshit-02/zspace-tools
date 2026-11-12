import type { Post } from "@/lib/blog-types";
import { post as compressImages } from "./compress-images-without-losing-quality";
import { post as reducePdf } from "./reduce-pdf-file-size";
import { post as qrCode } from "./create-qr-code-for-website";
import { post as countWords } from "./count-words-and-characters";
import { post as passwords } from "./generate-strong-random-password";

/** All posts, newest first (ties keep the order listed here). */
export const posts: Post[] = [compressImages, reducePdf, qrCode, countWords, passwords].sort(
  (a, b) => b.published.localeCompare(a.published),
);

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
