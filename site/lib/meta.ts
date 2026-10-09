import type { Metadata } from "next";
import { SITE } from "./site";

interface Share {
  /** The page's path, such as "/docs/api": its canonical URL and its link-preview URL. */
  path: string;
  /** The title shown in link previews. */
  title: string;
  description: string;
  /** The preview image's path; defaults to the site card. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/**
 * Everything a page needs to be found and shared: its canonical URL, and the Open Graph and X
 * (Twitter) tags that link previews read — the page's own URL, title, description and image.
 */
export function shareMeta({ path, title, description, image = "/og.png", type = "website", publishedTime }: Share): Metadata {
  const images = [{ url: image, width: 1200, height: 630, alt: title, type: "image/png" }];
  return {
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE.name,
      locale: "en_US",
      url: path,
      title,
      description,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
