// Every page's <title> and meta description must fit what search engines show: a title of at most
// 70 characters (Bing's limit; Google cuts off near 60) and a description of 50 to 160. Run after
// `next build`; fails the build with the pages to fix.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;
const SKIP = new Set(["404.html", "_not-found.html"]);
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pages(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
  );

const problems = [];
for (const file of pages(OUT)) {
  const page = relative(OUT, file);
  if (SKIP.has(page)) continue;
  const html = readFileSync(file, "utf8");
  if (!html.includes("<html")) continue; // a verification file, not a page
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  if (title.length < 10 || title.length > 70) problems.push(`${page}: title is ${title.length} characters (10–70): "${title}"`);
  if (description.length < 50 || description.length > 160)
    problems.push(`${page}: description is ${description.length} characters (50–160): "${description}"`);
}
if (problems.length) {
  console.error(`Titles and descriptions to fix:\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("Every page's title and description fits search results.");
