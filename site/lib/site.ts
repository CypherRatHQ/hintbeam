/** The path the site is served under: "" at hintbeam.js.org (see next.config.ts). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A temporary preview under a sub-path (before the custom domain is set): kept out of search. */
export const IS_PREVIEW = BASE_PATH !== "";

/** Facts about the site used in metadata, the sitemap, feeds and llms.txt. */
export const SITE = {
  name: "Hintbeam",
  url: "https://hintbeam.js.org",
  repo: "https://github.com/CypherRatHQ/hintbeam",
  npm: "https://www.npmjs.com/package/hintbeam",
  tagline: "Guided flows and product tours for React, Next.js and React Native",
  description:
    "Hintbeam is an open-source product tour library for React, Next.js and React Native. Tours point at named targets, not CSS selectors, so they survive refactors, scrolling and page changes.",
} as const;
