import type { MetadataRoute } from "next";
import { IS_PREVIEW, SITE } from "@/lib/site";

export const dynamic = "force-static";

// Everyone is welcome, AI crawlers included: being read is how people find the library.
export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${SITE.url}/sitemap.xml`, host: SITE.url };
}
