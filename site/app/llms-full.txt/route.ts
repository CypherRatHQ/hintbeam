import { DOCS } from "@/lib/docs";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Links between docs files, made absolute so they still work in one standalone file. */
const absolute = (markdown: string) =>
  markdown
    .replace(/\]\((?:\.\/)?([a-z-]+)\.md(#[^)]*)?\)/g, (_, slug: string, hash = "") => `](${SITE.url}/docs/${slug}${hash})`)
    .replace(/\]\(\.\.\/([^)]+)\)/g, (_, path: string) => `](${SITE.repo}/blob/main/${path})`);

/** Every docs page as one Markdown file, for assistants that read a whole project at once. */
export function GET() {
  const text = `# ${SITE.name} — full documentation\n\n> ${SITE.description}\n\n${DOCS.map((doc) => `<!-- ${SITE.url}/docs/${doc.slug} -->\n\n${absolute(doc.source.trim())}`).join("\n\n---\n\n")}\n`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
