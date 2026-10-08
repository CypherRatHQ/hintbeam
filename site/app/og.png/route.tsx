import { ImageResponse } from "next/og";

export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

/** The link preview, drawn at build time and written as /og.png (a real extension, so static hosts send it as an image). */
export function GET() {
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
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, maxWidth: 980 }}>
          Product tours that find their own way.
        </div>
        <div style={{ fontSize: 30, color: "#bdb8d2" }}>Guided flows for React, Next.js and React Native · open source</div>
      </div>
      <svg width="1056" height="40" viewBox="0 0 1056 40">
        <path d="M0 30 C 300 30, 420 6, 1056 10" stroke="#9D86FF" strokeWidth="3" fill="none" />
        <path d="M0 36 C 320 36, 460 14, 1056 10" stroke="#4CD6FF" strokeWidth="1.5" fill="none" opacity=".6" />
      </svg>
    </div>,
    size,
  );
}
