import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/blog";
import { shareMeta } from "@/lib/meta";
import { BASE_PATH } from "@/lib/site";

const DESCRIPTION =
  "Guides, release notes and the thinking behind Hintbeam — product tours and guided flows for React, Next.js and React Native.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  ...shareMeta({ path: "/blog", title: "Blog · Hintbeam", description: DESCRIPTION }),
};

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function Page() {
  const posts = getPosts();
  return (
    <div className="container blog">
      <header className="blog-head">
        <h1>Blog</h1>
        <p>Guides, release notes and the thinking behind Hintbeam.</p>
        <a href={`${BASE_PATH}/blog/rss.xml`} className="blog-rss">
          RSS feed
        </a>
      </header>
      {posts.length ? (
        <ol className="blog-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="blog-empty">The first posts are on their way.</p>
      )}
    </div>
  );
}
