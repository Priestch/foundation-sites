---
title: Theming
description: Switch the whole look of Foundation with one settings module — the built-in themes and how to build your own.
sass:
  - scss/themes/_classic.scss
  - scss/themes/_modern.scss
  - scss/themes/_tdesign.scss
  - scss/themes/_semi.scss
---

## Themes

A theme is a **settings module**: a plain Sass file that assigns values to the global tokens Foundation's components actually read — the palette, the grays, the font stack, the weights, the radius and shadow tiers, the focus ring. No mixin calls, no framework code: the entire look of the framework travels through data.

Foundation 7.0 ships four themes:

| Theme | Look | Palette | Radii | Focus ring |
| --- | --- | --- | --- | --- |
| **modern** <span class="label">Default</span> | The 7.0 look: deep steady blue, TDesign/Semi-grade neutrals, tiered radii and elevation | `#1668dc` primary | 3px / 6px | on — follows the primary |
| **classic** | The exact 6.x look, for projects that want the familiar face back | `#1779ba` primary | flat | off (legacy indicators) |
| **tdesign** | Practice theme carrying TDesign's light tokens | `#0052d9` primary | 3px / 6px | on — brand ring |
| **semi** | Practice theme carrying Semi Design's light tokens | `#0064fa` primary, `#0095ee` secondary | 3px / 6px | on — brand ring |

The two practice themes are proofs of the token surface: every value is lifted from the respective design system's published tokens (the provenance notes in each module name the source file), and mapping decisions — TDesign's missing brand-secondary, Semi's single elevation shadow, their different error-scale steps — are documented inline.

## Using a Theme

Themes ride the 7.0 configuration pipeline (`foundation-next`). Reflect the theme module's variables with `meta.module-variables()` and pass them as the entry's configuration — then every component mixin you include is themed:

```scss
@use "sass:meta";
@use "foundation/themes/classic" as theme;
@use "foundation/foundation-next" as fs with (
  $fs-user: meta.module-variables("theme")
);

// include what you use — the theme flows through all of them
@include fs.foundation-button();
@include fs.foundation-card();
@include fs.foundation-tabs();
// ...
```

<div class="warning callout">
  <p>The <code>foundation-next</code> pipeline covers the component slices modularized so far; forms, typography and the global base styles are still on the classic <code>@import</code> path. For those, carry the theme's values into your settings file as plain assignments — the theme modules are nothing but assignments, so they work as a copy source either way.</p>
</div>

## The Token Surface

These are the cells a theme owns. All of them are optional; unset cells keep the default.

**Palette and neutrals**

- `$foundation-palette` — the five semantic slots: `primary`, `secondary`, `success`, `warning`, `alert`. Components derive hover and active tones from these.
- `$light-gray` / `$medium-gray` / `$dark-gray` — the three workhorse grays (page fills, borders, muted text).
- `$black` / `$white` — body text and surface.

**Type**

- `$body-font-family` — the stack (the modern default is CJK-aware; classic keeps the Helvetica lineage).
- `$global-weight-normal` / `$global-weight-bold` — numeric weights in modern (400/600), keywords in classic.

**Shape and elevation**

- `$global-radius-small` — control class: buttons, labels, inputs, switches.
- `$global-radius-large` — container class: cards, callouts, menus, tooltips.
- `$global-shadow-sm` / `$global-shadow-md` — the two-step elevation ladder.

**Focus**

- `$global-focus-ring` — a box-shadow value. The default derives from the palette (`0 0 0 2px $primary-color`), so a custom primary re-rings everything automatically. Form controls swap their legacy glow for it on `:focus`; buttons, links, tabs, accordion titles, close buttons, switches, sliders, thumbnails and orbit controls show it on `:focus-visible`. Set it to `false` — as classic does — to keep the legacy per-component focus indicators.

<div class="primary callout">
  <p>The off value is <code>false</code>, not <code>null</code>: a <code>null</code> assignment cannot travel through Sass module configuration (it counts as "unset" and the library default applies).</p>
</div>

## Building Your Own Theme

Copy the theme closest to your target look and edit the values — the module is nothing but assignments:

```scss
// my-theme.scss — assign the cells you care about
$foundation-palette: (
  "primary": #7c3aed,
  "secondary": #5c6770,
  "success": #2ba471,
  "warning": #e37318,
  "alert": #cc4b37,
);
$light-gray: #f2f3f5;
$medium-gray: #dcdfe3;
$dark-gray: #7a8499;
$global-radius-small: 4px;
$global-radius-large: 8px;
$global-focus-ring: 0 0 0 2px #7c3aed;
```

Then use it exactly like a built-in theme:

```scss
@use "sass:meta";
@use "my-theme" as theme;
@use "foundation/foundation-next" as fs with (
  $fs-user: meta.module-variables("theme")
);

@include fs.foundation-button();
```

Every component-level cell (`$button-background`, `$input-border`, …) still exists and still overrides on top of the theme — a theme sets the ambients, not the last word.
