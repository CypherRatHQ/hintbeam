import { iconPng } from "@/lib/icon";

export const dynamic = "force-static";

/** The icon iOS uses when the site is added to a home screen. */
export function GET() {
  return iconPng(180);
}
