import { defineTargets, defineTour } from "hintbeam";

/** Everything on this site a tour can point at. The `about` lines double as authoring docs. */
export const targets = defineTargets(
  {
    heroStart: { screen: "/", about: "Home: the button that starts the site tour" },
    ladder: { screen: "/", about: "Home: the four ways a step finds its target" },
    navPlayground: { about: "Header: the Playground link, on every page" },
    navDocs: { about: "Header: the Docs link, on every page" },
    controls: { screen: "/playground", about: "Playground: path, theme and language switches" },
    revenue: { screen: "/playground", about: "Playground dashboard: the revenue card" },
    oldestActivity: { screen: "/playground", about: "Playground dashboard: the oldest item, far down the activity feed" },
    exportButton: { screen: "/playground", about: "Playground dashboard: the Export report button" },
    chart: { screen: "/playground/reports", about: "Reports: the weekly sign-ups chart" },
    invite: { screen: "/playground/team", about: "Team: the Invite teammate button" },
    jsonEditor: { screen: "/playground/json", about: "JSON tour: the editor" },
  },
  { events: ["report.exported", "teammate.invited"] },
);

declare module "hintbeam" {
  interface Register {
    targets: typeof targets;
  }
}

/** The 30-second tour of the site itself: crosses four pages, scrolls, waits for an action. */
export const siteTour = defineTour(targets, {
  id: "site-tour",
  steps: [
    {
      target: "ladder",
      title: "It finds its own way",
      text: "Each step checks where its element is right now: in view, further down, on another page, or missing.",
    },
    { target: "navPlayground", title: "Next stop: the playground", text: "This tour is about to leave the page. Watch it follow you." },
    { target: "revenue", title: "A new page", text: "This card lives in the playground. The tour offered to take you here." },
    { target: "oldestActivity", title: "Scrolled away", text: "The oldest event is far down the feed. Show me brings it into view." },
    {
      target: "exportButton",
      title: "Your turn",
      text: "Some steps wait for your app. Export the report to continue.",
      advanceOn: { event: "report.exported", timeout: 20 },
    },
    {
      target: "chart",
      title: "Any page in your app",
      text: "Reports is a different page. The tour found the chart as soon as it appeared.",
    },
    {
      target: "invite",
      title: "Tap the real button",
      text: "The tour is a companion, not a modal. Invite a teammate to finish.",
      advanceOn: "tap",
    },
    { target: "navDocs", title: "That's the tour", text: "Everything you just saw is in the guide, with code you can copy." },
  ],
});

/** The tour the playground's Play button starts. */
export const playgroundTour = defineTour(targets, {
  id: "playground-tour",
  steps: [
    { target: "controls", title: "Make it yours", text: "Pick a style and your brand colour here. The tour changes as you go." },
    { target: "revenue", title: "Point at anything", text: "Any element you mark with useTarget can be part of a tour." },
    {
      target: "oldestActivity",
      title: "Out of view",
      text: "This one is further down. The light points the way, and Show me scrolls to it.",
    },
    {
      target: "exportButton",
      title: "Wait for the app",
      text: "Press Export report. This step waits until your app says the export is done.",
      advanceOn: { event: "report.exported", timeout: 20 },
    },
    { target: "chart", title: "Another page", text: "This chart is on the Reports page. Take me there goes straight to it." },
    { target: "invite", title: "Tap to continue", text: "Tap Invite. The page stays fully usable.", advanceOn: "tap" },
    {
      target: "jsonEditor",
      title: "Tours are just data",
      text: "Edit a tour as JSON here. It is checked as you type, and you can play it straight away.",
    },
  ],
});
