import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  source: string;
}

const DIR = join(process.cwd(), "content", "blog");

/** A small frontmatter reader: `key: "value"` and `key: ["a", "b"]` lines between `---` fences. */
function parse(file: string): Omit<Post, "slug"> {
  const text = readFileSync(join(DIR, file), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  const data: Record<string, unknown> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const [, key, raw] = kv as unknown as [string, string, string];
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw.replace(/^["']|["']$/g, "");
    }
  }
  return {
    title: String(data.title ?? file),
    description: String(data.description ?? ""),
    date: String(data.date ?? "1970-01-01"),
    author: String(data.author ?? "Hintbeam team"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    source: text.slice(match?.[0].length ?? 0),
  };
}

/** Published posts, newest first. Files starting with `_` are drafts and stay off the site. */
export function getPosts(): Post[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => ({ slug: file.replace(/\.md$/, ""), ...parse(file) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}
