# Changelog

Notable changes to Foundation for Sites are documented here.
For versions up to and including 6.9.0, see the [GitHub releases page](https://github.com/foundation/foundation-sites/releases).

## [Unreleased]

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

- `jquery` peer dependency tightened to `>=3.6.0 <4` — jQuery 4 is not supported in the 6.x line (7.0 removes jQuery entirely).
- `motion-ui` peer dependency changed from the invalid `latest` to `^2.0.5`.
- Node.js minimum raised to 20 (package `engines`, CI matrix tests Node 22 and 24).
- `sass-embedded` pinned to `~1.97.0` with `@import`/global-builtin deprecation warnings silenced (the 6.x line keeps `@import`; the `@use` migration happens in 7.0).
- `jsdoc` forced to `^4.0.5` via `resolutions`: jsdoc 3 used `util.isRegExp`, removed in Node 23+, which crashed the docs build on Node 24.
- Removed dead distribution channels and test infrastructure: BrowserStack runner, Bower, Sache, Meteor, NuGet manifests and patches.
- CI: GitHub Actions bumped to v4, Node 22/24 matrix, yarn caching; BrowserStack job removed.
