import { usePathname, useRouter, type Href } from "expo-router";
import type { TourRouter } from "../core/router.js";
import { useRouterAdapter } from "../react/routing.js";

/**
 * Expo Router — tabs, stacks and pushed screens. Screens are pathnames: `screen: "/food"` in
 * `defineTargets`. Put `TourProvider` in your root `_layout.tsx`.
 */
export function useExpoRouter(): TourRouter {
  const pathname = usePathname();
  const router = useRouter();
  return useRouterAdapter(pathname, (to) => router.navigate(to as Href));
}
