import type { MetadataRoute } from "next";
import { BASE_PATH, SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Names the site and its icons, for browsers and search engines. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: `${BASE_PATH}/`,
    display: "browser",
    background_color: "#07060c",
    theme_color: "#07060c",
    icons: [192, 512].map((size) => ({ src: `${BASE_PATH}/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png" })),
  };
}
