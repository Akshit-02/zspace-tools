import { tools, getCategory, type Tool } from "./tools";

export interface SearchHit {
  tool: Tool;
  score: number;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, " ");

/** Lightweight weighted search over the tool registry. Runs client-side, instantly. */
export function searchTools(query: string, limit = 8): SearchHit[] {
  const q = norm(query).trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 1 || q.length === 1);
  const hits: SearchHit[] = [];
  for (const tool of tools) {
    const name = norm(tool.name);
    const fields = [
      { text: name, w: 10 },
      { text: tool.searchTerms.map(norm).join(" "), w: 6 },
      { text: norm([tool.seo.keyword, ...tool.seo.secondary].join(" ")), w: 5 },
      { text: norm(getCategory(tool.category).name), w: 3 },
      { text: norm(tool.short), w: 2 },
      { text: norm(tool.formats.join(" ")), w: 4 },
    ];
    let score = name.startsWith(q) ? 25 : name.includes(q) ? 15 : 0;
    let matched = 0;
    for (const term of terms) {
      let best = 0;
      for (const f of fields) {
        if (f.text.includes(term)) best = Math.max(best, f.w);
        else if (term.length > 3 && f.text.includes(term.slice(0, -1))) best = Math.max(best, f.w * 0.6);
      }
      if (best > 0) matched++;
      score += best;
    }
    if (matched === 0 && score === 0) continue;
    // Require most terms to match for multi-word queries.
    if (terms.length > 2 && matched < Math.ceil(terms.length / 2) && score < 15) continue;
    hits.push({ tool, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
