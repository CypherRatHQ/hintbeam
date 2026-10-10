import { ICON_SVG } from "@/lib/icon";

export const dynamic = "force-static";

/** The tab icon, as a vector (written as /favicon.svg). */
export function GET() {
  return new Response(ICON_SVG, { headers: { "Content-Type": "image/svg+xml" } });
}
