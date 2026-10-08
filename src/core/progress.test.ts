import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  PROGRESS_LIMIT,
  createTourStorage,
  mergeTourProgress,
  progressOf,
  recordComplete,
  recordSkip,
  recordStart,
  recordStep,
  type TourProgressState,
  type TourProgress,
} from "./progress.js";

const t = (minutes: number) => new Date(Date.UTC(2026, 9, 7, 12, minutes)).toISOString();

describe("progress records", () => {
  it("walks start → step → skip → restart → complete", () => {
    let state = recordStart(EMPTY_PROGRESS, "g", t(0));
    expect(progressOf(state, "g")).toMatchObject({ step: 0, plays: 1, completedAt: null, skippedAt: null });
    state = recordStep(state, "g", 2, t(1));
    expect(progressOf(state, "g")).toMatchObject({ step: 2, updatedAt: t(1) });
    state = recordSkip(state, "g", 2, t(2));
    expect(progressOf(state, "g")).toMatchObject({ step: 2, skippedAt: t(2) });
    state = recordStart(state, "g", t(3));
    expect(progressOf(state, "g")).toMatchObject({ step: 0, plays: 2, skippedAt: null, startedAt: t(0) });
    state = recordComplete(state, "g", t(4));
    expect(progressOf(state, "g")).toMatchObject({ completedAt: t(4), step: 0 });
    state = recordComplete(state, "g", t(5));
    expect(progressOf(state, "g")?.completedAt).toBe(t(4));
  });

  it("keeps only the most recently touched tours", () => {
    let state: TourProgressState = EMPTY_PROGRESS;
    for (let i = 0; i < PROGRESS_LIMIT + 5; i += 1) state = recordStart(state, `g${i}`, t(i));
    expect(state.tours).toHaveLength(PROGRESS_LIMIT);
    expect(progressOf(state, "g0")).toBeNull();
    expect(progressOf(state, `g${PROGRESS_LIMIT + 4}`)).not.toBeNull();
  });
});

describe("createTourStorage", () => {
  it("round-trips through a string store and ignores garbage", async () => {
    const data = new Map<string, string>();
    const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const storage = createTourStorage(store);
    expect(await storage.load()).toBeNull();
    const state = recordStart(EMPTY_PROGRESS, "g", t(0));
    await storage.save(state);
    expect(await storage.load()).toEqual(state);
    data.set("hintbeam.progress", "{not json");
    expect(await storage.load()).toBeNull();
    data.set("hintbeam.progress", JSON.stringify({ tours: [{ id: 1 }] }));
    expect(await storage.load()).toBeNull();
  });

  it("never throws when the store fails", async () => {
    const storage = createTourStorage({
      getItem: async () => Promise.reject(new Error("locked")),
      setItem: async () => Promise.reject(new Error("full")),
    });
    expect(await storage.load()).toBeNull();
    await expect(storage.save(EMPTY_PROGRESS)).resolves.toBeUndefined();
  });
});

describe("mergeTourProgress", () => {
  const p = (id: string, over: Partial<TourProgress>): TourProgress => ({
    id,
    step: 0,
    startedAt: t(0),
    completedAt: null,
    skippedAt: null,
    plays: 1,
    updatedAt: t(0),
    ...over,
  });
  const normal = (state: TourProgressState) => mergeTourProgress(state, EMPTY_PROGRESS);

  it("lets the newer copy say where they are and keeps the earliest start, first completion and most plays", () => {
    const a: TourProgressState = { tours: [p("g", { step: 3, startedAt: t(0), plays: 2, updatedAt: t(5) })] };
    const b: TourProgressState = { tours: [p("g", { step: 1, startedAt: t(2), completedAt: t(4), plays: 1, updatedAt: t(3) })] };
    expect(mergeTourProgress(a, b).tours).toEqual([p("g", { step: 3, startedAt: t(0), completedAt: t(4), plays: 2, updatedAt: t(5) })]);
  });

  it("breaks exact ties the same way whatever the order", () => {
    const a: TourProgressState = { tours: [p("g", { step: 2, updatedAt: t(5) })] };
    const b: TourProgressState = { tours: [p("g", { step: 4, updatedAt: t(5) })] };
    expect(mergeTourProgress(a, b)).toEqual(mergeTourProgress(b, a));
  });

  it("is commutative, associative and idempotent over random states", () => {
    let seed = 20261007;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const randomState = (): TourProgressState => ({
      tours: ["a", "b", "c", "d"]
        .filter(() => rand() > 0.3)
        .map((id) =>
          p(id, {
            step: Math.floor(rand() * 8),
            startedAt: t(Math.floor(rand() * 10)),
            completedAt: rand() < 0.5 ? t(Math.floor(rand() * 10)) : null,
            plays: 1 + Math.floor(rand() * 5),
            updatedAt: t(Math.floor(rand() * 10)),
          }),
        ),
    });
    for (let i = 0; i < 300; i += 1) {
      const [a, b, c] = [randomState(), randomState(), randomState()];
      expect(mergeTourProgress(a, b)).toEqual(mergeTourProgress(b, a));
      expect(mergeTourProgress(mergeTourProgress(a, b), c)).toEqual(mergeTourProgress(a, mergeTourProgress(b, c)));
      expect(mergeTourProgress(a, a)).toEqual(normal(a));
    }
  });
});
