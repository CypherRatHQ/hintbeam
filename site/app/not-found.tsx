import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container not-found">
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
