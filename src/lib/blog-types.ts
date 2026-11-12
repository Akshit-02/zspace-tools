/**
 * Blog content model. Articles are typed data (src/content/blog/*.ts), rendered
 * by src/components/ArticleBody.tsx. Inline text in `p`, list items, callouts
 * and table cells supports a tiny markup subset:
 *   **bold**   `code`   [link text](/internal-path/ or https://…)
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title?: string; text: string }
  | { type: "tool"; slug: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "example"; title: string; text: string };

export interface Post {
  slug: string;
  title: string;
  /** Meta description, ~150 characters. */
  description: string;
  /** Card / listing excerpt, 1–2 sentences. */
  excerpt: string;
  keyword: string;
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  /** Tool slugs this article supports; the first is the primary CTA. */
  tools: string[];
  body: Block[];
  faqs?: { q: string; a: string }[];
}
