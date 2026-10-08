/**
 * What is drawn right now, and how to measure it. Elements are kept as refs, never positions:
 * nothing is measured until a step asks, and then only what that step needs.
 */

import type { Band, Box } from "./geometry.js";

/** Anything that can report its box in window coordinates, or `null` when it is not laid out. */
export interface Measurable {
  measure(): Promise<Box | null>;
}

export interface ElementEntry {
  measurable: Measurable;
  /** Corner radius of the element, so a highlight can follow its shape. */
  radius?: number;
}

/** A screen's scroll container: its visible band, its offset, and how to scroll it. */
export interface ScrollArea {
  band(): Promise<Band | null>;
  offset(): number;
  scrollTo(offset: number): void;
}

export interface Located {
  box: Box;
  radius: number;
  /** The screen the element was registered on, or `null` for one drawn on every screen. */
  screen: string | null;
}

/** A measurement that does not answer in this long counts as "not drawn". */
export const MEASURE_TIMEOUT_MS = 1000;

export function measureWithin(measurable: Measurable, ms = MEASURE_TIMEOUT_MS): Promise<Box | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (box: Box | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(box && box.width > 0 && box.height > 0 ? box : null);
    };
    const timer = setTimeout(() => done(null), ms);
    measurable.measure().then(done, () => done(null));
  });
}

/** Registrations made with no screen: drawn on every screen (a tab bar, a header). */
export const EVERY_SCREEN = null;

function add<K>(map: Map<K, ElementEntry[]>, key: K, entry: ElementEntry): () => void {
  const list = map.get(key) ?? [];
  list.push(entry);
  map.set(key, list);
  return () => {
    const current = map.get(key);
    if (!current) return;
    const index = current.indexOf(entry);
    if (index >= 0) current.splice(index, 1);
    // Nothing is kept for an element that is gone: the registry never grows with navigation.
    if (current.length === 0) map.delete(key);
  };
}

async function firstDrawn(entries: readonly ElementEntry[]): Promise<{ entry: ElementEntry; box: Box } | null> {
  const boxes = await Promise.all(entries.map((entry) => measureWithin(entry.measurable)));
  for (let i = 0; i < entries.length; i += 1) {
    const box = boxes[i];
    if (box) return { entry: entries[i]!, box };
  }
  return null;
}

const key = (screen: string | null, name: string) => `${screen ?? "\u0000"}\u0001${name}`;

export class ElementRegistry {
  private readonly targets = new Map<string, ElementEntry[]>();
  private readonly links = new Map<string, ElementEntry[]>();
  private readonly areas = new Map<string, ScrollArea>();
  private fallbackArea: ScrollArea | null = null;

  /** Register an element as target `name` on `screen` (or on every screen). Returns the unregister. */
  registerTarget(screen: string | null, name: string, entry: ElementEntry): () => void {
    return add(this.targets, key(screen, name), entry);
  }

  /** Register the element that takes the user to `screen` — its tab button, its menu item. */
  registerScreenLink(screen: string, entry: ElementEntry): () => void {
    return add(this.links, screen, entry);
  }

  registerScrollArea(screen: string, area: ScrollArea): () => void {
    this.areas.set(screen, area);
    return () => {
      if (this.areas.get(screen) === area) this.areas.delete(screen);
    };
  }

  /** The scroll area used by screens that registered none — the page itself, on the web. */
  setDefaultScrollArea(area: ScrollArea | null): void {
    this.fallbackArea = area;
  }

  scrollArea(screen: string | null): ScrollArea | null {
    return (screen === null ? null : this.areas.get(screen)) ?? this.fallbackArea;
  }

  /** Whether anything is registered as `name` on `screen` or on every screen, drawn or not. */
  isRegistered(name: string, screen: string | null): boolean {
    return this.targets.has(key(screen, name)) || this.targets.has(key(EVERY_SCREEN, name));
  }

  /**
   * The first element registered as `name` that is actually drawn, looking on `screen` first and
   * then on every screen. Several elements may carry one name — a phone tab bar and a tablet
   * sidebar — and whichever is laid out wins, so one tour plays at every size.
   */
  async locate(name: string, screen: string | null): Promise<Located | null> {
    const own = screen === EVERY_SCREEN ? [] : (this.targets.get(key(screen, name)) ?? []);
    const shared = this.targets.get(key(EVERY_SCREEN, name)) ?? [];
    const found = await firstDrawn([...own, ...shared]);
    if (!found) return null;
    return { box: found.box, radius: found.entry.radius ?? 0, screen: own.includes(found.entry) ? screen : EVERY_SCREEN };
  }

  /**
   * Every target drawn on `screen` (and on every screen) right now, with its box. For visual
   * editors and recorders that let someone pick what a step points at.
   */
  async drawnTargets(screen: string | null): Promise<{ name: string; box: Box }[]> {
    const names = new Set<string>();
    for (const k of this.targets.keys()) {
      const [scope, name] = k.split("\u0001") as [string, string];
      if (scope === (screen ?? "\u0000") || scope === "\u0000") names.add(name);
    }
    const found = await Promise.all([...names].map(async (name) => ({ name, located: await this.locate(name, screen) })));
    return found.filter((f) => f.located !== null).map((f) => ({ name: f.name, box: f.located!.box }));
  }

  /** The drawn element that leads to `screen`, if one is registered. */
  async locateScreenLink(screen: string): Promise<Located | null> {
    const found = await firstDrawn(this.links.get(screen) ?? []);
    return found ? { box: found.box, radius: found.entry.radius ?? 0, screen: EVERY_SCREEN } : null;
  }
}
