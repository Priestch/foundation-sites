# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Foundation for Sites (v6) — a responsive front-end framework published as the `foundation-sites` npm package. It is a library of SCSS components and jQuery-based JS plugins, plus a documentation site built from `docs/`. Node >= 18; use **yarn** (there is a `yarn.lock`).

## Maintenance strategy (since 2026-10)

The `develop` branch rewrite ("Yeti") has been **abandoned**. Current plan: ship a maintenance-only 6.x release (6.10.0) based on `master`, then prepare the 7.0 major. Full audit reports live in `audit/` — read `audit/summary.md` and `audit/v7-readiness.md` before starting work.

- **6.x rule: zero public API changes** — every mixin/variable/class name, the `Foundation` global, plugin names, data attributes, event names (`*.zf.*`), and dist artifact shapes stay as-is. Anything slated for removal (float grid, prototype utilities, RTL build, `.flex-video`, `.show-for-ie`, jQuery itself) gets *documentation-level deprecation only* in 6.x; code deletion waits for 7.0 ("deprecate in 6.10, remove in 7.0").
- Decisions already made:
  - **No jQuery 4 compat work.** Tighten peerDependencies to `">=3.6.0 <4"` instead. 7.0 removes jQuery entirely but keeps the data-attribute API and `*.zf.*` event names as the public contract.
  - **Build chain stays on gulp.** No Vite/esbuild migration; 7.0 build work happens inside gulp (at most an in-place gulp 4→5 evaluation).
  - **Browser baseline:** 6.x tightens `.browserslistrc` to an explicit line (Chrome/Edge ≥100–110, Firefox ≥115 ESR, Safari/iOS ≥15.4, `not dead`) — CSS side only, JS dist stays ES5. 7.0 raises it and drops ES5.
  - **Node:** 6.x engines `>=20`, CI tests 22/24.
- 7.0 direction: remove jQuery, Sass `@use` modularization (116 `@import`s → `@use`/`@forward`), consolidate grid to xy-grid only, modernize dependencies.

## Commands

```bash
yarn                     # install
yarn patch-package       # apply patches/ — also needed after install (CI does this)

yarn start               # build docs + framework, serve on localhost:3000 (SERVER_PORT), watch
yarn build               # gulp build → _build/

# Tests (three kinds: Sass, JavaScript, visual)
yarn test                # everything: build + sass + JS units + bundle tests
yarn test:sass           # Sass unit tests (mocha + sass-true)
yarn test:javascript:units   # JS unit tests in headless Chrome
yarn test:bundle         # verify dist bundles load
yarn test:visual         # visual regression pages via browser-sync
npx mocha test/sass/test_sass.js --grep "pattern"   # single Sass test suite

gulp lint                # sass-lint + eslint (fails on error)
```

Notes on the JS test setup:
- Tests live in `test/javascript/{core,util,components}/` and run in a real browser (mocha-headless-chrome). There is no per-file mocha runner: gulp concatenates the suites into `test/javascript/js-tests.js` (gitignored), which `test/javascript/index.html` loads. So `yarn test:javascript:units` always runs all suites; it needs `_build/` assets to exist first (`yarn build` or run `test:javascript:transpile`).
- Use `yarn test:javascript:units:single-process` / `test:single-process` if Chrome sandboxing fails in the environment.

## Git workflow & conventions

- **PRs target `master`** (since 2026-10: the old GitFlow `develop`/`develop-v*` workflow is retired; maintenance happens directly on `master`. `CONTRIBUTING.md`'s Git Workflow section still describes the old flow and needs rewriting).
- Commit messages follow the Angular convention, enforced by commitlint + husky: prefix with `feat|fix|docs|refactor|style|tests|chore`, imperative form, reference the issue: `fix: prevent Dropdown closing on scroll #12345`.
- Branch naming: `type/description-issue`, e.g. `fix/dropdown-close-on-scroll-12345`.
- JS style: **no semicolons** (`semi: never` in `.eslintrc`), ES6 modules transpiled with Babel, browserslist `last 2 versions, > 1%`.

## Architecture

### JS plugin system (`js/`)

- `js/foundation.core.js` — the global `Foundation` object: plugin registry (`Foundation.plugin(Constructor, name)`), `registerPlugin`, reflow/init. Core is split into `foundation.core.plugin.js` (base `Plugin` class all components extend) and `foundation.core.utils.js` (shared helpers).
- One file per component: `js/foundation.<name>.js` exporting a class extending `Plugin`. Shared behavior lives in `js/foundation.util.*.js` (keyboard, mediaQuery, motion, touch, triggers, box, nest, timer).
- Plugins are wired to markup through data attributes: registration stores the class under `Foundation.<Name>` and a hyphenated attr (`data-reveal`), instances get `data-<plugin>` + `zfPlugin` jQuery data, and fire namespaced events (`init.zf.<plugin>`, `closed.zf.<plugin>`, …).
- **Adding a plugin requires touching several files**: the component file, the export list in `js/foundation.js`, a per-plugin entry `js/entries/plugins/foundation.<name>.js`, and matching SCSS/docs/tests.
- Entries exist in two flavors: `js/entries/foundation.js` (everything, `Foundation` auto-init) and `js/entries/plugins/*.js` (one UMD drop-in file per plugin; externals mapping in `gulp/tasks/javascript.js` wires inter-plugin deps to the `__FOUNDATION_EXTERNAL__` namespace).

### Build pipeline (`gulp/`)

- gulp tasks in `gulp/tasks/`, shared config in `gulp/config.js`. Task names use `v3-style` forward references (`undertaker-forward-reference`).
- JS: webpack → UMD bundles in `_build/assets/js/`; rollup (`rollup.config.js`) → `dist/js/foundation.{cjs,esm,es6}.js`.
- SCSS: `assets/foundation*.scss` are the entry points for the four dist CSS variants — default (flexbox), `-float`, `-prototype`, `-rtl` — each just `@import` + `@include foundation-everything` with different flags. `sass:deps` copies `sassy-lists` into `_vendor/`.
- `dist/` **is tracked in git**; regenerated at release time via `gulp deploy:prep` / `deploy`.
- Version bumps touch all files listed in `VERSIONED_FILES` in `gulp/config.js` (package.json, bower.json, composer.json, `js/foundation.core.js`, `scss/foundation.scss`, …) — they must stay in sync.

### SCSS structure (`scss/`)

- `scss/foundation.scss` is the master import list; components are partials under `scss/components/`, `scss/forms/`, `scss/typography/`, plus two grid implementations (`scss/grid/` float grid, `scss/xy-grid/` flexbox grid) and utilities in `scss/util/`.
- Components ship **mixins** (e.g. `@include foundation-button`), not raw CSS; all knobs live in `scss/settings/_settings.scss` (~22K of variables). Follow this pattern for new components.

### Docs site (`docs/`)

- Panini (Handlebars) + supercollider process `docs/pages/*.md` (front-matter + content) using templates/helpers from the external `foundation-docs` package. Component docs pages also feed the docs search index.

### Tests

- Sass tests: `test/sass/*.scss` using sass-true's `@include describe/it`, registered in `test/sass/test_sass.js`.
- JS tests: mocha + chai (`chai.should()` style) + chai-jquery + sinon; `test/javascript/lib/` holds shared helpers (e.g. keyboard event mocks).
- Visual regression fixtures per component: `test/visual/<component>/`.

### Other

- `patches/` — patch-package patches (applied post-install; e.g. browserstack-runner).
- `customizer/` — build config for the online customizer.
