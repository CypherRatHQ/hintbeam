/**
 * Where each user is in each tour. Every change is a pure function, and the merge is commutative,
 * associative and idempotent, so copies from two devices can be joined safely.
 */

export interface TourProgress {
  id: string;
  /** The step to show when they come back. */
  step: number;
  startedAt: string;
  /** First finish; stays set when the tour is replayed. */
  completedAt: string | null;
  skippedAt: string | null;
  plays: number;
  /** When this copy last changed. The newer copy says where they are. */
  updatedAt: string;
}

export interface TourProgressState {
  tours: readonly TourProgress[];
}

export const EMPTY_PROGRESS: TourProgressState = { tours: [] };

/** Progress is kept for this many tours; the least recently touched go first. */
export const PROGRESS_LIMIT = 120;

/**
 * Where progress is kept. Give the provider one backed by AsyncStorage, MMKV, SecureStore or your
 * server; the default keeps it in memory for the session.
 */
export interface TourStorage {
  load(): Promise<TourProgressState | null>;
  save(state: TourProgressState): Promise<void>;
}

export function memoryTourStorage(initial: TourProgressState = EMPTY_PROGRESS): TourStorage {
  let current = initial;
  return {
    load: async () => current,
    save: async (state) => {
      current = state;
    },
  };
}

/** A storage backed by any async key-value store with `getItem` / `setItem` (AsyncStorage, localStorage). */
export function createTourStorage(
  store: { getItem(key: string): Promise<string | null> | string | null; setItem(key: string, value: string): Promise<void> | void },
  key = "hintbeam.progress",
): TourStorage {
  return {
    load: async () => {
      try {
        const raw = await store.getItem(key);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isProgressState(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save: async (state) => {
      try {
        await store.setItem(key, JSON.stringify(state));
      } catch {
        // Progress is a convenience; a full or unavailable store must never break the app.
      }
    },
  };
}

function isProgressState(value: unknown): value is TourProgressState {
  if (typeof value !== "object" || value === null || !Array.isArray((value as TourProgressState).tours)) return false;
  return (value as TourProgressState).tours.every(
    (t) =>
      typeof t === "object" &&
      t !== null &&
      typeof t.id === "string" &&
      typeof t.step === "number" &&
      typeof t.plays === "number" &&
      typeof t.startedAt === "string" &&
      typeof t.updatedAt === "string",
  );
}

export function progressOf(state: TourProgressState, id: string): TourProgress | null {
  return state.tours.find((t) => t.id === id) ?? null;
}

const time = (iso: string) => Date.parse(iso);
const byRecency = (a: TourProgress, b: TourProgress) => time(a.updatedAt) - time(b.updatedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function keep(tours: TourProgress[]): TourProgressState {
  const sorted = tours.sort(byRecency);
  return { tours: sorted.slice(Math.max(0, sorted.length - PROGRESS_LIMIT)) };
}

function upsert(state: TourProgressState, entry: TourProgress): TourProgressState {
  return keep([...state.tours.filter((t) => t.id !== entry.id), entry]);
}

function current(state: TourProgressState, id: string, now: string): TourProgress {
  return progressOf(state, id) ?? { id, step: 0, startedAt: now, completedAt: null, skippedAt: null, plays: 1, updatedAt: now };
}

export function recordStart(state: TourProgressState, id: string, now: string): TourProgressState {
  const known = progressOf(state, id);
  return upsert(state, {
    id,
    step: 0,
    startedAt: known?.startedAt ?? now,
    completedAt: known?.completedAt ?? null,
    skippedAt: null,
    plays: (known?.plays ?? 0) + 1,
    updatedAt: now,
  });
}

export function recordStep(state: TourProgressState, id: string, step: number, now: string): TourProgressState {
  return upsert(state, { ...current(state, id, now), step, skippedAt: null, updatedAt: now });
}

export function recordSkip(state: TourProgressState, id: string, step: number, now: string): TourProgressState {
  return upsert(state, { ...current(state, id, now), step, skippedAt: now, updatedAt: now });
}

export function recordComplete(state: TourProgressState, id: string, now: string): TourProgressState {
  const known = current(state, id, now);
  return upsert(state, { ...known, step: 0, completedAt: known.completedAt ?? now, skippedAt: null, updatedAt: now });
}

function earliest(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return time(a) <= time(b) ? a : b;
}

/**
 * Two copies joined. Per tour, the copy updated last says where they are; the earliest start and
 * first completion are kept; plays is the larger count. Order of arguments never matters.
 */
export function mergeTourProgress(a: TourProgressState, b: TourProgressState): TourProgressState {
  const byId = new Map<string, TourProgress>();
  for (const entry of [...a.tours, ...b.tours]) {
    const known = byId.get(entry.id);
    if (!known) {
      byId.set(entry.id, entry);
      continue;
    }
    const newer =
      time(entry.updatedAt) > time(known.updatedAt) ||
      (entry.updatedAt === known.updatedAt && JSON.stringify(entry) > JSON.stringify(known))
        ? entry
        : known;
    byId.set(entry.id, {
      ...newer,
      startedAt: earliest(known.startedAt, entry.startedAt)!,
      completedAt: earliest(known.completedAt, entry.completedAt),
      plays: Math.max(known.plays, entry.plays),
      updatedAt: time(known.updatedAt) >= time(entry.updatedAt) ? known.updatedAt : entry.updatedAt,
    });
  }
  return keep([...byId.values()]);
}
