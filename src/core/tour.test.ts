import { describe, expect, it } from "vitest";
import { defineTargets } from "./targets.js";
import { TOUR_LIMITS, advanceOf, defineTour, formatTourProblems, parseTour, validateTour } from "./tour.js";

const targets = defineTargets(
  {
    foodTab: { about: "The Food tab in the bar" },
    search: { screen: "/food", about: "The food search box" },
    logButton: { screen: "/food" },
  },
  { events: ["meal.logged"] },
);

const good = {
  id: "first-meal",
  steps: [
    { target: "foodTab", text: "Everything you eat lives here." },
    { target: "search", title: "Search", text: "Find any food.", advanceOn: "tap" },
    { target: "logButton", text: "Log it in one tap.", advanceOn: { event: "meal.logged", timeout: 30 } },
  ],
};

describe("defineTargets", () => {
  it("lists names, screens and events", () => {
    expect(targets.names).toEqual(["foodTab", "search", "logButton"]);
    expect(targets.screenOf("search")).toBe("/food");
    expect(targets.screenOf("foodTab")).toBeNull();
    expect(targets.about("logButton")).toBeNull();
    expect(targets.events).toEqual(["meal.logged"]);
    expect(targets.has("nowhere")).toBe(false);
  });

  it("rejects a name with surrounding spaces", () => {
    expect(() => defineTargets({ " x": {} })).toThrow(/surrounding spaces/);
  });
});

describe("validateTour", () => {
  it("accepts a good tour", () => {
    expect(validateTour(good, targets)).toEqual([]);
  });

  it("rejects an undeclared target the same way from code and from JSON, with a hint", () => {
    const bad = { id: "x", steps: [{ target: "serach", text: "Find any food." }] };
    const problems = validateTour(bad, targets);
    expect(problems).toEqual([{ path: "steps[0].target", message: '"serach" is not a declared target. Did you mean "search"?' }]);
    // @ts-expect-error — "serach" is not a declared target, so this does not compile
    expect(() => defineTour(targets, bad)).toThrow(/Did you mean "search"/);
    const parsed = parseTour(JSON.parse(JSON.stringify(bad)), targets);
    expect(parsed).toEqual({ ok: false, problems });
  });

  it("gives no hint when nothing is close", () => {
    expect(validateTour({ id: "x", steps: [{ target: "zzzzzzzz", text: "Find any food." }] }, targets)[0]?.message).toBe(
      '"zzzzzzzz" is not a declared target.',
    );
  });

  it("returns the tour for valid JSON", () => {
    const parsed = parseTour(JSON.parse(JSON.stringify(good)), targets);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.tour.id).toBe("first-meal");
  });

  it("keeps tours short", () => {
    expect(validateTour({ id: "x", steps: [] }, targets)).toContainEqual({ path: "steps", message: "A tour needs at least one step." });
    const many = { id: "x", steps: Array.from({ length: TOUR_LIMITS.steps + 1 }, () => ({ target: "search", text: "Find any food." })) };
    expect(validateTour(many, targets)[0]?.message).toMatch(/8 steps or fewer \(this has 9\)/);
  });

  it("keeps words plain and on one line", () => {
    expect(validateTour({ id: "x", steps: [{ target: "search", text: "Click <b>here</b>" }] }, targets)).toEqual([
      { path: "steps[0].text", message: "Use plain words on one line, without < or >." },
    ]);
    expect(validateTour({ id: "x", steps: [{ target: "search", text: "two\nlines here" }] }, targets)).toHaveLength(1);
    expect(validateTour({ id: "x", steps: [{ target: "search", text: "abc" }] }, targets)).toEqual([
      { path: "steps[0].text", message: "Use at least 4 characters." },
    ]);
  });

  it("names unknown fields, so typos surface", () => {
    expect(validateTour({ id: "x", steps: [{ target: "search", text: "Find any food.", titel: "oops" }] }, targets)).toEqual([
      { path: "steps[0].titel", message: '"titel" is not a field here. Expected one of: target, title, text, advanceOn, meta.' },
    ]);
  });

  it("checks every way a step can end", () => {
    const step = (advanceOn: unknown) => ({ id: "x", steps: [{ target: "search", text: "Find any food.", advanceOn }] });
    expect(validateTour(step("later"), targets)[0]?.message).toBe('Use "next", "tap", "arrive", or { event: "name" }.');
    expect(validateTour(step({ event: "meal.eaten" }), targets)).toEqual([
      { path: "steps[0].advanceOn.event", message: '"meal.eaten" is not a declared event. Declared: meal.logged.' },
    ]);
    expect(validateTour(step({ event: "meal.logged", timeout: 2 }), targets)).toEqual([
      { path: "steps[0].advanceOn.timeout", message: "Use a whole number of seconds from 5 to 300." },
    ]);
    expect(validateTour(step({ event: "meal.logged" }), targets)).toEqual([]);
    expect(validateTour(step("arrive"), targets)).toEqual([]);
  });

  it("refuses arrive on a target that is on every screen", () => {
    expect(
      validateTour({ id: "x", steps: [{ target: "foodTab", text: "Go to food.", advanceOn: "arrive" }] }, targets)[0]?.message,
    ).toMatch(/nowhere to arrive/);
  });

  it("allows any event name when the app declared none", () => {
    const loose = defineTargets({ a: { screen: "s" } });
    expect(validateTour({ id: "x", steps: [{ target: "a", text: "Wait for it.", advanceOn: { event: "anything" } }] }, loose)).toEqual([]);
  });

  it("explains input that is not a tour", () => {
    expect(validateTour("nope", targets)).toEqual([{ path: "", message: "A tour is an object with an id and steps." }]);
    expect(validateTour({ id: "x", steps: "nope" }, targets)).toContainEqual({ path: "steps", message: "Give the tour a list of steps." });
  });

  it("formats problems as one readable message", () => {
    const text = formatTourProblems("x", validateTour({ id: "x", steps: [{ target: "nope", text: "abc" }] }, targets));
    expect(text).toBe(
      'Tour "x" has 2 problems:\n  • steps[0].target: "nope" is not a declared target.\n  • steps[0].text: Use at least 4 characters.',
    );
  });
});

describe("advanceOf", () => {
  it("defaults to next and fills the event timeout", () => {
    expect(advanceOf({})).toEqual({ kind: "next" });
    expect(advanceOf({ advanceOn: "tap" })).toEqual({ kind: "tap" });
    expect(advanceOf({ advanceOn: { event: "e" } })).toEqual({ kind: "event", event: "e", timeout: TOUR_LIMITS.timeoutDefault });
  });
});

describe("meta", () => {
  it("accepts plain metadata on tours and steps, and bounds it", () => {
    const withMeta = {
      id: "m",
      meta: { version: 3, audience: "trial" },
      steps: [{ target: "search", text: "Find any food.", meta: { experiment: "b" } }],
    };
    expect(validateTour(withMeta, targets)).toEqual([]);
    expect(validateTour({ ...withMeta, meta: "v3" }, targets)).toEqual([
      { path: "meta", message: "Use an object of plain values for meta." },
    ]);
    expect(validateTour({ ...withMeta, meta: { blob: "x".repeat(TOUR_LIMITS.metaBytes) } }, targets)[0]?.message).toMatch(
      /under 4096 characters/,
    );
  });
});
