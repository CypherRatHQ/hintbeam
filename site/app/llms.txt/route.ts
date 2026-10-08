import { getPosts } from "@/lib/blog";
import { DOCS } from "@/lib/docs";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** llms.txt (llmstxt.org): a short map of the project for AI assistants and coding agents. */
export function GET() {
  const text = `# ${SITE.name}

> ${SITE.description}

Install with \`npm i hintbeam\`. Entry points: \`hintbeam\` (React for the web, including Next.js), \`hintbeam/native\` (React Native), \`hintbeam/core\` (no React), and router adapters \`hintbeam/next\`, \`hintbeam/react-router\`, \`hintbeam/expo-router\`, \`hintbeam/react-navigation\`. MIT-licensed.

## Docs

${DOCS.map((doc) => `- [${doc.title}](${SITE.url}/docs/${doc.slug}): ${doc.description}`).join("\n")}

## Blog

${getPosts()
  .map((post) => `- [${post.title}](${SITE.url}/blog/${post.slug}): ${post.description}`)
  .join("\n")}

## Optional

- [Everything in one file](${SITE.url}/llms-full.txt): all the docs above as plain Markdown.
- [Source code](${SITE.repo})
- [npm package](${SITE.npm})
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
