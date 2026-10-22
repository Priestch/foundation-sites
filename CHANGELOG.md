# Changelog

Notable changes to Foundation for Sites are documented here.
For versions up to and including 6.9.0, see the [GitHub releases page](https://github.com/foundation/foundation-sites/releases).

## [Unreleased]

### Documentation

- **Deprecation notices for everything 7.0 removes** (docs callouts + SassDoc `@deprecated`): the float grid and `$global-flexbox: false`, the flex grid and `$global-flexbox: true`, the Prototyping Utilities, the standalone RTL build, the `.flex-video` class name, and the `.show-for-ie` / `.hide-for-ie` classes. The RTL page no longer references the discontinued customizer.
- The JavaScript documentation announces that **Foundation 7.0 removes jQuery** (vanilla rewrite; the data-attribute API and `*.zf.*` events remain the public contract).
- `CONTRIBUTING.md` rewritten for the current workflow: pull requests target `master`; the GitFlow branch families are retired.
- `js/typescript/foundation.d.ts` version header updated from 6.3.1 to 6.10.0.

### Behavior changes

- **Interchange** (`html` mode): plugins inside content fetched and injected by Interchange are now initialized on the nodes actually inserted into the DOM (`Foundation.reflow`), instead of on a detached copy of the response that was never attached. Content inserted in `html` mode gets working plugins now; no action is required unless you relied on the (broken) previous behavior.
- **Magellan**: initialization that waited on a raw `window.load` event now uses the framework's `onLoad` helper, so deep-link scrolling and active-state calculation also work when Magellan is initialized after the page has already loaded (e.g. injected via AJAX/reflow).

### Fixed

- `ResponsiveMenu`: destroying the menu did not remove its media-query listener, so a destroyed menu could spawn new plugins on breakpoint changes.
- `Reveal`: the overlay/body click handlers no longer share the `.zf.dropdown` namespace with Dropdown, so opening/closing one no longer removes the other's close-on-click behavior; repeated init no longer stacks overlay click handlers.
- `Reveal`: the global ESC key handler is now namespaced per modal instance, so closing one of several open modals (`multipleOpened`) no longer disables ESC for the others.
- `Sticky`: missing `return` in `_setSizes`/`_setBreakPoints` caused callbacks to run twice and breakpoints to be calculated when the element cannot stick.
- `Sticky`: entering the stuck state no longer stacks an additional `transitionend` listener on every change.
- `Equalizer`: the `changed.zf.mediaquery` window listener is now removed on destroy/pause when `equalizeOn` is used.
- `OffCanvas`: the `changed.zf.mediaquery` window listeners (reveal checker and `inCanvasOn`) are now removed on destroy.
- `AccordionMenu`: destroying the menu now also removes the `keydown` handlers, so key presses after destroy no longer throw.
- `Drilldown`: destroy no longer unwraps a wrapper the user provided themselves; only a wrapper created by the plugin is removed.
- `Orbit`: destroying the carousel now pauses the autoplay timer.
- `Magellan`: destroying no longer throws when `deepLinking` is enabled; dead code removed.
- SCSS: fixed misplaced parentheses in `zf-parse-fraction()` (`scss/util/_math.scss`) that made the numeric type checks always pass, affecting `grid-column()`/`xy-cell()` argument validation.

### Changed (build/tooling)

- **Explicit browser baseline** (`.browserslistrc`): Chrome/Edge >= 110 (2023-02), Firefox >= 115 (2023-07, covers all newer ESRs), Safari/iOS >= 15.4 (2022-03), Samsung Internet >= 17, `not dead`. The previous implicit line went down to IE 10 (2012). CSS output changes (dropped IE/legacy prefixes) land with the next dist rebuild; the JS dist stays ES5.
- **JS transpilation targets pinned to ES5** (`.babelrc`, `rollup.config.js`, webpack `target: ['web', 'es5']`): Babel preset-env and webpack 5 both read `.browserslistrc` by default, so the new CSS baseline would have silently relaxed the JS dist to modern syntax. JS output is now decoupled from the CSS baseline; the JS dist stays ES5 (verified by parsing the bundles with acorn in ES5 mode).
- `gulp check:browserSupport` (doiuse) now **fails** when the compiled CSS uses a feature not supported by the baseline, with a documented allow-list for gracefully-degrading/print-only features; the check runs in CI after the test suite.
- Removed inert `-webkit-overflow-scrolling: touch` declarations and the IE7-only `-ms-interpolation-mode` declaration from the CSS.
- Removed dead JavaScript polyfills for pre-2013 engines: `Date.now`, `requestAnimationFrame` vendor prefixes + iOS 6 fallback, `performance.now`, `Function.prototype.bind`, the 2012 `matchMedia` shim, `MutationObserver` vendor prefixes + IE9 listener fallbacks, and the legacy `document.createEvent` mouse-event path. Supported browsers have all of these natively; the JS dist stays ES5 and just gets smaller.
- `jquery` peer dependency tightened to `>=3.6.0 <4` — jQuery 4 is not supported in the 6.x line (7.0 removes jQuery entirely).
- `motion-ui` peer dependency changed from the invalid `latest` to `^2.0.5`.
- Node.js minimum raised to 20 (package `engines`, CI matrix tests Node 22 and 24).
- `sass-embedded` pinned to `~1.97.0` with `@import`/global-builtin deprecation warnings silenced (the 6.x line keeps `@import`; the `@use` migration happens in 7.0).
- `jsdoc` forced to `^4.0.5` via `resolutions`: jsdoc 3 used `util.isRegExp`, removed in Node 23+, which crashed the docs build on Node 24.
- Removed dead distribution channels and test infrastructure: BrowserStack runner, Bower, Sache, Meteor, NuGet manifests and patches.
- CI: GitHub Actions bumped to v4, Node 22/24 matrix, yarn caching; BrowserStack job removed.
