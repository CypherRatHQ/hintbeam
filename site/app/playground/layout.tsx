import type { Metadata } from "next";
import type { ReactNode } from "react";
import { shareMeta } from "@/lib/meta";
import { PLAYGROUND_DESCRIPTION } from "@/lib/site";
import { PlaygroundShell } from "@/src/views/playground/Playground";

export const metadata: Metadata = {
  title: { default: "Playground", template: "%s · Playground · Hintbeam" },
  description: PLAYGROUND_DESCRIPTION,
  ...shareMeta({ path: "/playground", title: "Playground · Hintbeam", description: PLAYGROUND_DESCRIPTION }),
};

export default function Layout({ children }: { children: ReactNode }) {
  return <PlaygroundShell>{children}</PlaygroundShell>;
}
