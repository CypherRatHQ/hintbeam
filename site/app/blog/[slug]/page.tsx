import type { Metadata } from "next";
import { shareMeta } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { MAINTAINER, PUBLISHER, SITE, breadcrumbs, jsonLd as ldJson, pageTitle } from "@/lib/site";

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
  const url = `${SITE.url}/blog/${post.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url,
      mainEntityOfPage: url,
      image: `${SITE.url}/og/blog-${post.slug}.png`,
      datePublished: post.date,
      dateModified: post.updated,
      author: { "@type": "Person", name: post.author, url: authorUrl(post.author) },
      publisher: PUBLISHER,
      keywords: post.tags.join(", "),
    },
    {
      "@context": "https://schema.org",
      ...breadcrumbs([
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    },
  ];
  // Two more posts to read next, preferring ones that share a tag with this one.
  const shared = (other: typeof post) => other.tags.filter((tag) => post.tags.includes(tag)).length;
  const more = getPosts()
    .filter((other) => other.slug !== post.slug)
    .sort((a, b) => shared(b) - shared(a))
    .slice(0, 2);
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
      {more.length ? (
        <nav className="blog-more" aria-label="More posts">
          <h2>Read next</h2>
          {more.map((other) => (
            <Link key={other.slug} href={`/blog/${other.slug}`}>
              <strong>{other.title}</strong>
              <span>{other.description}</span>
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
