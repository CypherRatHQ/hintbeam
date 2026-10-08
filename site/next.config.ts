import { resolve } from "node:path";
import type { NextConfig } from "next";

// Where the site is served from. Empty for hintbeam.js.org (the root). While the domain is waiting
// for js.org, GitHub Pages serves it at <org>.github.io/hintbeam: build with SITE_BASE_PATH=/hintbeam.
const basePath = process.env.SITE_BASE_PATH ?? "";

const config: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // A fully static site: every page is HTML at build time, so search engines and AI crawlers read
  // real content, and it hosts free on GitHub Pages (hintbeam.js.org).
  output: "export",
  images: { unoptimized: true },
  // `/docs/api` is written as `docs/api.html`, which GitHub Pages serves without the extension.
  trailingSlash: false,
  // The site is its own project: it uses the packed library, not the repo's source or its React.
  turbopack: { root: resolve(".") },
};

export default config;
