import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BASE_PATH, IS_PREVIEW, SITE } from "@/lib/site";
import { SiteChrome } from "@/src/chrome";
import { shareMeta } from "@/lib/meta";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["product tour", "guided flows", "onboarding", "walkthrough", "React", "Next.js", "React Native", "Expo", "open source"],
  ...shareMeta({ path: "/", title: SITE.title, description: SITE.description }),
  alternates: { canonical: "/", types: { "application/rss+xml": "/blog/rss.xml" } },
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.ico`, sizes: "48x48" },
      { url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" },
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: { url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180" },
  },
  // A sub-path preview is temporary: only hintbeam.js.org should be indexed.
  ...(IS_PREVIEW ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = { themeColor: "#07060c", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
