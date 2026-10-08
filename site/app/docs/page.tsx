import type { Metadata } from "next";
import { DOCS } from "@/lib/docs";
import { DocPage } from "./DocPage";

const start = DOCS[0]!;

// /docs shows the first guide; search engines are pointed at its own address.
export const metadata: Metadata = { title: start.title, description: start.description, alternates: { canonical: `/docs/${start.slug}` } };

export default function Page() {
  return <DocPage doc={start} />;
}
