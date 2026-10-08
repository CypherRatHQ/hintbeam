import type { Metadata } from "next";
import { Reports } from "@/src/views/playground/Playground";

export const metadata: Metadata = { title: "Reports", alternates: { canonical: "/playground/reports" } };

export default function Page() {
  return <Reports />;
}
