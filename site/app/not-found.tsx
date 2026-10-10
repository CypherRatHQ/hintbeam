import Link from "next/link";

// Pages live at /docs/api, not /docs/api/, and GitHub Pages can't redirect: a link with a trailing
// slash lands here. Send it to the page it meant (a page that really is missing just 404s again).
const DROP_TRAILING_SLASH = `var p = location.pathname;
if (p.length > 1 && p.endsWith("/")) location.replace(p.replace(/\\/+$/, "") + location.search + location.hash);`;

export default function NotFound() {
  return (
    <div className="container not-found">
      <script dangerouslySetInnerHTML={{ __html: DROP_TRAILING_SLASH }} />
      <h1>This page wandered off.</h1>
      <p>The link may be old, or the page moved.</p>
      <p>
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>{" "}
        <Link href="/docs/getting-started" className="btn">
          Read the docs
        </Link>
      </p>
    </div>
  );
}
