"use client";

import { useMemo, useState } from "react";
import { highlight } from "@/lib/highlight";
import { CheckIcon, CopyIcon } from "./Icons";

export { highlight };

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Code({
  code,
  language = "tsx",
  title,
  wrap = false,
}: {
  code: string;
  language?: string;
  title?: string;
  /** Wrap long lines instead of scrolling: for prose, such as a prompt. */
  wrap?: boolean;
}) {
  const text = code.trim();
  const html = useMemo(() => highlight(text, language), [text, language]);
  return (
    <div className="code">
      <div className="code-bar">
        <span>{title ?? language}</span>
        <CopyButton text={text} />
      </div>
      <pre className={wrap ? "wrap" : undefined}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

/** Several files in one block, switched by tabs in its bar. */
export function CodeTabs({ tabs }: { tabs: { label: string; code: string; language?: string }[] }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active]!;
  const text = tab.code.trim();
  const html = useMemo(() => highlight(text, tab.language ?? "tsx"), [text, tab.language]);
  return (
    <div className="code">
      <div className="code-bar">
        <div role="tablist" className="code-tabs">
          {tabs.map((t, i) => (
            <button key={t.label} role="tab" type="button" aria-selected={i === active} onClick={() => setActive(i)}>
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={text} />
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
