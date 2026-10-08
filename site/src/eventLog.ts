"use client";

import { useSyncExternalStore } from "react";
import type { TourPlugin } from "hintbeam";

/** A tiny analytics plugin: it records every tour event so the playground can show the plugin API working. */
export type LogEntry = { id: number; at: string; type: string; text: string };
let entries: readonly LogEntry[] = [];
let next = 0;
const listeners = new Set<() => void>();

export const eventLog: TourPlugin = {
  name: "site/event-log",
  apiVersion: 1,
  onEvent(event, context) {
    const step = "index" in event ? ` · step ${event.index + 1}` : "";
    const how = event.type === "step" ? ` · ${event.reason}` : "";
    const text = `${event.tour.id}${step}${how} · ${context.platform}`;
    const at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    entries = [{ id: next++, at, type: event.type, text }, ...entries].slice(0, 30);
    for (const listener of listeners) listener();
  },
};

const EMPTY: typeof entries = [];

export function clearEventLog() {
  entries = [];
  for (const listener of listeners) listener();
}

export function useEventLog() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => entries,
    () => EMPTY,
  );
}
