"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createTourTheme, TOUR_STYLES, type TourPathName, type TourLabels, type TourStyle, type TourTheme } from "hintbeam";

export type Language = "en" | "es" | "hi";

/** The site header is 64px tall: keep docked cards below it. */
const INSET = { top: 80, bottom: 24, horizontal: 16 };

export const STYLES: Record<TourStyle, { name: string; blurb: string }> = {
  aurora: { name: "Aurora", blurb: "Three lines of light, the guide orb and a soft glow" },
  balanced: { name: "Balanced", blurb: "The guide orb and one curved line" },
  subtle: { name: "Subtle", blurb: "A thin line and a quiet card" },
  minimal: { name: "Minimal", blurb: "An outline and a card, like a tooltip" },
};

export const BRANDS = [
  { name: "Violet", value: "#8B6CFF" },
  { name: "Blue", value: "#2F7BFF" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Green", value: "#22A06B" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Coral", value: "#F2555A" },
  { name: "Pink", value: "#E5489C" },
  { name: "Graphite", value: "#3F3F46" },
];

export const LANGUAGES: Record<Language, { name: string; labels?: Partial<TourLabels> }> = {
  en: { name: "English" },
  es: {
    name: "Español",
    labels: {
      next: "Siguiente",
      back: "Atrás",
      skip: "Saltar",
      done: "Listo",
      showMe: "Muéstrame",
      takeMeThere: "Llévame",
      notFound: "No encuentro esto aquí ahora mismo.",
      yourTurn: "Tu turno",
      stepOf: (n, total) => `Paso ${n} de ${total}`,
    },
  },
  hi: {
    name: "हिन्दी",
    labels: {
      next: "आगे",
      back: "पीछे",
      skip: "छोड़ें",
      done: "हो गया",
      showMe: "दिखाओ",
      takeMeThere: "वहाँ ले चलो",
      notFound: "यह अभी यहाँ नहीं मिल रहा।",
      yourTurn: "अब आपकी बारी",
      stepOf: (n, total) => `चरण ${n} / ${total}`,
    },
  },
};

export interface Settings {
  style: TourStyle;
  mode: "light" | "dark";
  brand: string;
  /** Overrides of what the style picks; `null` follows the style. */
  path: TourPathName | null;
  glow: number | null;
  backdrop: number | null;
  guide: boolean | null;
  radius: number;
  language: Language;
  customCard: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  style: "aurora",
  mode: "dark",
  brand: "#8B6CFF",
  path: null,
  glow: null,
  backdrop: null,
  guide: null,
  radius: 16,
  language: "en",
  customCard: false,
};

export const presetRadius = (style: TourStyle) => {
  return TOUR_STYLES[style].radius ?? 16;
};

/** The theme the site's tours use — built exactly as an app would build its own. */
export function themeFor(settings: Settings): TourTheme {
  const overrides: Partial<TourTheme> = { inset: INSET, radius: settings.radius };
  if (settings.path) overrides.path = settings.path;
  if (settings.glow !== null) overrides.glow = settings.glow;
  if (settings.backdrop !== null) overrides.backdrop = settings.backdrop;
  if (settings.guide !== null) overrides.guide = settings.guide;
  return createTourTheme({ brand: settings.brand, mode: settings.mode, style: settings.style, overrides });
}

/** The same theme as code, to paste into an app. */
export function themeCode(settings: Settings): string {
  const extra: string[] = [];
  const preset = TOUR_STYLES[settings.style];
  if (settings.path && settings.path !== preset.path) extra.push(`path: "${settings.path}"`);
  if (settings.glow !== null && settings.glow !== preset.glow) extra.push(`glow: ${settings.glow}`);
  if (settings.backdrop !== null) extra.push(`backdrop: ${settings.backdrop}`);
  if (settings.guide !== null && settings.guide !== preset.guide) extra.push(`guide: ${settings.guide}`);
  if (settings.radius !== presetRadius(settings.style)) extra.push(`radius: ${settings.radius}`);
  const overrides = extra.length ? `,\n  overrides: { ${extra.join(", ")} },` : ",";
  return `import { createTourTheme } from "hintbeam";

const theme = createTourTheme({
  brand: "${settings.brand}",
  mode: "${settings.mode}",
  style: "${settings.style}"${overrides}
});

<TourProvider theme={theme} … />`;
}

const SettingsContext = createContext<{ settings: Settings; update(patch: Partial<Settings>): void } | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const value = useMemo(() => ({ settings, update: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })) }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings outside SettingsProvider");
  return value;
}
