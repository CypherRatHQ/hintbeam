import { describe, expect, it } from "vitest";
import { edgeNormal, inflate, meetPoint, nearEdge, scrollToShow, visibilityOf } from "./geometry.js";
import { contains, edgeBeacon, placeStep } from "./layout.js";
import { TOUR_PATHS, defineTourPath, straight, strands, wave } from "./paths.js";

const band = { top: 100, bottom: 700 };

describe("visibilityOf", () => {
  it("is visible when enough of the box is in the band", () => {
    expect(visibilityOf({ x: 0, y: 300, width: 100, height: 50 }, band)).toBe("visible");
    expect(visibilityOf({ x: 0, y: 80, width: 100, height: 50 }, band)).toBe("visible"); // 30 of 50 = 60 %
  });
  it("says which way it went", () => {
    expect(visibilityOf({ x: 0, y: 0, width: 100, height: 50 }, band)).toBe("above");
    expect(visibilityOf({ x: 0, y: 690, width: 100, height: 50 }, band)).toBe("below");
  });
  it("judges a box taller than the band against the band", () => {
    expect(visibilityOf({ x: 0, y: 50, width: 100, height: 2000 }, band)).toBe("visible");
  });
});

describe("scrollToShow", () => {
  it("puts a box that fits a third of the way down", () => {
    expect(scrollToShow({ x: 0, y: 1000, width: 100, height: 60 }, band, 0)).toBe(1000 - 100 - (600 - 60) / 3);
  });
  it("puts a box that does not fit at the top, with a margin", () => {
    expect(scrollToShow({ x: 0, y: 1000, width: 100, height: 900 }, band, 200)).toBe(200 + 1000 - 100 - 24);
  });
  it("never scrolls past the top", () => {
    expect(scrollToShow({ x: 0, y: 0, width: 100, height: 50 }, band, 0)).toBe(0);
  });
});

describe("nearEdge", () => {
  const box = { x: 100, y: 100, width: 200, height: 100 };
  it("meets the edge facing the start", () => {
    expect(nearEdge({ x: 0, y: 0 }, box)).toEqual({ x: 200, y: 100 });
    expect(nearEdge({ x: 0, y: 500 }, box)).toEqual({ x: 200, y: 200 });
    expect(nearEdge({ x: 0, y: 150 }, box)).toEqual({ x: 100, y: 150 });
    expect(nearEdge({ x: 500, y: 150 }, box)).toEqual({ x: 300, y: 150 });
  });
});

describe("path styles", () => {
  const from = { x: 40, y: 60 };
  const target = { x: 200, y: 400, width: 120, height: 48 };

  for (const [name, style] of Object.entries(TOUR_PATHS)) {
    it(`${name}: starts at the start, ends at the near edge, evenly sampled, pure`, () => {
      const route = style(from, target, { samples: 12 });
      expect(route.points[0]).toEqual(from);
      const last = route.points.at(-1)!;
      expect(last).toEqual(route.end);
      // Every style ends on the target's edge.
      const onEdge =
        Math.abs(last.y - target.y) < 1e-6 ||
        Math.abs(last.y - (target.y + target.height)) < 1e-6 ||
        Math.abs(last.x - target.x) < 1e-6 ||
        Math.abs(last.x - (target.x + target.width)) < 1e-6;
      expect(onEdge).toBe(true);
      expect(route.d.startsWith("M 40 60 C")).toBe(true);
      expect(route.length).toBeGreaterThanOrEqual(Math.hypot(route.end.x - from.x, route.end.y - from.y) - 0.01);
      // Points are evenly spaced along the path; chords across the elbow's corner are a little shorter.
      const tolerance = name === "elbow" ? 0.3 : 0.06;
      const gaps = route.points.slice(1).map((p, i) => Math.hypot(p.x - route.points[i]!.x, p.y - route.points[i]!.y));
      const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      for (const gap of gaps) expect(Math.abs(gap - mean) / mean).toBeLessThan(tolerance);
      expect(style(from, target, { samples: 12 })).toEqual(route);
    });
  }

  it("straight is never longer than wave or arc to the same edge", () => {
    expect(straight(from, target).length).toBeLessThanOrEqual(wave(from, target).length);
  });

  it("elbow goes straight in when the target is directly below", () => {
    expect(TOUR_PATHS.elbow({ x: 250, y: 60 }, target).d).toBe(straight({ x: 250, y: 60 }, target).d);
  });

  it("leaves a gap at the start when asked", () => {
    const route = wave(from, target, { gap: 20 });
    expect(Math.hypot(route.start.x - from.x, route.start.y - from.y)).toBeCloseTo(20, 5);
  });

  for (const name of ["wave", "strands", "arc"] as const) {
    it(`${name}: leaves along \`leave\` and meets the target square on`, () => {
      const box = { x: 600, y: 100, width: 200, height: 60 };
      // A card to the left of the target, light leaving its right edge.
      const route = TOUR_PATHS[name]({ x: 300, y: 400 }, box, { leave: { x: 1, y: 0 }, samples: 40 });
      const [p0, p1] = route.points;
      const first = { x: p1!.x - p0!.x, y: p1!.y - p0!.y };
      expect(first.x / Math.hypot(first.x, first.y)).toBeGreaterThan(0.6); // goes right, out of the card
      const before = route.points.at(-2)!;
      const last = { x: route.end.x - before.x, y: route.end.y - before.y };
      // The end is on the bottom edge; the light arrives going up, nearly square on.
      expect(route.end.y).toBe(box.y + box.height);
      expect(-last.y / Math.hypot(last.x, last.y)).toBeGreaterThan(0.85);
    });
  }

  it("never runs back over its own card, whichever way the target is", () => {
    const card = { x: 400, y: 300, width: 320, height: 160 };
    const inside = (p: { x: number; y: number }) =>
      p.x > card.x + 1 && p.x < card.x + card.width - 1 && p.y > card.y + 1 && p.y < card.y + card.height - 1;
    const exits = [
      { from: { x: 436, y: 300 }, leave: { x: 0, y: -1 } }, // top edge
      { from: { x: 684, y: 460 }, leave: { x: 0, y: 1 } }, // bottom edge
      { from: { x: 720, y: 336 }, leave: { x: 1, y: 0 } }, // right edge
      { from: { x: 400, y: 336 }, leave: { x: -1, y: 0 } }, // left edge
    ];
    const targets = [
      { x: 100, y: 40, width: 120, height: 40 },
      { x: 900, y: 40, width: 120, height: 40 },
      { x: 900, y: 700, width: 120, height: 40 },
      { x: 100, y: 700, width: 120, height: 40 },
      { x: 520, y: 40, width: 80, height: 40 },
    ];
    for (const style of [TOUR_PATHS.wave, TOUR_PATHS.strands, TOUR_PATHS.arc]) {
      for (const { from, leave } of exits) {
        for (const target of targets) {
          // placeStep always puts the guide on the edge facing the target.
          const toward = (target.x + target.width / 2 - from.x) * leave.x + (target.y + target.height / 2 - from.y) * leave.y;
          if (toward <= 0) continue;
          const route = style(from, target, { leave, gap: 4, samples: 80 });
          expect({ from, target, crossing: route.points.filter(inside).length }).toEqual({ from, target, crossing: 0 });
        }
      }
    }
  });

  it("never hooks: no sharp turn anywhere, even for a wide target off to the side", () => {
    // The founder's screenshot: a card below and left of a wide revenue card.
    const target = { x: 380, y: 0, width: 630, height: 180 };
    for (const style of [TOUR_PATHS.wave, TOUR_PATHS.strands, TOUR_PATHS.arc]) {
      const route = style({ x: 200, y: 320 }, target, { leave: { x: 0, y: -1 }, gap: 4, samples: 60 });
      let sharpest = 0;
      for (let i = 2; i < route.points.length; i++) {
        const [a, b, c] = [route.points[i - 2]!, route.points[i - 1]!, route.points[i]!];
        const turn = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
        sharpest = Math.max(sharpest, Math.min(turn, 2 * Math.PI - turn));
      }
      expect((sharpest * 180) / Math.PI).toBeLessThan(12);
    }
  });

  it("companion strands stay apart until the very end", () => {
    const route = strands({ x: 0, y: 300 }, { x: 600, y: 0, width: 10, height: 10 }, { samples: 2 });
    const controls = (d: string) => d.split(" ").slice(-6).map(Number); // c1x c1y c2x c2y ex ey
    const main = controls(route.d);
    const companion = controls(route.strands![0]!.d);
    expect(Math.hypot(main[2]! - companion[2]!, main[3]! - companion[3]!)).toBeGreaterThan(5);
  });

  it("accepts custom styles", () => {
    const zigzag = defineTourPath((a, b) => straight(a, b));
    expect(zigzag(from, target).length).toBeCloseTo(straight(from, target).length);
  });
});

describe("meetPoint", () => {
  const box = { x: 100, y: 100, width: 400, height: 100 };
  it("meets the facing edge nearest the origin, within its middle half", () => {
    expect(meetPoint({ x: 0, y: 400 }, box)).toEqual({ x: 200, y: 200 }); // clamped to a quarter in
    expect(meetPoint({ x: 260, y: 400 }, box)).toEqual({ x: 260, y: 200 }); // straight below
    expect(meetPoint({ x: 900, y: 0 }, box)).toEqual({ x: 400, y: 100 });
    expect(meetPoint({ x: 0, y: 150 }, box)).toEqual({ x: 100, y: 150 });
  });
});

describe("edgeNormal and inflate", () => {
  const box = { x: 10, y: 10, width: 100, height: 50 };
  it("points out of the edge a point is on", () => {
    expect(edgeNormal({ x: 50, y: 10 }, box)).toEqual({ x: 0, y: -1 });
    expect(edgeNormal({ x: 50, y: 60 }, box)).toEqual({ x: 0, y: 1 });
    expect(edgeNormal({ x: 10, y: 30 }, box)).toEqual({ x: -1, y: 0 });
    expect(edgeNormal({ x: 110, y: 30 }, box)).toEqual({ x: 1, y: 0 });
  });
  it("grows a box on every side", () => {
    expect(inflate(box, 6)).toEqual({ x: 4, y: 4, width: 112, height: 62 });
  });
});

describe("contains", () => {
  it("includes a little slack for fingers", () => {
    const box = { x: 10, y: 10, width: 20, height: 20 };
    expect(contains(box, { x: 20, y: 20 })).toBe(true);
    expect(contains(box, { x: 32, y: 20 })).toBe(true);
    expect(contains(box, { x: 40, y: 20 })).toBe(false);
  });
});

describe("placeStep", () => {
  const desk = { width: 1280, height: 800 };
  const options = { insets: { top: 60, bottom: 30, horizontal: 16 }, maxWidth: 360, gap: 56, guideOffset: 36 };

  it("sits below a target with room under it, the guide on its top edge facing up", () => {
    const p = placeStep(desk, { x: 500, y: 100, width: 200, height: 40 }, 150, options);
    expect(p).toMatchObject({ side: "below", edge: "top", top: 196, left: 420, width: 360 });
    expect(p.guide).toEqual({ x: 456, y: 196 });
  });
  it("sits above when there is no room below", () => {
    const p = placeStep(desk, { x: 500, y: 640, width: 200, height: 40 }, 150, options);
    expect(p).toMatchObject({ side: "above", edge: "bottom", top: 640 - 56 - 150 });
    expect(p.guide.y).toBe(p.top + 150);
  });
  it("goes beside a target too tall for above or below", () => {
    const p = placeStep(desk, { x: 100, y: 80, width: 300, height: 640 }, 150, options);
    expect(p).toMatchObject({ side: "right", edge: "left", left: 456 });
    expect(p.guide.x).toBe(456);
  });
  it("never leaves the screen horizontally", () => {
    const p = placeStep(desk, { x: 1240, y: 100, width: 30, height: 30 }, 150, options);
    expect(p.left + p.width).toBeLessThanOrEqual(1280 - 16);
    expect(p.guide.x).toBe(p.left + p.width - 36); // the end nearer the target
  });
  it("docks toward a target scrolled away, facing the edge it is past", () => {
    const below = placeStep(desk, { x: 500, y: 1400, width: 200, height: 40 }, 150, options);
    expect(below).toMatchObject({ side: "bottom", edge: "bottom", top: 800 - 30 - 150 - 56 });
    const above = placeStep(desk, { x: 500, y: -300, width: 200, height: 40 }, 150, options);
    expect(above).toMatchObject({ side: "top", edge: "top", top: 60 + 56 });
  });
  it("always docks on phones, away from a target on screen", () => {
    const phone = { width: 390, height: 844 };
    const p = placeStep(phone, { x: 20, y: 600, width: 100, height: 40 }, 150, options);
    expect(p).toMatchObject({ side: "top", edge: "bottom", left: 16, width: 358 });
  });
  it("sits at the bottom with nothing to point at", () => {
    expect(placeStep(desk, null, 150, options)).toMatchObject({ side: "bottom", edge: "top" });
  });
});

describe("edgeBeacon", () => {
  it("sits on the band edge the target is past, in line with it", () => {
    const viewport = { width: 400, height: 800 };
    expect(edgeBeacon(viewport, { x: 100, y: 1200, width: 40, height: 20 }, "down")).toEqual({ x: 119, y: 798, width: 2, height: 2 });
    expect(edgeBeacon(viewport, { x: 390, y: -200, width: 40, height: 20 }, "up", { top: 64, bottom: 800 })).toMatchObject({
      x: 371,
      y: 64,
    });
  });
});

describe("strands", () => {
  it("draws the wave with two companions that meet it at the target", () => {
    const target = { x: 400, y: 100, width: 80, height: 40 };
    const route = strands({ x: 100, y: 500 }, target);
    expect(route.strands).toHaveLength(2);
    const end = route.end;
    for (const strand of route.strands!) {
      expect(strand.d.endsWith(`${end.x} ${end.y}`)).toBe(true);
      expect(strand.length).toBeGreaterThan(0);
    }
    expect(route.strands![0]!.d).not.toBe(route.strands![1]!.d);
    expect(TOUR_PATHS.strands).toBe(strands);
  });
});
