// @vitest-environment jsdom
import { useEffect, useState } from "react";
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  browserTourStorage,
  createManualRouter,
  defineTargets,
  createTourStorage,
  defineTour,
  TourProvider,
  useScreenLink,
  useTarget,
  useTour,
  useTours,
  type TourPluginApi,
  type TourEvent,
} from "./index.js";

// Steps measure after the screen settles; leave room for a busy CI machine.
configure({ asyncUtilTimeout: 3000 });

beforeAll(() => {
  // jsdom lays nothing out: give every element a box so targets count as drawn.
  Element.prototype.getBoundingClientRect = function () {
    const top = Number((this as HTMLElement).dataset?.["top"] ?? 100);
    return { x: 20, y: top, left: 20, top, width: 120, height: 40, right: 140, bottom: top + 40, toJSON: () => ({}) } as DOMRect;
  };
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  // The card waits for its own height before showing; jsdom reports 0 for everything.
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 120 });
});
afterEach(cleanup);

/** The card reveals its words one by one; match the whole text of the step. */
const stepText = (text: string) => (_: string, element: Element | null) =>
  element?.classList.contains("hb-text") === true && element.textContent === text;

const targets = defineTargets({
  search: { screen: "/food" },
  save: { screen: "/food" },
  settingsLink: {},
  theme: { screen: "/settings" },
});
const tour = defineTour(targets, {
  id: "demo",
  steps: [
    { target: "search", title: "Search", text: "Find any food here." },
    { target: "save", text: "Save it with one tap.", advanceOn: "tap" },
    { target: "theme", text: "Pick a theme you like." },
  ],
});

function App({ onEvent }: { onEvent?: (event: TourEvent) => void }) {
  const router = useRouterForTest();
  return (
    <TourProvider targets={targets} router={router} onEvent={onEvent}>
      <Page screenName={router.currentScreen()} />
    </TourProvider>
  );
}

let testRouter = createManualRouter("/food");
function useRouterForTest() {
  return testRouter;
}

function Page({ screenName }: { screenName: string | null }) {
  const search = useTarget<HTMLInputElement>("search");
  const save = useTarget<HTMLButtonElement>("save");
  const link = useScreenLink<HTMLAnchorElement>("/settings");
  const { start, isActive, index } = useTour();
  return (
    <div>
      <p data-testid="screen">{screenName}</p>
      <input ref={search} aria-label="search" />
      <button ref={save} type="button" data-top="300">
        Save
      </button>
      <a ref={link} href="#settings">
        Settings
      </a>
      <button type="button" onClick={() => void start(tour)}>
        Start
      </button>
      <p data-testid="state">{isActive ? `step ${index}` : "idle"}</p>
    </div>
  );
}

describe("web TourProvider", () => {
  it("plays a tour: card, Next, tap-to-advance, Take me there, Escape", async () => {
    testRouter = createManualRouter("/food");
    const events: string[] = [];
    render(<App onEvent={(event) => events.push(event.type)} />);

    fireEvent.click(screen.getByText("Start"));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText(stepText("Find any food here."))).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Search" })).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText(stepText("Save it with one tap."));
    // A tap step waits for the tap: no primary button once the target is found.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Next" })).toBeNull());

    // Tap the highlighted target (pointer down + up inside its box).
    const save = screen.getByText("Save", { selector: "button" });
    act(() => {
      save.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 60, clientY: 310 }));
      save.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 60, clientY: 310 }));
    });
    await screen.findByText(stepText("Pick a theme you like."));

    // The target is on another screen: the card offers to go there.
    fireEvent.click(await screen.findByRole("button", { name: "Take me there" }));
    expect(testRouter.currentScreen()).toBe("/settings");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(events).toEqual(["start", "step", "step", "step", "skip"]);
  });

  it("lets a plugin keep a tour from starting", async () => {
    testRouter = createManualRouter("/food");
    function Gated() {
      const { start } = useTour();
      const search = useTarget("search");
      return (
        <>
          <input ref={search} />
          <button type="button" onClick={() => void start(tour).then((result) => ((document.title = result), undefined))}>
            Go
          </button>
        </>
      );
    }
    render(
      <TourProvider targets={targets} plugins={[{ name: "pro-only", canStart: () => false }]}>
        <Gated />
      </TourProvider>,
    );
    fireEvent.click(screen.getByText("Go"));
    await waitFor(() => expect(document.title).toBe("blocked"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("startOnce plays a first-visit tour once, even with slow (async) storage", async () => {
    testRouter = createManualRouter("/food");
    // Like AsyncStorage: reads take a moment, so progress is not loaded on the first render.
    let saved: string | null = null;
    const slowStorage = () =>
      createTourStorage({
        getItem: () => new Promise<string | null>((resolve) => setTimeout(() => resolve(saved), 40)),
        setItem: (_key, value) => {
          saved = value;
        },
      });
    const once = defineTour(targets, { id: "once", steps: [{ target: "search", text: "Only the first time." }] });
    function FirstVisit() {
      const { startOnce, next } = useTour();
      const search = useTarget("search");
      useEffect(() => {
        void startOnce(once).then((result) => {
          document.title = result;
        });
      }, [startOnce]);
      return (
        <>
          <input ref={search} />
          <button type="button" onClick={next}>
            Finish
          </button>
        </>
      );
    }
    const visit = () =>
      render(
        <TourProvider targets={targets} storage={slowStorage()}>
          <FirstVisit />
        </TourProvider>,
      );

    document.title = "";
    visit();
    await waitFor(() => expect(document.title).toBe("started"));
    fireEvent.click(screen.getByText("Finish"));
    await waitFor(() => expect(saved).toContain("completedAt"));
    cleanup();

    // A reload: the tour was finished, so it stays closed.
    document.title = "";
    visit();
    await waitFor(() => expect(document.title).toBe("seen"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("startOnce treats a skipped tour as seen", async () => {
    testRouter = createManualRouter("/food");
    let saved: string | null = null;
    const storage = createTourStorage({
      getItem: () => saved,
      setItem: (_key, value) => {
        saved = value;
      },
    });
    function Skipper() {
      const { startOnce, skip } = useTour();
      const search = useTarget("search");
      return (
        <>
          <input ref={search} />
          <button type="button" onClick={() => void startOnce(tour).then((result) => ((document.title = result), undefined))}>
            Once
          </button>
          <button type="button" onClick={skip}>
            Not now
          </button>
        </>
      );
    }
    render(
      <TourProvider targets={targets} storage={storage}>
        <Skipper />
      </TourProvider>,
    );
    fireEvent.click(screen.getByText("Once"));
    await waitFor(() => expect(document.title).toBe("started"));
    fireEvent.click(screen.getByText("Not now"));
    fireEvent.click(screen.getByText("Once"));
    await waitFor(() => expect(document.title).toBe("seen"));
  });

  it("finds a target that renders after its step opened, without a scroll", async () => {
    testRouter = createManualRouter("/food");
    function Late() {
      const { start } = useTour();
      const [loaded, setLoaded] = useState(false);
      return (
        <>
          <button type="button" onClick={() => void start(tour)}>
            Start
          </button>
          <button type="button" onClick={() => setLoaded(true)}>
            Load
          </button>
          {loaded ? <LateSearch /> : null}
        </>
      );
    }
    function LateSearch() {
      const search = useTarget("search");
      return <input ref={search} aria-label="late search" />;
    }
    const { container } = render(
      <TourProvider targets={targets} router={testRouter}>
        <Late />
      </TourProvider>,
    );
    fireEvent.click(screen.getByText("Start"));
    await waitFor(() => expect(container.ownerDocument.querySelector(".hb-note")).not.toBeNull());
    fireEvent.click(screen.getByText("Load"));
    await waitFor(() => expect(container.ownerDocument.querySelector(".hb-note")).toBeNull());
  });

  it("browserTourStorage keeps progress in localStorage", async () => {
    window.localStorage.clear();
    const storage = browserTourStorage("test.progress");
    await expect(storage.load()).resolves.toBeNull();
    await storage.save({ tours: [] });
    expect(window.localStorage.getItem("test.progress")).toContain('"tours"');
    await expect(browserTourStorage("test.progress").load()).resolves.toEqual({ tours: [] });
  });

  it("explains a missing provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Lonely() {
      useTour();
      return null;
    }
    expect(() => render(<Lonely />)).toThrow(/must be used inside <TourProvider>/);
    spy.mockRestore();
  });

  it("supports a fully custom step UI", async () => {
    testRouter = createManualRouter("/food");
    function Start() {
      const { start } = useTour();
      const search = useTarget("search");
      return (
        <>
          <input ref={search} />
          <button type="button" onClick={() => void start(tour)}>
            Go
          </button>
        </>
      );
    }
    render(
      <TourProvider targets={targets} renderStep={(step) => <aside>custom: {step.step?.text}</aside>}>
        <Start />
      </TourProvider>,
    );
    fireEvent.click(screen.getByText("Go"));
    expect(await screen.findByText("custom: Find any food here.")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("starts tours by id from plugins, validates them, and gives plugins a working API", async () => {
    testRouter = createManualRouter("/food");
    let api: TourPluginApi | null = null;
    const seen: string[] = [];
    function Menu() {
      const tours = useTours();
      const { start } = useTour();
      const search = useTarget("search");
      return (
        <>
          <input ref={search} />
          <p data-testid="catalog">{tours.map((t) => t.id).join(",")}</p>
          <button type="button" onClick={() => void start("from-cms")}>
            By id
          </button>
        </>
      );
    }
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <TourProvider
        targets={targets}
        router={testRouter}
        user={{ id: "u1", traits: { plan: "pro" } }}
        plugins={[
          {
            name: "cms",
            tours: () => [
              { id: "from-cms", steps: [{ target: "search", text: "Loaded from a CMS." }] },
              { id: "broken", steps: [{ target: "nowhere", text: "This should be rejected." }] },
            ],
          },
          {
            name: "observer",
            onEvent: (event, context) => seen.push(`${event.type}:${context.user?.id}:${context.platform}`),
            setup: (given) => {
              api = given;
            },
          },
        ]}
      >
        <Menu />
      </TourProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("catalog").textContent).toBe("from-cms"));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('plugin "cms"'),
      expect.objectContaining({ message: expect.stringMatching(/"broken" was rejected/) }),
    );
    fireEvent.click(screen.getByText("By id"));
    expect(await screen.findByText(stepText("Loaded from a CMS."))).toBeTruthy();
    expect(seen[0]).toBe("start:u1:web");

    // The plugin API can list what is on screen and play a tour it adds at runtime.
    const live = api as TourPluginApi | null;
    expect(live).not.toBeNull();
    expect((await live!.drawnTargets()).map((t) => t.name)).toContain("search");
    const { added } = live!.addTours([{ id: "live", steps: [{ target: "search", text: "Pushed by a live preview." }] }]);
    await act(async () => {
      await live!.start(added[0]!);
    });
    expect(await screen.findByText(stepText("Pushed by a live preview."))).toBeTruthy();
    expect(await live!.start("missing")).toBe("unknown-tour");
    warn.mockRestore();
  });
});
