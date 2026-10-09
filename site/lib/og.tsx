import { ImageResponse } from "next/og";

/** Link previews are 1200×630: the size X, LinkedIn, Slack, Discord and WhatsApp all show in full. */
export const OG_SIZE = { width: 1200, height: 630 };

interface Card {
  /** A small label above the title, such as "Docs" or "Blog". */
  eyebrow?: string;
  title: string;
  subtitle: string;
}

/** A link preview card in the site's look, drawn at build time. */
export function ogCard({ eyebrow, title, subtitle }: Card): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#07060c",
        color: "#eeecf8",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 32 32">
          <rect x="1" y="1" width="30" height="30" rx="9" fill="#14111f" stroke="rgba(255,255,255,.12)" />
          <path d="M6.5 20 C 10 12, 17 15.5, 24 10" stroke="#9D86FF" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".6" />
          <path d="M10.5 26 C 15 17, 19.5 19.5, 24 10" stroke="#4CD6FF" strokeWidth="1" fill="none" strokeLinecap="round" opacity=".6" />
          <path d="M8 24 C 12 14, 18 17.5, 24 10" stroke="#9D86FF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="10" r="3.6" fill="#ffffff" />
        </svg>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>hintbeam</div>
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              marginLeft: 8,
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid rgba(157,134,255,.5)",
              color: "#c9bdff",
              fontSize: 26,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: title.length > 48 ? 56 : 68,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.08,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#bdb8d2", maxWidth: 1040, lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      <svg width="1056" height="40" viewBox="0 0 1056 40">
        <path d="M0 30 C 300 30, 420 6, 1056 10" stroke="#9D86FF" strokeWidth="3" fill="none" />
        <path d="M0 36 C 320 36, 460 14, 1056 10" stroke="#4CD6FF" strokeWidth="1.5" fill="none" opacity=".6" />
      </svg>
    </div>,
    OG_SIZE,
  );
}
