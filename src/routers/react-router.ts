import { useLocation, useNavigate } from "react-router";
import type { TourRouter } from "../core/router.js";
import { useRouterAdapter } from "../react/routing.js";

/**
 * React Router 6/7 and Remix. Screens are pathnames: `screen: "/settings"` in `defineTargets`.
 * Render `TourProvider` inside the router so the hooks can see it.
 */
export function useReactRouter(): TourRouter {
  const location = useLocation();
  const navigate = useNavigate();
  return useRouterAdapter(location.pathname, (to) => navigate(to));
}
