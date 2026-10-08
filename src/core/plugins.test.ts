import { describe, expect, it, vi } from "vitest";
import { straight } from "./paths.js";
import { IDLE } from "./player.js";
import { TOUR_PLUGIN_API_VERSION, acceptTours, composePlugins, type TourPluginApi } from "./plugins.js";
import { defineTargets } from "./targets.js";

const targets = defineTargets({ a: {}, b: { screen: "/b" } });
const tour = { id: "t", steps: [{ target: "a", text: "Look at this." }] };
const context = { user: { id: "u1", traits: { plan: "pro" } }, platform: "web" };
const check = { ...context, tour, completed: false };

describe("composePlugins", () => {
  it("merges path styles, later plugins winning", () => {
    const host = composePlugins([
      { name: "a", paths: { zig: straight } },
      { name: "b", paths: { zag: straight, zig: straight } },
    ]);
    expect(Object.keys(host.paths).sort()).toEqual(["zag", "zig"]);
  });

  it("delivers every event with its context to every plugin, isolating failures", () => {
    const report = vi.fn();
    const seen: unknown[] = [];
    const host = composePlugins(
      [
        {
          name: "boom",
          onEvent: () => {
            throw new Error("x");
          },
        },
        { name: "ok", onEvent: (e, c) => seen.push([e.type, c.user?.id]) },
      ],
      report,
    );
    host.onEvent({ type: "complete", tour }, context);
    expect(seen).toEqual([["complete", "u1"]]);
    expect(report).toHaveBeenCalledWith("boom", expect.any(Error));
  });

  it("lets any plugin keep a tour from starting, but never lets a failing one block it", async () => {
    const report = vi.fn();
    expect(await composePlugins([{ name: "yes", canStart: () => true }]).canStart(check)).toBe(true);
    expect(
      await composePlugins([
        { name: "yes", canStart: () => true },
        { name: "no", canStart: async () => false },
      ]).canStart(check),
    ).toBe(false);
    expect(await composePlugins([{ name: "broken", canStart: () => Promise.reject(new Error("down")) }], report).canStart(check)).toBe(
      true,
    );
    expect(report).toHaveBeenCalledWith("broken", expect.any(Error));
  });

  it("passes the user and platform to canStart (audiences, entitlements)", async () => {
    const proOnly = composePlugins([{ name: "pro", canStart: (c) => c.user?.traits?.["plan"] === "pro" && c.platform === "web" }]);
    expect(await proOnly.canStart(check)).toBe(true);
    expect(await proOnly.canStart({ ...check, user: null })).toBe(false);
  });

  it("loads plugins' tours, validating each and reporting the rejects", async () => {
    const report = vi.fn();
    const host = composePlugins(
      [
        { name: "cms", tours: async () => [tour, { id: "bad", steps: [{ target: "nope", text: "Nothing here." }] }] },
        { name: "file", tours: () => [{ id: "t2", steps: [{ target: "b", text: "Over on b." }], meta: { version: 3 } }] },
        { name: "down", tours: () => Promise.reject(new Error("offline")) },
      ],
      report,
    );
    const loaded = await host.loadTours(context, targets);
    expect(loaded.map((t) => t.id)).toEqual(["t", "t2"]);
    expect(report).toHaveBeenCalledWith("cms", expect.objectContaining({ message: expect.stringMatching(/"bad" was rejected/) }));
    expect(report).toHaveBeenCalledWith("down", expect.any(Error));
  });

  it("runs setup with the plugin API and cleans up in reverse order", () => {
    const order: string[] = [];
    const host = composePlugins([
      { name: "one", setup: () => () => order.push("one") },
      { name: "two", setup: (api) => (order.push(`two saw ${api.platform}`), () => order.push("two")) },
      {
        name: "broken",
        setup: () => {
          throw new Error("x");
        },
      },
    ]);
    const api: TourPluginApi = {
      targets,
      platform: "web",
      getUser: () => null,
      start: async () => "started",
      stop: () => undefined,
      getState: () => IDLE,
      currentScreen: () => null,
      drawnTargets: async () => [],
      addTours: () => ({ added: [], rejected: [] }),
    };
    const cleanup = host.setup(api);
    cleanup();
    expect(order).toEqual(["two saw web", "two", "one"]);
  });

  it("warns about duplicate names and plugins written for a newer API", () => {
    const report = vi.fn();
    composePlugins([{ name: "a" }, { name: "a" }, { name: "future", apiVersion: TOUR_PLUGIN_API_VERSION + 1 }], report);
    expect(report).toHaveBeenCalledWith("a", expect.any(Error));
    expect(report).toHaveBeenCalledWith("future", expect.objectContaining({ message: expect.stringMatching(/Update hintbeam/) }));
  });
});

describe("acceptTours", () => {
  it("splits valid tours from rejected ones with their problems", () => {
    const { tours, rejected } = acceptTours([tour, "nonsense", { id: "x", steps: [] }], targets);
    expect(tours).toEqual([tour]);
    expect(rejected.map((r) => r.id)).toEqual([undefined, "x"]);
    expect(rejected[1]?.problems[0]?.message).toBe("A tour needs at least one step.");
  });
});
