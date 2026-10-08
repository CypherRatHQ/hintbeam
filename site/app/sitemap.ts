import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { DOCS } from "@/lib/docs";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, lastModified?: string) => ({ url: `${SITE.url}${path}`, priority, lastModified });
  return [
    page("", 1),
    page("/playground", 0.8),
    ...DOCS.map((doc) => page(`/docs/${doc.slug}`, doc.slug === "getting-started" ? 0.9 : 0.7)),
    page("/blog", 0.6),
    ...getPosts().map((post) => page(`/blog/${post.slug}`, 0.6, post.date)),
  ];
}
