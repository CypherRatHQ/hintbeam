import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lastModified } from "./git";
import { MAINTAINER } from "./site";

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** The day the post last changed: `updated` in its frontmatter, else git, else its date. */
  updated: string;
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
  const date = String(data.date ?? "1970-01-01");
  return {
    title: String(data.title ?? file),
    description: String(data.description ?? ""),
    date,
    updated: String(data.updated ?? latest(date, lastModified(`site/content/blog/${file}`))),
    author: String(data.author ?? MAINTAINER.name),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    source: text.slice(match?.[0].length ?? 0),
  };
}

/** The later of two "YYYY-MM-DD" days: a post edited in git before its stated date keeps that date. */
const latest = (a: string, b?: string) => (b && b > a ? b : a);

/** A post's URL comes from its file name, so only plain lowercase words and dashes are allowed. */
function slugOf(file: string): string {
  const slug = file.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Blog post "${file}": name it with lowercase letters, digits and dashes only.`);
  }
  return slug;
}

/** Published posts, newest first. Files starting with `_` are drafts and stay off the site. */
export function getPosts(): Post[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => ({ slug: slugOf(file), ...parse(file) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}
