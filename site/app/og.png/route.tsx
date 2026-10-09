import { ogCard } from "@/lib/og";

export const dynamic = "force-static";

/** The site's link preview, written as /og.png (a real extension, so static hosts send it as an image). */
export function GET() {
  return ogCard({
    title: "Product tours that find their own way.",
    subtitle: "Guided flows for React, Next.js and React Native · open source",
  });
}
