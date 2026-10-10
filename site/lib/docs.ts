import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lastModified } from "./git";
import { firstParagraph } from "./markdown";

/** The library's own Markdown docs — one source for GitHub, npm and this site, read at build time. */
const ROOT = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

export interface Doc {
  slug: string;
  /** The page's name in the docs navigation. */
  title: string;
  /** The page's <title>: what someone searching for it would type, when the nav name is too short. */
  searchTitle: string;
  /** Shown in search results and link previews. */
  description: string;
  /** The day the page last changed, when git knows. */
  updated?: string;
  source: string;
}

/** Changes waiting for the next release, from `.changeset/` — shown until a release moves them into CHANGELOG.md. */
function changelog(): string {
  const pending = readdirSync(join(ROOT, ".changeset"))
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .map((file) => read(join(".changeset", file)))
    .filter((text) => text.startsWith("---"))
    .map((text) => text.replace(/^---[\s\S]*?---\s*/, ""));
  const file = read("CHANGELOG.md");
  return pending.length ? `${file}\n## Unreleased\n\n${pending.join("\n\n")}` : file;
}

const doc = (slug: string, title: string, about: { description?: string; searchTitle?: string } = {}): Doc => {
  const file = slug === "changelog" ? "CHANGELOG.md" : `docs/${slug}.md`;
  const source = slug === "changelog" ? changelog() : read(file);
  return {
    slug,
    title,
    searchTitle: about.searchTitle ?? title,
    description: about.description ?? firstParagraph(source),
    updated: lastModified(file),
    source,
  };
};

export const DOC_GROUPS: { title: string; docs: Doc[] }[] = [
  {
    title: "Start",
    docs: [
      doc("getting-started", "Getting started", {
        searchTitle: "Getting started: add a product tour to your app",
        description:
          "Add a product tour to a React, Next.js or React Native app with Hintbeam: install, write a tour, add the provider and start it.",
      }),
      doc("concepts", "Concepts", { searchTitle: "Concepts: targets, tours, steps and screens" }),
    ],
  },
  {
    title: "Guides",
    docs: [
      doc("customising", "Customising", {
        searchTitle: "Customise tours: brand colour, styles and motion",
        description:
          "Match tours to your product: brand colour, styles from aurora to minimal, the light, glow, motion, labels and your own step card.",
      }),
      doc("routers", "Routers", {
        searchTitle: "Multi-page tours: Next.js, React Router, Expo",
        description: "Tours that follow people across pages with Next.js, React Router, Expo Router and React Navigation.",
      }),
      doc("plugins", "Plugins", {
        searchTitle: "Plugins: tour analytics and custom styles",
        description: "Send tour events to analytics, add custom light styles and extend Hintbeam with plugins.",
      }),
      doc("accessibility", "Accessibility", {
        searchTitle: "Accessible tours: screen readers and keyboard",
        description:
          "How Hintbeam tours work for everyone: screen reader announcements, no focus stealing, real buttons, keyboard shortcuts and reduced motion.",
      }),
    ],
  },
  {
    title: "Reference",
    docs: [
      doc("api", "API reference", {
        searchTitle: "API reference: components, hooks and types",
        description: "Every export of Hintbeam: TourProvider, defineTargets, defineTour, hooks, themes, plugins and routers.",
      }),
      doc("architecture", "Architecture", { searchTitle: "Architecture: how the tour engine works" }),
      doc("versioning", "Versioning", {
        description: "How Hintbeam versions releases, what counts as a breaking change, and how deprecations work.",
      }),
      doc("changelog", "Changelog", {
        description: "Every Hintbeam release and what changed, written for the person upgrading.",
      }),
    ],
  },
];

export const DOCS = DOC_GROUPS.flatMap((group) => group.docs);

/**
 * The prompt people paste into a coding agent, from "Using an AI coding agent?" in the getting
 * started guide — the one place it is written, so the home page and the docs never disagree.
 */
export function agentPrompt(): string {
  const prompt = read("docs/getting-started.md").match(/## Using an AI coding agent\?[\s\S]*?```text\n([\s\S]*?)```/)?.[1];
  if (!prompt) throw new Error('docs/getting-started.md: the "Using an AI coding agent?" prompt is missing.');
  return prompt.trim();
}
