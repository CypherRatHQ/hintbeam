---
title: "React product tour libraries in 2026: licences, React 19, routing"
description: "React Joyride, Driver.js, Shepherd, Intro.js, Reactour, NextStep, Onborda and Hintbeam compared: licence, React 19, routing and targeting. Checked October 2026."
date: "2026-10-10"
author: "CypherRat"
tags: ["product-tours", "react", "nextjs", "comparison", "onboarding", "open-source"]
---

There are a lot of product tour libraries for React, and comparisons go out of date quickly. Two popular libraries changed their licence, and React 19 support has changed since many older posts were written.

This post compares the libraries people actually install, on the four questions that decide whether one fits your app. Every fact comes from the npm registry, the project's own docs or its licence file, checked on **10 October 2026**. Download counts are for the week of 2–8 October 2026.

**Our bias:** we build [Hintbeam](https://hintbeam.js.org), one of the libraries below. We have tried to be fair, and we say where another library is the better choice.

## The four questions

1. **Can you use it for free in a commercial product?** Two of these libraries are AGPL-3.0 and sell a commercial licence. That matters if your company makes money.
2. **Does it support React 19?** That means it lists React 19 in its peer dependencies.
3. **How does a step find its element?** By CSS selector, by DOM element or ref, or by a name you attach in your components.
4. **Can a tour cross pages?** In a router-based app, a tour usually wants to walk someone from the dashboard to the settings page.

## The comparison

| Library | Licence | Latest release | Weekly downloads |
| --- | --- | --- | --- |
| [React Joyride](https://react-joyride.com) | MIT | 3.2.0, Jul 2026 | 1.39M |
| [Driver.js](https://driverjs.com) | MIT | 1.9.0, Oct 2026 | 2.31M |
| [Shepherd.js](https://shepherdjs.dev) | **AGPL-3.0 or paid** | 15.3.0, Aug 2026 | 337k |
| react-shepherd | **AGPL-3.0 or paid** | 7.0.6, Aug 2026 | 32k |
| [Intro.js](https://introjs.com) | **AGPL-3.0 or paid** | 8.6.0, Sep 2026 | 179k |
| [Reactour](https://github.com/elrumordelaluz/reactour) (`@reactour/tour`) | MIT | 3.8.0, May 2025 | 191k |
| [NextStep](https://nextstepjs.com) | MIT | 2.3.0, Jul 2026 | 70k |
| [Onborda](https://github.com/uixmat/onborda) | MIT | 1.2.5, Dec 2024 | 29k |
| [Hintbeam](https://hintbeam.js.org) | MIT | 0.1.0, Oct 2026 | New |

| Library | React 19 | A step finds its element by | Tours across pages |
| --- | --- | --- | --- |
| React Joyride | Yes | selector, element, ref or function | A recipe: navigate in `before` hooks |
| Driver.js | No React dependency | selector, element or function | A pattern: save progress, resume on the next page |
| Shepherd.js | Yes (react-shepherd) | selector or element | Not built in |
| Intro.js | No React dependency | selector or element | Not built in |
| Reactour | Yes | selector or element | Not built in |
| NextStep | Allowed (`>=18`) | selector (usually an `id`) | Built in: `nextRoute` / `prevRoute` |
| Onborda | Allowed (`>=18`) | `id` selector | Built in for Next.js, with a fixed 500 ms delay |
| Hintbeam | Allowed (`>=18`) | a typed name, attached with a hook | Built in: Next.js, React Router, Expo Router, React Navigation |

"Yes" means the package lists React 19 in its peer dependencies. "Allowed" means its range is open-ended, so React 19 installs without a warning. Intro.js's React wrapper, `intro.js-react`, was last released in May 2023.

A few things stand out.

**Driver.js and React Joyride are the most downloaded**, by a wide margin. Driver.js has no framework dependency and works anywhere there is a DOM. React Joyride is built for React, and its v3, released in March 2026, accepts refs as targets and supports React 19.

**Shepherd.js and Intro.js are not free for most companies.** Both are AGPL-3.0, with a paid commercial licence. Shepherd moved from MIT to AGPL at version 14.0.1 in October 2024. We cover what that means in [Shepherd.js and Intro.js are AGPL: what that means for your app](/blog/shepherd-intro-js-agpl-licence).

**Check release dates.** Reactour's last release was in May 2025, and Onborda's in December 2024.

**Only a few libraries treat routing as their job.** NextStep, Onborda and Hintbeam navigate between pages themselves. React Joyride and Driver.js document a pattern you build with your router.

## How each one finds its element

This matters more than it looks. A tour step has to find a button that you wrote somewhere else, and that somebody may rename next month.

- **CSS selectors** (`"#export-button"`, `".sidebar a:nth-child(3)"`) are the most common, and the most fragile. Nothing checks them when you build. Rename a class or wrap a component, and the tour points at nothing. The bug shows up when a user takes the tour.
- **Elements and refs** (React Joyride v3, Driver.js, Shepherd) avoid the selector, but the tour now needs a reference to the element. That usually means the tour config lives next to the component, or refs get passed to it.
- **Named targets** (Hintbeam) split the two. You list the names once, attach a name with `useTarget("export")` wherever the element renders, and write tours that say `target: "export"`. In TypeScript a misspelt name does not compile. The trade-off is one more concept to learn, and a hook in each component a tour points at.

## Which one should you use?

- **You want the most used, battle-tested React library:** **React Joyride.** v3 fixed the React 19 problems that many older blog posts still describe. Its multi-route recipe works if you're comfortable driving navigation yourself.
- **You want something framework-free, or your app isn't all React:** **Driver.js.** It is MIT, very popular and actively released.
- **You build with Next.js and want routing handled:** look at **NextStep** and **Hintbeam**. Both navigate between pages for you. For Hintbeam, see [How to add a product tour to a Next.js App Router app](/blog/nextjs-app-router-product-tour).
- **You're a company and considering Shepherd or Intro.js:** budget for the commercial licence. It is a one-time payment, from $50 for Shepherd and $9.99 for Intro.js, but read the terms first.
- **You need the same tours on the web and in React Native:** this is what Hintbeam was written for. One package, one tour definition, on the web and in React Native. Be aware that Hintbeam is new (0.x), and its React Native support is a preview that has not yet been run on real devices.
- **You want analytics, a no-code editor and A/B tests, and have budget:** a hosted tool such as Appcues, Userpilot, Chameleon or UserGuiding, which charge a monthly subscription.

## What we checked, and how

- Licences, versions, release dates and React peer ranges come from the npm registry (`registry.npmjs.org/<package>`), checked 10 October 2026.
- Shepherd's and Intro.js's licence terms come from their licence files, [Shepherd LICENSE.md](https://github.com/shipshapecode/shepherd/blob/main/LICENSE.md) and [Intro.js license.md](https://github.com/usablica/intro.js/blob/master/license.md), and from their pricing pages.
- Routing support comes from each project's docs: [React Joyride recipes](https://react-joyride.com/docs/recipes), [Driver.js multi-page tours](https://driverjs.com/docs/multi-page-tour), [NextStep routing](https://nextstepjs.com/docs/nextjs/routing) and the [Onborda README](https://github.com/uixmat/onborda).
- Weekly downloads come from `api.npmjs.org` for 2–8 October 2026.

Something wrong or out of date? [Open an issue](https://github.com/CypherRatHQ/hintbeam/issues) and we'll correct it.
