import { useEffect, useMemo, useRef } from "react";
import type { TourRouter } from "../core/router.js";

/**
 * Turn any router into a tour router from two things it already gives you: the current screen
 * (usually the pathname) and a way to navigate. Every built-in adapter is a few lines on top of this.
 *
 * ```tsx
 * const router = useRouterAdapter(location.pathname, (to) => navigate(to));
 * ```
 */
export function useRouterAdapter(screen: string | null, navigate: (screen: string) => void | Promise<void>): TourRouter {
  const current = useRef(screen);
  const go = useRef(navigate);
  go.current = navigate;
  const listeners = useRef(new Set<(screen: string | null) => void>());

  useEffect(() => {
    if (current.current === screen) return;
    current.current = screen;
    for (const listener of listeners.current) listener(screen);
  }, [screen]);

  return useMemo<TourRouter>(
    () => ({
      currentScreen: () => current.current,
      navigate: (to) => go.current(to),
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
    }),
    [],
  );
}
