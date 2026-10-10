import { MAINTAINER, ORG, SITE, jsonLd as ldJson } from "@/lib/site";
import { agentPrompt } from "@/lib/docs";
import { Home } from "@/src/views/Home";

// Structured data, so search engines and AI assistants know exactly what this is. The WebSite entry
// gives search results the site's name: without it Google shows the domain's ("JS.ORG").
const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: ["hintbeam.js.org", "Hintbeam product tours"],
  url: `${SITE.url}/`,
};
const software = {
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
  author: { "@type": "Person", ...MAINTAINER },
  publisher: { "@type": "Organization", ...ORG },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(software) }} />
      <Home agentPrompt={agentPrompt()} />
    </>
  );
}
