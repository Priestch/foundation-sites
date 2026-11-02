# Changelog

Notable changes to Foundation for Sites are documented here.
For versions up to and including 6.9.0, see the [GitHub releases page](https://github.com/foundation/foundation-sites/releases).

## [7.0.0-beta.1]

The seventh major: **jQuery is gone**, the Sass core is a **module system**, and there is **one grid**.

### Breaking

- **jQuery removed.** The plugins are vanilla JavaScript. `$(document).foundation()` becomes `Foundation.init(root?)` (element, document or selector; document by default). Instance access replaces the `$(el).foundation('method')` dispatch: `Foundation.Registry.getInstance(el).method()`. The data-attribute API (`data-open` / `data-close` / `data-toggle` / `data-closable` / …) and the `*.zf.*` event names are unchanged.
- **Event parameters are elements.** Every `*.zf.*` event's extra parameters are now native elements (they were jQuery collections). The element-local `zf.trigger` dispatches are real non-bubbling CustomEvents - jQuery-synthesized events no longer cross into the library, and vice versa.
- **destroy() only removes what it bound.** Listeners a third party attached to a plugin element now survive `destroy()` (the 6.x scorched-earth worked only because jQuery shared one event table).
- **One grid: the XY grid.** The float grid and the legacy flex grid are gone - `.row`/`.columns`, `foundation-grid`, `foundation-flex-grid`, the `foundation-float` CSS variant and `foundation-everything`'s `$flex` parameter. Migrate to `grid-container` / `grid-x` / `cell` (in use since 6.4). The flex utility classes are emitted unconditionally now.
- **Custom validators receive elements.** Abide validator callbacks get the field element, the required flag and the parent **element** (not jQuery objects).
- **Removed with the IE support matrix:** the IE9 PNG fallback inside `background-triangle()`, the `.show-for-ie` / `.hide-for-ie` classes, and the `.flex-video` alias (rename the class to `.responsive-embed` - same CSS file, same technique).
- **ES5 output dropped.** The JS dist targets the modern baseline (Chrome/Edge >= 110, Firefox >= 115 ESR, Safari/iOS >= 15.4) - the same `.browserslistrc` now governs both CSS and JS. The minified bundle shrinks ~21%.
- **Sass: `@use` is the module system.** `foundation.scss` is a `@forward` module; per-component imports resolve their own dependencies. Assigning `$primary-color` (or any palette-derived color) *before* the import now wins over the palette derivation - the 6.x second-guess is gone. `@extend`-generated selectors compile in source order (the import world emitted some reversed). `@import` keeps working through the transition; see the upgrade guide.

### Added

- **Per-component configuration**: `@use "foundation-next" as fs` + `@include fs.foundation-<component>(meta.module-variables("my-settings"))` loads exactly the components you want with only the settings you changed (unknown keys warn at compile time). All 34 components are covered.
- `Foundation.init(root?)`, `Foundation.Registry` public instance lookup, `Foundation.Triggers` / `Foundation.Motion` / `Foundation.Touch` exposed on the global.

### Changed

- The Triggers delegation arms at `DOMContentLoaded` instead of `window load`, and Magellan tracks navigation injected by later scripts - a stalled third-party iframe no longer freezes `data-open`/`data-close`/`data-toggle` until it gives up.
- Animations run on a native Motion engine (per-element queues, jQuery-compatible easing); SmoothScroll/Reveal completion callbacks fire once (twice in 6.x).
- `closeme` broadcasts are real bubbling events.
- Dev chain: sass-embedded 1.107, the sassy-lists dependency is gone (native list helpers), `if()` migrated to the modern CSS conditional syntax. Sass compiles ~2.7x faster than the 6.x `@import` world.

### Fixed

- `onLoad(window, …)` with iframes on the page no longer resolves the target to the first frame's window (the cross-origin SecurityError family).
- One click on a `[data-toggle]` control dispatches exactly once (module-copy deduplication - the 8x toggle storm).
- Sliders without a `[data-slider-fill]` element initialize again (6.x empty-collection semantics).
- Abide custom validators (`data-validator`) work - `matchValidation` referenced an undefined variable and crashed.
- Plus the 6.10 maintenance batch: Reveal/Dropdown close-handler cross-removal, ESC in multi-modal setups, Sticky double-callbacks, OffCanvas/AccordionMenu/Equalizer/ResponsiveMenu listener leaks, Drilldown wrapper handling (see the entries below).


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
