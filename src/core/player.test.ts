import { describe, expect, it } from "vitest";
import { IDLE, TourPlayer, type TourEvent } from "./player.js";
import { memoryTourStorage, progressOf } from "./progress.js";
import { defineTargets } from "./targets.js";
import { defineTour } from "./tour.js";

const targets = defineTargets({ foodTab: {}, search: { screen: "/food" }, weight: { screen: "/progress" } }, { events: ["meal.logged"] });

const welcome = defineTour(targets, {
  id: "welcome",
  steps: [
    { target: "foodTab", text: "Everything you eat lives here." },
    { target: "search", text: "Find any food.", advanceOn: "tap" },
    { target: "weight", text: "Your weight lives here.", advanceOn: "arrive" },
    { target: "search", text: "Log something.", advanceOn: { event: "meal.logged", timeout: 10 } },
  ],
});
const short = defineTour(targets, { id: "short", steps: [{ target: "search", text: "Just the one step here." }] });

function harness(storage = memoryTourStorage()) {
  let clock = Date.UTC(2026, 9, 7, 12, 0);
  const timers: { run: () => void; at: number; cancelled: boolean }[] = [];
  const events: TourEvent[] = [];
  const player = new TourPlayer({
    targets,
    storage,
    now: () => new Date(clock),
    setTimer: (run, ms) => {
      const timer = { run, at: clock + ms, cancelled: false };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
    onEvent: (event) => events.push(event),
  });
  const wait = (ms: number) => {
    clock += ms;
    for (const timer of timers) if (!timer.cancelled && timer.at <= clock) timer.run();
  };
  const toLastStep = async () => {
    await player.start(welcome);
    player.next();
    player.targetTapped();
    player.screenChanged("/progress");
  };
  return { player, events, storage, wait, toLastStep };
}

describe("TourPlayer", () => {
  it("plays from the first step; the last Next completes", async () => {
    const { player, events, storage } = harness();
    expect(await player.start(short)).toBe("started");
    expect(player.getState()).toMatchObject({ index: 0, total: 1, isFirst: true, isLast: true, step: short.steps[0] });
    player.next();
    expect(player.getState()).toEqual(IDLE);
    expect(events.map((e) => e.type)).toEqual(["start", "step", "complete"]);
    expect(progressOf((await storage.load())!, "short")?.completedAt).not.toBeNull();
    expect(player.hasCompleted(short)).toBe(true);
  });

  it("treats a double start as one start and lets a different tour replace it", async () => {
    const { player } = harness();
    await player.start(welcome);
    player.next();
    expect(await player.start(welcome)).toBe("already-playing");
    expect(player.getState().index).toBe(1);
    await player.start(short);
    expect(player.getState().tour?.id).toBe("short");
  });

  it("ends a tap step only when the target is tapped", async () => {
    const { player } = harness();
    await player.start(welcome);
    player.targetTapped(); // step 0 ends on Next; tapping its target does nothing
    expect(player.getState().index).toBe(0);
    player.next();
    player.targetTapped();
    expect(player.getState().index).toBe(2);
  });

  it("ends an arrive step when the target's screen comes to the front", async () => {
    const { player } = harness();
    await player.start(welcome);
    player.next();
    player.targetTapped();
    player.screenChanged("/food");
    player.screenChanged(null);
    expect(player.getState().index).toBe(2);
    player.screenChanged("/progress");
    expect(player.getState().index).toBe(3);
  });

  it("ends an event step on its event, and offers Next after the timeout", async () => {
    const { player, wait, toLastStep } = harness();
    await toLastStep();
    expect(player.getState()).toMatchObject({ index: 3, waitedTooLong: false, isLast: true });
    player.emit("something.else");
    expect(player.getState().index).toBe(3);
    wait(10_000);
    expect(player.getState().waitedTooLong).toBe(true);
    player.emit("meal.logged");
    expect(player.getState()).toEqual(IDLE);
  });

  it("cancels the wait when the step changes first", async () => {
    const { player, wait, toLastStep } = harness();
    await toLastStep();
    player.back();
    wait(20_000);
    expect(player.getState()).toMatchObject({ index: 2, waitedTooLong: false });
  });

  it("skips by remembering the step, and resumes there", async () => {
    const { player, storage, events } = harness();
    await player.start(welcome);
    player.next();
    player.skip();
    expect(player.getState()).toEqual(IDLE);
    expect(progressOf((await storage.load())!, "welcome")).toMatchObject({ step: 1, skippedAt: expect.any(String) });
    expect(player.resumeIndex(welcome)).toBe(1);
    expect(await player.resume(welcome)).toBe("resumed");
    expect(player.getState().index).toBe(1);
    expect(events.filter((e) => e.type === "start")).toMatchObject([{ resumed: false }, { resumed: true, index: 1 }]);
  });

  it("starts over on start, and resume falls back to the start when there is nothing to resume", async () => {
    const { player } = harness();
    await player.start(welcome);
    player.next();
    player.skip();
    expect(await player.start(welcome)).toBe("started");
    expect(player.getState().index).toBe(0);
    player.skip();
    expect(player.resumeIndex(welcome)).toBeNull(); // skipped on the first step: nothing to resume
    expect(await player.resume(welcome)).toBe("started");
  });

  it("reads saved progress before the first start", async () => {
    const storage = memoryTourStorage({
      tours: [
        {
          id: "welcome",
          step: 2,
          startedAt: "2026-10-01T00:00:00.000Z",
          completedAt: null,
          skippedAt: "2026-10-01T00:01:00.000Z",
          plays: 1,
          updatedAt: "2026-10-01T00:01:00.000Z",
        },
      ],
    });
    const { player } = harness(storage);
    expect(await player.resume(welcome)).toBe("resumed");
    expect(player.getState().index).toBe(2);
  });

  it("survives storage that fails", async () => {
    const player = new TourPlayer({
      targets,
      storage: { load: () => Promise.reject(new Error("no")), save: () => Promise.reject(new Error("no")) },
    });
    expect(await player.start(short)).toBe("started");
    player.next();
    expect(player.getState()).toEqual(IDLE);
  });

  it("notifies subscribers until they unsubscribe", async () => {
    const { player } = harness();
    const seen: number[] = [];
    const off = player.subscribe((state) => seen.push(state.index));
    await player.start(welcome);
    player.next();
    off();
    player.targetTapped();
    expect(seen).toEqual([0, 1]);
  });

  it("stops without recording a skip", async () => {
    const { player, storage, events } = harness();
    await player.start(welcome);
    player.next();
    player.stop();
    expect(player.getState()).toEqual(IDLE);
    expect(progressOf((await storage.load())!, "welcome")?.skippedAt).toBeNull();
    expect(events.at(-1)).toMatchObject({ type: "stop", index: 1 });
  });

  it("ignores controls when nothing is playing", () => {
    const { player, events } = harness();
    player.next();
    player.back();
    player.skip();
    player.stop();
    player.emit("meal.logged");
    player.targetTapped();
    player.screenChanged("/food");
    expect(events).toEqual([]);
  });
});
