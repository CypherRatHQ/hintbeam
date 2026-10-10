import { iconIco } from "@/lib/icon";

export const dynamic = "force-static";

/** /favicon.ico, for search engines and browsers that ask for it by name. */
export function GET() {
  return iconIco([48, 32, 16]);
}
