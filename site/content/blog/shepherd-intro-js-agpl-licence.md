---
title: "Shepherd.js and Intro.js are AGPL: what that means for your app"
description: "Shepherd.js moved from MIT to AGPL-3.0 in 2024, and Intro.js has been AGPL for years. Who needs a paid licence, what it costs, and the MIT alternatives."
date: "2026-10-10"
author: "CypherRat"
tags: ["licensing", "agpl", "shepherd", "intro-js", "product-tours", "open-source"]
---

Shepherd.js and Intro.js are two of the best-known JavaScript libraries for product tours. Both are open source, and both are licensed **AGPL-3.0, with a paid commercial licence** for everyone the AGPL doesn't suit. For most companies, that means they are not free to use.

Some comparison pages still describe Shepherd as MIT, because it was until 2024. This post sets out what changed, what the licences say, and what your options are. Every fact here was checked on **10 October 2026** against the npm registry and the projects' own licence files and pricing pages.

*This is not legal advice. If a licence decision matters to your company, read the licence itself and ask whoever handles legal questions for you.*

**Our bias:** we build [Hintbeam](https://hintbeam.js.org), an MIT-licensed tour library, so we have an interest in this question. We have stuck to facts you can check from the links below.

## What changed, and when

| Package | Last MIT version | First AGPL version |
| --- | --- | --- |
| `shepherd.js` | 13.0.3 (5 August 2024) | 14.0.1 (10 October 2024) |
| `react-shepherd` | 6.1.9 (23 July 2025) | 7.0.0 (8 February 2026) |

Intro.js changed much earlier. Its [license.md](https://github.com/usablica/intro.js/blob/master/license.md) says versions older than 2.0.0 don't need a commercial licence, and its npm metadata has said AGPL-3.0 since version 2.5.0, in March 2017.

There is a catch with the React wrappers. `react-shepherd` 6.1.9 is labelled MIT, but it depends on `shepherd.js` 14.5.1, which is AGPL. The `intro.js-react` wrapper is MIT too, and it requires `intro.js` 2.5.0 or later, all of which are AGPL. A permissive licence on the wrapper doesn't change the licence of the library underneath it.

## What the licences say

**Shepherd.js.** Its [LICENSE.md](https://github.com/shipshapecode/shepherd/blob/main/LICENSE.md) says you may use it free of charge under AGPL-3.0 for open-source projects under an AGPL-compatible licence, for personal and non-commercial use, and to evaluate it for up to 30 days. It says you **must buy a commercial licence** if:

- you're building a commercial product, application, SaaS or website that generates revenue;
- your company generates revenue, *even if the project using Shepherd does not*; or
- you use Shepherd in any customer-facing commercial application.

**Intro.js.** Its [license.md](https://github.com/usablica/intro.js/blob/master/license.md) says that if you use Intro.js in a commercial project, you need a commercial licence. Versions older than 2.0.0 don't need one. The [Intro.js site](https://introjs.com) says it is free for open-source, personal and non-commercial sites.

**The AGPL side.** Shepherd's licence file sums up what using it under AGPL-3.0 asks of you: "Make your complete source code available if you distribute or provide your software over a network" and "License your code under AGPL-3.0 or a compatible license". The commercial licence exists for teams who can't do that.

## What the commercial licences cost

Both are one-time payments, valid for life, as listed on 10 October 2026:

| | Shepherd ([pricing](https://shepherdjs.dev/pricing)) | Intro.js ([pricing](https://introjs.com)) |
| --- | --- | --- |
| One project | — | $9.99 |
| Up to five projects | $50 | $49.99 |
| Unlimited projects | $300 | $299.99 |

That's cheap next to a hosted tour tool or an engineer's time. If one of these libraries is the right fit, paying for it is a perfectly good answer, and it funds the people who maintain it.

## When it matters

- **A company product, closed source:** you need the commercial licence, or a different library.
- **An open-source project under an AGPL-compatible licence:** you can use them under the AGPL.
- **A personal or non-commercial project:** both allow free use.
- **You're pinned to an old MIT version:** `shepherd.js` 13.0.3 and earlier are MIT, but you won't get fixes, so treat that as a stopgap.

## MIT-licensed alternatives

These are free for commercial use, under MIT. Details are as of 10 October 2026.

- **[Driver.js](https://driverjs.com).** Framework-free, actively released (1.9.0, October 2026) and the most downloaded of them all. It's the closest swap for Shepherd or Intro.js in a non-React or mixed app.
- **[React Joyride](https://react-joyride.com).** The most used React-specific library. Version 3 (March 2026) supports React 19 and accepts refs as targets.
- **[Reactour](https://github.com/elrumordelaluz/reactour)** (`@reactour/tour`). A smaller React library. Its last release was in May 2025.
- **[NextStep](https://nextstepjs.com).** Built for Next.js, with navigation between pages built in.
- **[Hintbeam](https://hintbeam.js.org)** (ours). React, Next.js and React Native from one package. Steps point at typed names instead of CSS selectors, and tours follow people across pages. It's new (0.x), and the React Native side is a preview.

For a side-by-side table, see [React product tour libraries in 2026](/blog/react-product-tour-libraries).

## Moving off Shepherd or Intro.js

The concepts carry over: a tour is a list of steps, and each step points at an element and shows some text. What changes is how a step finds its element.

In Shepherd you write `attachTo: { element: "#export", on: "bottom" }`. In Intro.js you add `data-intro` attributes or pass `element: "#export"`. Moving to Hintbeam, you give the element a name in the component that renders it, and the tour refers to that name:

```tsx
// tours.ts: every name, listed once
export const targets = defineTargets({
  export: { screen: "/reports" },
});

// In the component that renders the button
const exportButton = useTarget("export");
<button ref={exportButton}>Export</button>;

// The tour
const tour = defineTour(targets, {
  id: "reports-intro",
  steps: [{ target: "export", title: "Export", text: "Download this report as CSV." }],
});
```

A misspelt name is a type error. A CSS selector that stops matching would only fail when someone runs the tour. The [getting started guide](/docs/getting-started) covers the whole setup.

## Sources

- npm registry metadata for `shepherd.js`, `react-shepherd`, `intro.js` and `intro.js-react`, checked 10 October 2026.
- [Shepherd LICENSE.md](https://github.com/shipshapecode/shepherd/blob/main/LICENSE.md) and [Shepherd pricing](https://shepherdjs.dev/pricing).
- [Intro.js license.md](https://github.com/usablica/intro.js/blob/master/license.md) and [introjs.com](https://introjs.com).

Spotted something out of date? [Open an issue](https://github.com/CypherRatHQ/hintbeam/issues) and we'll fix it.
