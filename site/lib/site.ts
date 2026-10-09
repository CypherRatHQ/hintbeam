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
