import { marked } from "marked";
import { highlight } from "./highlight";
import { BASE_PATH } from "./site";

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Markdown to HTML with heading ids, a table of contents and highlighted code — at build time. */
export function renderMarkdown(source: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const html = marked.Parser.parseInline(tokens);
    const id = slugify(html);
    if (depth === 2 || depth === 3) toc.push({ id, text: html.replace(/<[^>]+>/g, ""), depth });
    return `<h${depth} id="${id}">${html}</h${depth}>`;
  };
  renderer.code = ({ text, lang }) => `<pre><code>${highlight(text, lang || "tsx")}</code></pre>`;
  const html = (marked.parse(source, { async: false, renderer }) as string).replace(
    /href="(?:\.\/)?([a-z-]+)\.md(#[^"]*)?"/g,
    (_, slug: string, hash = "") => `href="${BASE_PATH}/docs/${slug}${hash}"`,
  );
  return { html, toc };
}

/** The first paragraph of plain text, for a page description. */
export function firstParagraph(source: string, max = 155): string {
  const paragraph =
    source
      .replace(/^---[\s\S]*?---\s*/, "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#") && !p.startsWith("```") && !p.startsWith("|") && !p.startsWith(">") && !p.startsWith("-")) ?? "";
  const text = paragraph
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : text;
}
