import { getPosts } from "@/lib/blog";
import { DOCS } from "@/lib/docs";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;

/**
 * One link preview per doc and post, written as /og/docs-<slug>.png and /og/blog-<slug>.png. They
 * live in their own folder: a folder named like a page (blog/<slug>/) can make static hosts redirect
 * the page itself.
 */
const cards = () => [
  ...DOCS.map((doc) => ({ image: `docs-${doc.slug}.png`, eyebrow: "Docs", title: doc.title, subtitle: doc.description })),
  ...getPosts().map((post) => ({ image: `blog-${post.slug}.png`, eyebrow: "Blog", title: post.title, subtitle: post.description })),
];

export function generateStaticParams() {
  return cards().map(({ image }) => ({ image }));
}

export async function GET(_: Request, { params }: { params: Promise<{ image: string }> }) {
  const { image } = await params;
  const card = cards().find((c) => c.image === image);
  if (!card) return new Response("Not found", { status: 404 });
  return ogCard(card);
}
