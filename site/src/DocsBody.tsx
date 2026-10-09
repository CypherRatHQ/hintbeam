"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import type { TocItem } from "@/lib/markdown";
import { BASE_PATH } from "@/lib/site";

/** Rendered Markdown, with links to other docs handled by the router instead of a full page load. */
export function Prose({ html }: { html: string }) {
  const router = useRouter();
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const copy = (event.target as HTMLElement).closest<HTMLButtonElement>(".code-copy");
    if (copy) {
      const code = copy.parentElement?.querySelector("pre")?.textContent ?? "";
      void navigator.clipboard?.writeText(code).then(() => {
        copy.textContent = "Copied";
        setTimeout(() => (copy.textContent = "Copy"), 1400);
      });
      return;
    }
    const href = (event.target as HTMLElement).closest("a")?.getAttribute("href");
    if (href?.startsWith("/") && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      // Links carry the base path for crawlers and new tabs; the router adds it back itself.
      router.push(BASE_PATH && href.startsWith(`${BASE_PATH}/`) ? href.slice(BASE_PATH.length) : href);
    }
  };
  return <article className="prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Toc({ toc }: { toc: TocItem[] }) {
  return (
    <nav className="toc" aria-label="On this page">
      {toc.length ? <h5>On this page</h5> : null}
      {toc.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.depth === 3 ? "sub" : undefined}
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", `#${item.id}`);
          }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
