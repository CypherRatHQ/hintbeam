"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { TourProvider, browserTourStorage, useScreenLink, useTarget, type TourStepView } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { CustomCard } from "./components/CustomCard";
import { CheckIcon, CloseIcon, CopyIcon, GitHubIcon, MenuIcon, Mark } from "./components/Icons";
import { eventLog } from "./eventLog";
import { LANGUAGES, SettingsProvider, themeFor, useSettings } from "./settings";
import { targets } from "./tours";

// Progress lives in localStorage; safe in the static build, where there is no window.
const storage = browserTourStorage("hintbeam-site");
const plugins = [eventLog];

/** Everything every page shares: settings, the tour, the header and the footer. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <Tours>
        <Header />
        <main>{children}</main>
        <Footer />
      </Tours>
    </SettingsProvider>
  );
}

function Tours({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const router = useNextRouter();
  const pathname = usePathname();
  const theme = useMemo(() => themeFor(settings), [settings]);
  const renderStep = useMemo(
    () => (settings.customCard ? (step: TourStepView) => <CustomCard step={step} /> : undefined),
    [settings.customCard],
  );
  // A new page starts at the top, like a normal site; the playground keeps its place.
  useEffect(() => {
    if (!pathname.startsWith("/playground/")) window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <TourProvider
      targets={targets}
      router={router}
      storage={storage}
      theme={theme}
      labels={LANGUAGES[settings.language].labels}
      renderStep={renderStep}
      plugins={plugins}
      user={{ id: "demo-visitor", traits: { source: "site" } }}
    >
      {children}
    </TourProvider>
  );
}

function InstallChip() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="install-chip"
      aria-label="Copy the install command"
      onClick={() => {
        void navigator.clipboard?.writeText("npm i hintbeam").then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
    >
      <span>
        <span className="prompt">$</span> npm i hintbeam
      </span>
      <span className="copy">{copied ? <CheckIcon /> : <CopyIcon />}</span>
    </button>
  );
}

const REPO = "https://github.com/CypherRatHQ/hintbeam";

function Header() {
  const playground = useTarget<HTMLAnchorElement>("navPlayground", { radius: 8 });
  const docs = useTarget<HTMLAnchorElement>("navDocs", { radius: 8 });
  const playgroundLink = useScreenLink<HTMLSpanElement>("/playground", { radius: 8 });
  const pathname = usePathname();
  const active = (prefix: string) => (pathname.startsWith(prefix) ? "active" : undefined);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // The menu closes when a page opens, on Escape, and when the screen grows past phone size.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 761px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <header className="site-header" data-open={open ? "" : undefined}>
      <div className="container">
        <Link href="/" className="brand" aria-label="Hintbeam home">
          <Mark size={26} />
          hintbeam
          <span className="version">v0.1</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/playground" ref={playground} className={active("/playground")}>
            <span ref={playgroundLink}>Playground</span>
          </Link>
          <Link href="/docs/getting-started" ref={docs} className={active("/docs")}>
            Docs
          </Link>
          <Link href="/blog" className={`hide-sm ${active("/blog") ?? ""}`.trim()}>
            Blog
          </Link>
        </nav>
        <div className="header-end">
          <a href={REPO} className="icon-link hide-sm" aria-label="Hintbeam on GitHub">
            <GitHubIcon />
          </a>
          <InstallChip />
          <Link href="/docs/getting-started" className="btn btn-primary btn-sm hide-sm">
            Get started
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <div id={menuId} className="menu-sheet" hidden={!open}>
        <nav aria-label="More">
          <Link href="/blog">Blog</Link>
          <Link href="/docs/api">API reference</Link>
          <Link href="/docs/changelog">Changelog</Link>
          <a href={REPO}>
            <GitHubIcon size={16} /> GitHub
          </a>
        </nav>
        <InstallChip />
        <Link href="/docs/getting-started" className="btn btn-primary">
          Get started
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <Mark size={24} />
            hintbeam
          </Link>
          <p>
            Guided flows and product tours for React, Next.js and React Native. MIT-licensed. This site is built with the package it
            describes — every tour here is the real thing.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <Link href="/playground">Playground</Link>
          <Link href="/docs/customising">Themes and light styles</Link>
          <Link href="/docs/plugins">Plugins</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <div>
          <h4>Docs</h4>
          <Link href="/docs/getting-started">Getting started</Link>
          <Link href="/docs/routers">Routers</Link>
          <Link href="/docs/api">API reference</Link>
        </div>
        <div>
          <h4>Project</h4>
          <a href="https://github.com/CypherRatHQ/hintbeam">GitHub</a>
          <Link href="/docs/versioning">Versioning</Link>
          <Link href="/docs/changelog">Changelog</Link>
          <span style={{ display: "block", padding: "3px 0" }}>v0.1.0 · preview</span>
        </div>
      </div>
    </footer>
  );
}
