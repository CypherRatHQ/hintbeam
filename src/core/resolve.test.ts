import { describe, expect, it } from "vitest";
import type { Box } from "./geometry.js";
import { ElementRegistry, EVERY_SCREEN, type Measurable } from "./registry.js";
import { resolveTarget } from "./resolve.js";
import { defineTargets } from "./targets.js";

const targets = defineTargets({
  foodTab: {},
  search: { screen: "/food" },
  weight: { screen: "/progress" },
});
const drawn = (box: Box): Measurable => ({ measure: async () => box });
const band = { top: 100, bottom: 700 };

function setup() {
  const registry = new ElementRegistry();
  registry.registerScrollArea("/food", { band: async () => band, offset: () => 0, scrollTo: () => undefined });
  return registry;
}

describe("resolveTarget", () => {
  it("1. visible: points at a target in view", async () => {
    const registry = setup();
    registry.registerTarget("/food", "search", { measurable: drawn({ x: 0, y: 300, width: 200, height: 40 }), radius: 8 });
    expect(await resolveTarget({ registry, targets, screen: "/food" }, "search")).toEqual({
      kind: "visible",
      highlight: { box: { x: 0, y: 300, width: 200, height: 40 }, radius: 8 },
      band,
    });
  });

  it("2. offscreen: says which way the target was scrolled", async () => {
    const registry = setup();
    registry.registerTarget("/food", "search", { measurable: drawn({ x: 0, y: 1200, width: 200, height: 40 }) });
    expect(await resolveTarget({ registry, targets, screen: "/food" }, "search")).toMatchObject({ kind: "offscreen", direction: "down" });
    const registry2 = setup();
    registry2.registerTarget("/food", "search", { measurable: drawn({ x: 0, y: -400, width: 200, height: 40 }) });
    expect(await resolveTarget({ registry: registry2, targets, screen: "/food" }, "search")).toMatchObject({
      kind: "offscreen",
      direction: "up",
    });
  });

  it("3. otherScreen: points at the link to the target's screen", async () => {
    const registry = setup();
    registry.registerScreenLink("/progress", { measurable: drawn({ x: 200, y: 760, width: 80, height: 48 }), radius: 12 });
    expect(await resolveTarget({ registry, targets, screen: "/food" }, "weight")).toEqual({
      kind: "otherScreen",
      screen: "/progress",
      link: { box: { x: 200, y: 760, width: 80, height: 48 }, radius: 12 },
    });
  });

  it("3b. otherScreen: still says where to go when no link is registered", async () => {
    expect(await resolveTarget({ registry: setup(), targets, screen: "/food" }, "weight")).toEqual({
      kind: "otherScreen",
      screen: "/progress",
      link: null,
    });
  });

  it("4. notFound: never points at nothing", async () => {
    const registry = setup();
    expect(await resolveTarget({ registry, targets, screen: "/food" }, "search")).toEqual({ kind: "notFound", reason: "not-drawn" });
    expect(await resolveTarget({ registry, targets, screen: "/food" }, "ghost")).toEqual({ kind: "notFound", reason: "not-declared" });
  });

  it("treats something drawn on every screen as visible on any screen, never scrolled", async () => {
    const registry = setup();
    registry.registerTarget(EVERY_SCREEN, "foodTab", { measurable: drawn({ x: 0, y: 760, width: 80, height: 48 }) });
    for (const screen of ["/food", "/home", null]) {
      expect(await resolveTarget({ registry, targets, screen }, "foodTab")).toMatchObject({ kind: "visible", band: null });
    }
  });

  it("points at a drawn target when the screen has no scroll area", async () => {
    const registry = new ElementRegistry();
    registry.registerTarget("/food", "search", { measurable: drawn({ x: 0, y: 5000, width: 10, height: 10 }) });
    expect((await resolveTarget({ registry, targets, screen: "/food" }, "search")).kind).toBe("visible");
  });
});
