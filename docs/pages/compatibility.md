---
title: Compatibility
description: Foundation ships an explicit browser support baseline, defined in .browserslistrc and enforced by automated checks.
tags:
  - support
  - browser
---

## Overview

Since version 6.10, the browser support baseline is defined explicitly in the [`.browserslistrc`](https://github.com/browserslist/browserslist) file at the root of the repository. The same configuration drives Autoprefixer and the automated browser-support check, so what we build for is exactly what we declare.

| Browser | Minimum Version | Released |
|---|---|---|
| Chrome | 110 | 2023-02 |
| Edge | 110 | 2023-02 |
| Firefox | 115 | 2023-07 |
| Safari | 15.4 | 2022-03 |
| iOS Safari | 15.4 | 2022-03 |
| Samsung Internet | 17 | 2022 |

The `not dead` flag additionally excludes browsers that have not received security updates for over 24 months.

### A note on Internet Explorer

Versions 6.9 and earlier of the framework claimed support back to IE 9, but this was not verifiable in practice (the cross-browser test pipeline had been broken for years). From 6.10 onwards, **Internet Explorer is not supported**:

- The distributed CSS no longer contains the vendor prefixes IE 10 and legacy WebKit engines require. IE 11 can render most of the unprefixed CSS, but this is untested and not guaranteed.
- The distributed JavaScript is still transpiled to ES5 *syntax*, but no longer ships polyfills for engines missing `Date.now`, `requestAnimationFrame`, `Function.prototype.bind`, `matchMedia`, or unprefixed `MutationObserver`.

If you must support IE, use [foundation-sites 6.9.x](https://github.com/foundation/foundation-sites/releases/tag/v6.9.0) — it remains available, but is not maintained.

---

## What Won't Work?

- **Browsers below the baseline:** they are untested, and the distributed CSS no longer carries the vendor prefixes they need — IE 10 flexbox and pre-2013 WebKit/Android layouts will break.
- **Pre-2013 JavaScript engines:** the framework requires the standard APIs listed above natively.
- **Media queries:** because the framework is written mobile-first, browsers without media-query support display the mobile styles of the site.
