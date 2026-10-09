import type { Metadata } from "next";
import { shareMeta } from "@/lib/meta";
import { PLAYGROUND_DESCRIPTION } from "@/lib/site";
import { JsonTour } from "@/src/views/playground/Playground";

// A screen of the demo app: search engines and link previews are pointed at the playground itself.
export const metadata: Metadata = {
  title: "Tour as JSON",
  ...shareMeta({ path: "/playground", title: "Playground · Hintbeam", description: PLAYGROUND_DESCRIPTION }),
};

export default function Page() {
  return <JsonTour />;
}
