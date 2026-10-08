import { describe, expect, it } from "vitest";
import { createTourTheme, darkTheme, lightTheme, resolveTourTheme, TOUR_STYLES } from "./theme.js";

describe("createTourTheme", () => {
  it("defaults to the balanced style on light cards", () => {
    const theme = createTourTheme();
    expect(theme).toMatchObject({ card: lightTheme.card, path: "wave", guide: true, glow: 0.4, motion: "full" });
  });

  it("makes the light and button from a brand colour", () => {
    const theme = createTourTheme({ brand: "#e5484d" });
    expect(theme.accent).toBe("#E5484D");
    expect(theme.accent2).not.toBe(theme.accent); // a neighbouring hue to blend into
    expect(theme.onAccent).toBe("#FFFFFF");
    expect(createTourTheme({ brand: "#E5484D", brand2: "#E5484D" }).accent2).toBe("#E5484D"); // flat on request
  });

  it("puts dark text on a light brand colour", () => {
    expect(createTourTheme({ brand: "#FFD60A" }).onAccent).toBe("#111111");
  });

  it("lifts a very dark brand colour on dark cards so the light shows", () => {
    const theme = createTourTheme({ brand: "#101010", mode: "dark" });
    expect(theme.card).toBe(darkTheme.card);
    expect(theme.accent).not.toBe("#101010");
  });

  it("ignores a brand colour it cannot read", () => {
    expect(createTourTheme({ brand: "tomato" }).accent).toBe(lightTheme.accent);
  });

  it("goes from magical to plain with the style", () => {
    const aurora = createTourTheme({ style: "aurora" });
    const subtle = createTourTheme({ style: "subtle" });
    const minimal = createTourTheme({ style: "minimal" });
    expect(aurora).toMatchObject({ path: "strands", guide: true });
    expect(aurora.glow).toBeGreaterThan(subtle.glow);
    expect(subtle).toMatchObject({ path: "straight", guide: false, motion: "calm" });
    expect(minimal).toMatchObject({ light: false, glow: 0, backdrop: 0, radius: 10 });
    expect(createTourTheme({ style: "minimal", brand: "#2F7BFF" }).accent2).toBe("#2F7BFF"); // flat
    expect(Object.keys(TOUR_STYLES)).toEqual(["aurora", "balanced", "subtle", "minimal"]);
  });

  it("applies overrides last", () => {
    expect(createTourTheme({ style: "minimal", overrides: { radius: 4, inset: { top: 80 } } })).toMatchObject({
      radius: 4,
      inset: { top: 80, bottom: lightTheme.inset.bottom },
    });
  });
});

describe("resolveTourTheme", () => {
  it("keeps glow and backdrop between 0 and 1", () => {
    expect(resolveTourTheme({ glow: 4, backdrop: -1 })).toMatchObject({ glow: 1, backdrop: 0 });
  });
  it("makes a single accent a flat light", () => {
    expect(resolveTourTheme({ accent: "#123456" }).accent2).toBe("#123456");
  });
});
