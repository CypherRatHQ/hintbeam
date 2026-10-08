/** The look of the built-in step card, guide and light. Pass a partial `theme` to `TourProvider`. */
export interface TourTheme {
  /** The light, the highlight and the primary button. */
  accent: string;
  /** Where the accent blends to, in the light and the primary button. Same as `accent` for a flat look. */
  accent2: string;
  /** Text on the primary button. */
  onAccent: string;
  /** The card's background. A translucent colour gives a frosted-glass card on the web. */
  card: string;
  /** The card's hairline border. */
  border: string;
  text: string;
  mutedText: string;
  /** Card corner radius. */
  radius: number;
  /** Space between the card and the screen edges. */
  inset: { top: number; bottom: number; horizontal: number };
  /** Widest the card gets on tablets and desktops. */
  maxCardWidth: number;
  fontFamily?: string;
  /** Draw the light from the guide to the target. Off: a highlight only. */
  light: boolean;
  /** Show the guide — the small living light on the card's edge that the light leaves from. */
  guide: boolean;
  /** How much the rest of the screen dims around the target, 0 to 1. 0 turns the spotlight off. Nothing is ever blocked. */
  backdrop: number;
  /** How much everything glows — the light, the highlight, the card's halo — 0 to 1. */
  glow: number;
  /**
   * `"full"`: words arrive one by one, a spark keeps travelling the light, the target ripples.
   * `"calm"`: the light draws once and everything else stays still. `"none"`: no motion at all
   * (also what anyone with reduced motion gets).
   */
  motion: "full" | "calm" | "none";
  /** The path style to use when `TourProvider` has no `path` prop. */
  path?: string;
  /** Layer order of the overlay on the web. */
  zIndex: number;
}

export type TourThemeInput = Partial<Omit<TourTheme, "inset">> & { inset?: Partial<TourTheme["inset"]> };

const base = {
  radius: 16,
  inset: { top: 56, bottom: 32, horizontal: 16 },
  maxCardWidth: 360,
  light: true,
  guide: true,
  zIndex: 2147483000,
} as const;

export const lightTheme: TourTheme = {
  ...base,
  inset: { ...base.inset },
  accent: "#6D4AFF",
  accent2: "#2EA8FF",
  onAccent: "#FFFFFF",
  card: "rgba(255, 255, 255, 0.94)",
  border: "rgba(24, 16, 64, 0.10)",
  text: "#15122B",
  mutedText: "#6B6880",
  backdrop: 0.2,
  glow: 0.4,
  motion: "full",
};

export const darkTheme: TourTheme = {
  ...lightTheme,
  accent: "#9D86FF",
  accent2: "#4CD6FF",
  onAccent: "#0D0A1C",
  card: "rgba(24, 21, 38, 0.9)",
  border: "rgba(255, 255, 255, 0.10)",
  text: "#F3F1FF",
  mutedText: "#A9A5C0",
  backdrop: 0.35,
};

/**
 * How much is going on, from the most magical to the plainest. Each is a partial theme; colours
 * come from the mode and your brand (see `createTourTheme`).
 */
export type TourStyle = "aurora" | "balanced" | "subtle" | "minimal";

/** What a style sets. The values are defaults and may be refined in minor releases; the shape is stable. */
export interface TourStylePreset {
  path: string;
  guide: boolean;
  light: boolean;
  glow: number;
  motion: TourTheme["motion"];
  /** Multiplies the mode's backdrop. */
  backdropScale: number;
  radius?: number;
}

/** The two base themes: light cards and dark cards. `createTourTheme({ mode })` starts from one of them. */
export const TOUR_THEMES: Readonly<{ light: TourTheme; dark: TourTheme }> = { light: lightTheme, dark: darkTheme };

export const TOUR_STYLES: Readonly<Record<TourStyle, Readonly<TourStylePreset>>> = {
  /** Three lines of light, the guide, a strong spotlight and a glow. */
  aurora: { path: "strands", guide: true, light: true, glow: 0.65, motion: "full", backdropScale: 1.25 },
  /** The default: the guide and a single wave, softly lit. */
  balanced: { path: "wave", guide: true, light: true, glow: 0.4, motion: "full", backdropScale: 1 },
  /** A thin straight line and a quiet card. No guide, barely any glow, nothing that keeps moving. */
  subtle: { path: "straight", guide: false, light: true, glow: 0.15, motion: "calm", backdropScale: 0.5 },
  /** A classic tooltip: an outline around the target and a card. No light, no glow, no dimming. */
  minimal: { path: "straight", guide: false, light: false, glow: 0, motion: "calm", backdropScale: 0, radius: 10 },
};

export interface CreateTourThemeOptions {
  /** Your brand colour, as `#rgb` or `#rrggbb`. The light, highlight and button are made from it. */
  brand?: string;
  /** A second colour for the light to blend into. Defaults to a neighbour of `brand`; pass the same colour for a flat look. */
  brand2?: string;
  /** Light or dark cards. */
  mode?: "light" | "dark";
  /** How much is going on: "aurora", "balanced" (default), "subtle", "minimal". */
  style?: TourStyle;
  /** Anything else to override, last. */
  overrides?: TourThemeInput;
}

/**
 * A complete theme from a brand colour, a mode and a style:
 *
 * ```tsx
 * <TourProvider theme={createTourTheme({ brand: "#E5484D", mode: "light", style: "subtle" })} … />
 * ```
 */
export function createTourTheme(options: CreateTourThemeOptions = {}): TourTheme {
  const { mode = "light", style = "balanced", overrides } = options;
  const start = mode === "dark" ? darkTheme : lightTheme;
  const preset = TOUR_STYLES[style];
  const theme: TourTheme = {
    ...start,
    inset: { ...start.inset },
    path: preset.path,
    guide: preset.guide,
    light: preset.light,
    glow: preset.glow,
    motion: preset.motion,
    backdrop: Math.round(start.backdrop * preset.backdropScale * 100) / 100,
    radius: preset.radius ?? start.radius,
  };
  const brand = options.brand ? parseHex(options.brand) : null;
  if (brand) {
    // On dark cards, lift a dark brand colour so the light stays visible.
    const accent = mode === "dark" && luminance(brand) < 0.12 ? mix(brand, [255, 255, 255], 0.35) : brand;
    theme.accent = toHex(accent);
    theme.accent2 = options.brand2 ? options.brand2 : style === "minimal" ? theme.accent : toHex(shiftHue(accent, -42));
    theme.onAccent = luminance(accent) > 0.45 ? "#111111" : "#FFFFFF";
  } else if (options.brand2) {
    theme.accent2 = options.brand2;
  } else if (style === "minimal") {
    theme.accent2 = theme.accent;
  }
  return resolveTourTheme({ ...theme, ...overrides, inset: { ...theme.inset, ...overrides?.inset } });
}

export function resolveTourTheme(input: TourThemeInput | undefined): TourTheme {
  if (!input) return lightTheme;
  const theme = { ...lightTheme, ...input, inset: { ...lightTheme.inset, ...input.inset } };
  // A theme that sets only `accent` gets a flat light rather than the default blend.
  if (input.accent && !input.accent2) theme.accent2 = input.accent;
  theme.glow = clamp01(theme.glow);
  theme.backdrop = clamp01(theme.backdrop);
  return theme;
}

/* ——— Small colour helpers (no dependencies) ——— */

type Rgb = [number, number, number];

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Relative luminance, 0 (black) to 1 (white). */
function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function shiftHue([r, g, b]: Rgb, degrees: number): Rgb {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [r, g, b];
  const s = d / (1 - Math.abs(2 * l - 1));
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  let h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = (((h * 60 + degrees) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}
