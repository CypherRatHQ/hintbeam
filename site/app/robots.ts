import type { MetadataRoute } from "next";
import { IS_PREVIEW, SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * The crawlers behind AI answers, named so the welcome is explicit: search (OpenAI's OAI-SearchBot,
 * PerplexityBot, Claude-SearchBot), fetches a person asked for (ChatGPT-User, Claude-User) and
 * training (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended), since a model that has read the
 * docs can recommend the library. `*` already allows them; naming them keeps that from changing by
 * accident.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
];

// Everyone is welcome, AI crawlers included: being read is how people find the library.
export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
