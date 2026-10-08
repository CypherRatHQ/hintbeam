import type { Metadata } from "next";
import { JsonTour } from "@/src/views/playground/Playground";

export const metadata: Metadata = { title: "Tour as JSON", alternates: { canonical: "/playground/json" } };

export default function Page() {
  return <JsonTour />;
}
