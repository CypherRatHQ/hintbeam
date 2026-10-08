import { describe, expect, it } from "vitest";
import type { Box } from "./geometry.js";
import { ElementRegistry, EVERY_SCREEN, measureWithin, type Measurable } from "./registry.js";

const drawn = (box: Box): Measurable => ({ measure: async () => box });
const hidden: Measurable = { measure: async () => ({ x: 0, y: 0, width: 0, height: 0 }) };
const gone: Measurable = { measure: async () => null };
const silent: Measurable = { measure: () => new Promise(() => undefined) };
const failing: Measurable = { measure: async () => Promise.reject(new Error("unmounted")) };
const box = (y: number): Box => ({ x: 10, y, width: 100, height: 40 });

describe("ElementRegistry", () => {
  it("finds a target on its screen", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget("/food", "search", { measurable: drawn(box(200)), radius: 8 });
    expect(await registry.locate("search", "/food")).toEqual({ box: box(200), radius: 8, screen: "/food" });
    expect(await registry.locate("search", "/home")).toBeNull();
  });

  it("finds a target drawn on every screen from any screen", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget(EVERY_SCREEN, "foodTab", { measurable: drawn(box(700)) });
    expect(await registry.locate("foodTab", "/home")).toEqual({ box: box(700), radius: 0, screen: null });
    expect(await registry.locate("foodTab", null)).toEqual({ box: box(700), radius: 0, screen: null });
  });

  it("lets whichever registration is drawn win, in either order (tab bar vs sidebar)", async () => {
    for (const order of [
      [hidden, drawn(box(700))],
      [drawn(box(700)), hidden],
    ] as const) {
      const registry = new ElementRegistry();
      for (const measurable of order) registry.registerTarget(EVERY_SCREEN, "foodTab", { measurable });
      expect((await registry.locate("foodTab", "/home"))?.box).toEqual(box(700));
    }
  });

  it("prefers the screen's own element over a shared one", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget(EVERY_SCREEN, "help", { measurable: drawn(box(10)) });
    registry.registerTarget("/food", "help", { measurable: drawn(box(300)) });
    expect(await registry.locate("help", "/food")).toEqual({ box: box(300), radius: 0, screen: "/food" });
  });

  it("treats a hidden, missing, failing or silent element as not drawn", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget("/food", "a", { measurable: hidden });
    registry.registerTarget("/food", "b", { measurable: gone });
    registry.registerTarget("/food", "c", { measurable: failing });
    expect(await registry.locate("a", "/food")).toBeNull();
    expect(await registry.locate("b", "/food")).toBeNull();
    expect(await registry.locate("c", "/food")).toBeNull();
    expect(await measureWithin(silent, 10)).toBeNull();
  });

  it("forgets an element on unregister and never grows with navigation", async () => {
    const registry = new ElementRegistry();
    const off = registry.registerTarget("/food", "search", { measurable: drawn(box(1)) });
    expect(registry.isRegistered("search", "/food")).toBe(true);
    off();
    off(); // idempotent
    expect(registry.isRegistered("search", "/food")).toBe(false);
    expect(await registry.locate("search", "/food")).toBeNull();
  });

  it("locates the link to a screen", async () => {
    const registry = new ElementRegistry();
    expect(await registry.locateScreenLink("/food")).toBeNull();
    const off = registry.registerScreenLink("/food", { measurable: drawn(box(700)), radius: 12 });
    expect(await registry.locateScreenLink("/food")).toEqual({ box: box(700), radius: 12, screen: null });
    off();
    expect(await registry.locateScreenLink("/food")).toBeNull();
  });

  it("keeps one scroll area per screen and only removes its own", () => {
    const registry = new ElementRegistry();
    const area = { band: async () => ({ top: 0, bottom: 100 }), offset: () => 0, scrollTo: () => undefined };
    const newer = { ...area };
    const off = registry.registerScrollArea("/food", area);
    expect(registry.scrollArea("/food")).toBe(area);
    registry.registerScrollArea("/food", newer);
    off(); // the old screen unmounting after the new one mounted must not remove the new one
    expect(registry.scrollArea("/food")).toBe(newer);
    expect(registry.scrollArea(null)).toBeNull();
  });
});

describe("drawnTargets", () => {
  it("lists what is drawn on a screen and on every screen, for editors and recorders", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget("/food", "search", { measurable: drawn(box(10)) });
    registry.registerTarget("/food", "hidden", { measurable: hidden });
    registry.registerTarget("/home", "elsewhere", { measurable: drawn(box(20)) });
    registry.registerTarget(EVERY_SCREEN, "tab", { measurable: drawn(box(700)) });
    const found = await registry.drawnTargets("/food");
    expect(found.map((f) => f.name).sort()).toEqual(["search", "tab"]);
  });
});
