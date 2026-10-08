import { SITE } from "@/lib/site";
import { Home } from "@/src/views/Home";

// Structured data, so search engines and AI assistants know exactly what this is.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  codeRepository: SITE.repo,
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: ["React", "Next.js", "React Native"],
  license: "https://opensource.org/licenses/MIT",
  keywords: "product tour, guided flows, onboarding, walkthrough, React, Next.js, React Native",
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Home />
    </>
  );
}
