import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlaygroundShell } from "@/src/views/playground/Playground";

export const metadata: Metadata = {
  title: { default: "Playground", template: "%s · Playground · Hintbeam" },
  description:
    "Try Hintbeam on a small demo app: play a product tour across four pages, change the style, brand colour and language, and copy the theme into your app.",
  alternates: { canonical: "/playground" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <PlaygroundShell>{children}</PlaygroundShell>;
}
