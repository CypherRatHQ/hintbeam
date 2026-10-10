import { ImageResponse } from "next/og";

/**
 * The site icon: one beam ending in a lit dot, on the dark tile. It is drawn bolder and simpler
 * than the header mark because search results show it at 16px, cropped to a circle: everything
 * stays inside that circle, with no hairlines to blur.
 */
export const ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9D86FF"/><stop offset="1" stop-color="#4CD6FF"/></linearGradient>' +
  '<radialGradient id="c"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#4CD6FF"/><stop offset="1" stop-color="#9D86FF"/></radialGradient></defs>' +
  '<rect width="32" height="32" rx="7" fill="#14111f"/>' +
  '<path d="M7.5 24.5 C 11.5 15.5, 16.5 17.5, 22.5 10.5" stroke="url(#g)" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
  '<circle cx="22.5" cy="10.5" r="4.6" fill="url(#c)"/>' +
  "</svg>";

/** The icon as a square PNG, drawn at build time. */
export const iconPng = (size: number): ImageResponse =>
  new ImageResponse(<img width={size} height={size} src={`data:image/svg+xml,${encodeURIComponent(ICON_SVG)}`} alt="" />, {
    width: size,
    height: size,
  });

/**
 * A favicon.ico holding PNG images (every browser since 2007 reads these). Bing and some browsers
 * ask for /favicon.ico whatever the page links to.
 */
export async function iconIco(sizes: number[]): Promise<Response> {
  const pngs = await Promise.all(sizes.map(async (size) => ({ size, png: new Uint8Array(await iconPng(size).arrayBuffer()) })));
  const header = 6 + 16 * pngs.length;
  const ico = new Uint8Array(header + pngs.reduce((n, { png }) => n + png.length, 0));
  const view = new DataView(ico.buffer);
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, pngs.length, true);
  let offset = header;
  pngs.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    ico[entry] = size % 256; // 0 means 256
    ico[entry + 1] = size % 256;
    view.setUint16(entry + 4, 1, true); // colour planes
    view.setUint16(entry + 6, 32, true); // bits per pixel
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, offset, true);
    ico.set(png, offset);
    offset += png.length;
  });
  return new Response(ico, { headers: { "Content-Type": "image/x-icon" } });
}
