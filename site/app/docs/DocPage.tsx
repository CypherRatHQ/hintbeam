import Link from "next/link";
import { DOC_GROUPS, DOCS, type Doc } from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown";
import { PUBLISHER, SITE, breadcrumbs, jsonLd } from "@/lib/site";
import { Prose, Toc } from "@/src/DocsBody";

/** One docs page, rendered to HTML at build time. */
export function DocPage({ doc }: { doc: Doc }) {
  const { html, toc } = renderMarkdown(doc.source);
  const index = DOCS.indexOf(doc);
  const previous = DOCS[index - 1];
  const next = DOCS[index + 1];
  const url = `${SITE.url}/docs/${doc.slug}`;
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: doc.searchTitle,
      description: doc.description,
      url,
      mainEntityOfPage: url,
      image: `${SITE.url}/og/docs-${doc.slug}.png`,
      ...(doc.updated ? { dateModified: doc.updated } : {}),
      author: PUBLISHER,
      publisher: PUBLISHER,
      about: { "@type": "SoftwareSourceCode", name: SITE.name, codeRepository: SITE.repo },
    },
    {
      "@context": "https://schema.org",
      ...breadcrumbs([
        { name: "Docs", path: "/docs" },
        { name: doc.title, path: `/docs/${doc.slug}` },
      ]),
    },
  ];
  return (
    <div className="container docs">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <aside className="docs-nav" aria-label="Documentation">
        {DOC_GROUPS.map((group) => (
          <div key={group.title}>
            <h5>{group.title}</h5>
            {group.docs.map((d) => (
              <Link key={d.slug} href={`/docs/${d.slug}`} className={d.slug === doc.slug ? "active" : undefined}>
                {d.title}
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div style={{ minWidth: 0 }}>
        <Prose html={html} />
        <nav className="docs-pager" aria-label="Pages">
          {previous ? (
            <Link href={`/docs/${previous.slug}`}>
              <small>Previous</small>
              <strong>← {previous.title}</strong>
            </Link>
          ) : null}
          {next ? (
            <Link href={`/docs/${next.slug}`} className="next">
              <small>Next</small>
              <strong>{next.title} →</strong>
            </Link>
          ) : null}
        </nav>
      </div>
      <Toc toc={toc} />
    </div>
  );
}
