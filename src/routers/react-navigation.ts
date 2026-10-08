import type { NavigationContainerRefWithCurrent, ParamListBase } from "@react-navigation/native";
import { useEffect, useState } from "react";
import type { TourRouter } from "../core/router.js";
import { useRouterAdapter } from "../react/routing.js";

/**
 * React Navigation 6/7. Screens are route names: `screen: "Food"` in `defineTargets`. Pass the
 * same ref you give `NavigationContainer`, so `TourProvider` can sit outside it:
 *
 * ```tsx
 * const navigationRef = createNavigationContainerRef();
 * <TourProvider targets={targets} router={useReactNavigation(navigationRef)}>
 *   <NavigationContainer ref={navigationRef}>…</NavigationContainer>
 * </TourProvider>
 * ```
 */
export function useReactNavigation(navigationRef: NavigationContainerRefWithCurrent<ParamListBase>): TourRouter {
  const [screen, setScreen] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setScreen(navigationRef.isReady() ? (navigationRef.getCurrentRoute()?.name ?? null) : null);
    read();
    const offState = navigationRef.addListener("state", read);
    const offReady = navigationRef.addListener("ready" as never, read);
    return () => {
      offState();
      offReady();
    };
  }, [navigationRef]);
  return useRouterAdapter(screen, (to) => {
    if (navigationRef.isReady()) navigationRef.navigate(to as never);
  });
}
