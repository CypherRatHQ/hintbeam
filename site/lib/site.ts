/** The path the site is served under: "" at hintbeam.js.org (see next.config.ts). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A temporary preview under a sub-path (before the custom domain is set): kept out of search. */
export const IS_PREVIEW = BASE_PATH !== "";

/**
 * Structured data for a `<script type="application/ld+json">`. `JSON.stringify` leaves `<`, `>`
 * and `&` as they are, so a value containing `</script>` would end the script early: escape them.
 */
export const jsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/[<>&]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

/**
 * A page's <title>: "Page · Hintbeam", unless the page already names Hintbeam or the suffix would
 * push it past 60 characters (search results cut longer titles off).
 */
export const pageTitle = (title: string): string | { absolute: string } =>
  title.includes("Hintbeam") || `${title} · Hintbeam`.length > 60 ? { absolute: title } : title;

/** Who writes and maintains Hintbeam: credited in the footer and as the author of posts. */
export const MAINTAINER = { name: "CypherRat", url: "https://github.com/CypherRat" } as const;
export const ORG = { name: "CypherRat HQ", url: "https://github.com/CypherRatHQ" } as const;

/** What the playground is, for its search and link-preview description. */
export const PLAYGROUND_DESCRIPTION =
  "Try Hintbeam on a small demo app: play a product tour across four pages, change the style, brand colour and language, and copy the theme into your app.";

/** Facts about the site used in metadata, the sitemap, feeds and llms.txt. */
export const SITE = {
  name: "Hintbeam",
  url: "https://hintbeam.js.org",
  repo: "https://github.com/CypherRatHQ/hintbeam",
  npm: "https://www.npmjs.com/package/hintbeam",
  tagline: "Guided flows and product tours for React, Next.js and React Native",
  /** The home page title: at most 60 characters, so search results show it whole. */
  title: "Hintbeam: product tours for React, Next.js and React Native",
  description:
    "Open-source product tours for React, Next.js and React Native. Tours point at named targets, not CSS selectors, so they survive refactors and page changes.",
} as const;

/** The site as the publisher of its docs and posts, with its logo, for structured data. */
export const PUBLISHER = {
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: { "@type": "ImageObject", url: `${SITE.url}/icon-512.png`, width: 512, height: 512 },
} as const;

/** A BreadcrumbList for structured data: the trail from the home page to this page. */
export const breadcrumbs = (trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: SITE.name, path: "" }, ...trail].map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.name,
    item: `${SITE.url}${crumb.path}`,
  })),
});
