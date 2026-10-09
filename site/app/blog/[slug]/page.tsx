import type { Metadata } from "next";
import { shareMeta } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { MAINTAINER, SITE, jsonLd as ldJson, pageTitle } from "@/lib/site";

const authorUrl = (name: string) => (name === MAINTAINER.name ? MAINTAINER.url : undefined);
import { Prose } from "@/src/DocsBody";

export const dynamicParams = false;

export function generateStaticParams() {
  const posts = getPosts();
  // A static export needs at least one page per route; with no posts yet, a placeholder 404s.
  return posts.length ? posts.map((post) => ({ slug: post.slug })) : [{ slug: "_none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: pageTitle(post.title),
    description: post.description,
    authors: [{ name: post.author, url: authorUrl(post.author) }],
    keywords: post.tags,
    ...shareMeta({
      path: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      image: `/og/blog-${post.slug}.png`,
      type: "article",
      publishedTime: post.date,
    }),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { html } = renderMarkdown(post.source.replace(/^#\s.*\n/, ""));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author, url: authorUrl(post.author) },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
    keywords: post.tags.join(", "),
  };
  return (
    <div className="container blog-post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      <Link href="/blog" className="blog-back">
        ← All posts
      </Link>
      <h1>{post.title}</h1>
      <p className="blog-meta">
        <time dateTime={post.date}>
          {new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </time>
        {" · "}
        {authorUrl(post.author) ? <a href={authorUrl(post.author)}>{post.author}</a> : post.author}
      </p>
      <Prose html={html} />
    </div>
  );
}
