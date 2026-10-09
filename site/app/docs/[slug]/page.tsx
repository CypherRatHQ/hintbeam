import type { Metadata } from "next";
import { shareMeta } from "@/lib/meta";
import { notFound } from "next/navigation";
import { DOCS } from "@/lib/docs";
import { DocPage } from "../DocPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS.find((d) => d.slug === slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    ...shareMeta({
      path: `/docs/${doc.slug}`,
      title: `${doc.title} · Hintbeam docs`,
      description: doc.description,
      image: `/og/docs-${doc.slug}.png`,
      type: "article",
    }),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS.find((d) => d.slug === slug);
  if (!doc) notFound();
  return <DocPage doc={doc} />;
}
