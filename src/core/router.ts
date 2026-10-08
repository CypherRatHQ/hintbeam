/**
 * The one thing the core needs from your router: which screen is in front, how to go to another,
 * and a way to hear when it changes. Screens are named the way your router names them; targets
 * declare their screen with the same names.
 *
 * Ready-made adapters: `hintbeam/expo-router` and `hintbeam/react-navigation`.
 */
export interface TourRouter {
  currentScreen(): string | null;
  navigate(screen: string): void | Promise<void>;
  /** Call `listener` whenever the screen in front changes. Returns the unsubscribe. */
  subscribe(listener: (screen: string | null) => void): () => void;
}

/** For apps without a router: everything is on one screen. */
export const noRouter: TourRouter = {
  currentScreen: () => null,
  navigate: () => undefined,
  subscribe: () => () => undefined,
};

/** A router you drive yourself — for tests, storybooks and custom navigation. */
export function createManualRouter(initial: string | null = null): TourRouter & { setScreen(screen: string | null): void } {
  let screen = initial;
  const listeners = new Set<(screen: string | null) => void>();
  const setScreen = (next: string | null) => {
    if (next === screen) return;
    screen = next;
    for (const listener of listeners) listener(next);
  };
  return {
    currentScreen: () => screen,
    navigate: (next) => setScreen(next),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setScreen,
  };
}
