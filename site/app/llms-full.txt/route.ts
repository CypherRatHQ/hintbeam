import { DOCS } from "@/lib/docs";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Every docs page as one Markdown file, for assistants that read a whole project at once. */
export function GET() {
  const text = `# ${SITE.name} — full documentation\n\n> ${SITE.description}\n\n${DOCS.map((doc) => `<!-- ${SITE.url}/docs/${doc.slug} -->\n\n${doc.source.trim()}`).join("\n\n---\n\n")}\n`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
