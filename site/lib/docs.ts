import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { firstParagraph } from "./markdown";

/** The library's own Markdown docs — one source for GitHub, npm and this site, read at build time. */
const ROOT = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

export interface Doc {
  slug: string;
  title: string;
  /** Shown in search results and link previews. */
  description: string;
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

const doc = (slug: string, title: string, description?: string): Doc => {
  const source = slug === "changelog" ? changelog() : read(`docs/${slug}.md`);
  return { slug, title, description: description ?? firstParagraph(source), source };
};

export const DOC_GROUPS: { title: string; docs: Doc[] }[] = [
  {
    title: "Start",
    docs: [
      doc(
        "getting-started",
        "Getting started",
        "Add a product tour to a React, Next.js or React Native app with Hintbeam: install, write a tour, add the provider and start it.",
      ),
      doc("concepts", "Concepts"),
    ],
  },
  {
    title: "Guides",
    docs: [
      doc(
        "customising",
        "Customising",
        "Match tours to your product: brand colour, styles from aurora to minimal, the light, glow, motion, labels and your own step card.",
      ),
      doc("routers", "Routers", "Tours that follow people across pages with Next.js, React Router, Expo Router and React Navigation."),
      doc("plugins", "Plugins", "Send tour events to analytics, add custom light styles and extend Hintbeam with plugins."),
      doc("accessibility", "Accessibility"),
    ],
  },
  {
    title: "Reference",
    docs: [
      doc("api", "API reference", "Every export of Hintbeam: TourProvider, defineTargets, defineTour, hooks, themes, plugins and routers."),
      doc("architecture", "Architecture"),
      doc("versioning", "Versioning", "How Hintbeam versions releases, what counts as a breaking change, and how deprecations work."),
      doc("changelog", "Changelog", "Every Hintbeam release and what changed, written for the person upgrading."),
    ],
  },
];

export const DOCS = DOC_GROUPS.flatMap((group) => group.docs);
