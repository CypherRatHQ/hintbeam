import type { Metadata } from "next";
import { Team } from "@/src/views/playground/Playground";

export const metadata: Metadata = { title: "Team", alternates: { canonical: "/playground/team" } };

export default function Page() {
  return <Team />;
}
