import { iconPng } from "@/lib/icon";

export const dynamic = "force-static";

/** The icon as a 192×192 PNG (search results and the web app manifest). */
export function GET() {
  return iconPng(192);
}
