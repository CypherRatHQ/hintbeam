import type { Metadata } from "next";
import { DOCS } from "@/lib/docs";
import { shareMeta } from "@/lib/meta";
import { DocPage } from "./DocPage";

const start = DOCS[0]!;

// /docs shows the first guide; search engines are pointed at its own address.
export const metadata: Metadata = {
  title: start.title,
  description: start.description,
  ...shareMeta({
    path: `/docs/${start.slug}`,
    title: `${start.title} · Hintbeam docs`,
    description: start.description,
    image: `/og/docs-${start.slug}.png`,
    type: "article",
  }),
};

export default function Page() {
  return <DocPage doc={start} />;
}
