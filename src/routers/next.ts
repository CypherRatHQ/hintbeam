"use client";

import { usePathname, useRouter } from "next/navigation";
import type { TourRouter } from "../core/router.js";
import { useRouterAdapter } from "../react/routing.js";

/**
 * Next.js (App Router). Screens are pathnames: `screen: "/settings"` in `defineTargets`.
 *
 * ```tsx
 * "use client";
 * import { TourProvider } from "hintbeam";
 * import { useNextRouter } from "hintbeam/next";
 *
 * export function Tours({ children }) {
 *   return <TourProvider targets={targets} router={useNextRouter()}>{children}</TourProvider>;
 * }
 * ```
 */
export function useNextRouter(): TourRouter {
  const pathname = usePathname();
  const router = useRouter();
  return useRouterAdapter(pathname, (to) => router.push(to));
}
