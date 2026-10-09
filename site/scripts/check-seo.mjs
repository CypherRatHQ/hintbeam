// Every page must be findable and shareable. Run after `next build`; fails with the pages to fix.
// - Search: a <title> of 10–70 characters (Bing's limit; Google cuts off near 60) and a description
//   of 50–160.
// - Link previews: Open Graph and X tags naming the page's own URL (its canonical one), title,
//   description and a 1200×630 PNG that exists in the build.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;
const SKIP = new Set(["404.html", "_not-found.html"]);
const SITE = "https://hintbeam.js.org";
const pngIs1200x630 = (file) => {
  const head = readFileSync(file).subarray(0, 24);
  return head.toString("latin1", 1, 4) === "PNG" && head.readUInt32BE(16) === 1200 && head.readUInt32BE(20) === 630;
};
// One pass, so "&amp;quot;" stays "&quot;" instead of being decoded twice.
const ENTITIES = { amp: "&", quot: '"', "#x27": "'", "#39": "'", lt: "<", gt: ">" };
const decode = (s) => s.replace(/&(amp|quot|#x27|#39|lt|gt);/g, (_, name) => ENTITIES[name]);

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

  const meta = (key) => decode(html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1] ?? "");
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  if (!canonical.startsWith(SITE)) problems.push(`${page}: canonical URL is "${canonical}"`);
  if (meta("og:url") !== canonical) problems.push(`${page}: og:url "${meta("og:url")}" is not its canonical URL "${canonical}"`);
  for (const key of ["og:title", "og:description", "og:site_name", "twitter:title", "twitter:description"]) {
    if (!meta(key)) problems.push(`${page}: ${key} is missing`);
  }
  if (meta("twitter:card") !== "summary_large_image") problems.push(`${page}: twitter:card is not summary_large_image`);
  for (const key of ["og:image", "twitter:image"]) {
    const image = meta(key);
    const file = image.startsWith(SITE) ? join(OUT, image.slice(SITE.length)) : "";
    if (!file || !existsSync(file)) problems.push(`${page}: ${key} "${image}" is not a file in the build`);
    else if (!pngIs1200x630(file)) problems.push(`${page}: ${key} "${image}" is not a 1200×630 PNG`);
  }
}
if (problems.length) {
  console.error(`Titles and descriptions to fix:\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("Every page fits search results and has its own link preview.");
