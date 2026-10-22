---
title: Sass
description: Foundation is written in Sass, which allows us to make the codebase customizable and flexible.
video: mYiyunVQdMY
---

<!-- <div class="callout training-callout">
  <p>Get trained up on Foundation's Sass with our online webinar training. Sass allows you to write dramatically more efficient code. We'll go over things like how to install and start compiling Sass, nesting mixins and functions, and writing fully semantic CSS using Foundation mixins for insanely maintainable code.</p>
  <a href="https://zurb.com/university/advanced-foundation-training" target="_blank">Reserve your spot →</a>
</div> -->

<div class="primary callout">
  <p>Not familiar with Sass? The [official tutorial](https://sass-lang.com/guide) on sass-lang.com is a great place to start.</p>
</div>

## Compatibility

<img src="assets/img/logos/sass-logo.svg" alt="Sass logo" class="float-right" style="width: 150px; height: 150px; margin-left: 1rem;">

**Foundation for Sites is compiled with [Dart Sass](https://sass-lang.com/dart-sass)**, the reference Sass implementation. Ruby Sass was discontinued in 2019, and node-sass/LibSass is deprecated — both should not be used for new projects. Foundation itself builds with [`sass-embedded`](https://www.npmjs.com/package/sass-embedded), and we recommend staying on the latest **1.x** release of `sass` or `sass-embedded`.

### Autoprefixer Required

We don't include vendor prefixes in our Sass files&mdash;instead, we let [Autoprefixer](https://github.com/postcss/autoprefixer) handle it for us. Our build process uses [gulp-postcss](https://github.com/postcss/gulp-postcss) with the PostCSS plugin, but there are [other versions](https://github.com/postcss/autoprefixer#usage) that work with Grunt, Rails, Brunch, and more.

To get the same browser support as Foundation itself, configure your browser targets through a `.browserslistrc` file &mdash; Autoprefixer, Babel and many other build tools read it automatically:

```
chrome >= 110
edge >= 110
firefox >= 115
safari >= 15.4
ios_saf >= 15.4
samsung >= 17
not dead
```

---

## Loading the Framework

If you're using the CLI to create a project, the Sass compilation process is already set up for you. If not, you can compile our Sass files yourself, or drop in a pre-built CSS file.

To get started, first install the framework files using favorite package manager like npm or yarn.

```bash
npm install foundation-sites --save
```

### Compiling Manually

Next, add the framework files as an import path. How you do this depends on your build process, but the path is the same regardless: `packages_folder/foundation-sites/scss`

Here's an example using grunt-contrib-sass:

```js
grunt.initConfig({
  sass: {
    dist: {
      options: {
        loadPath: ['node_modules/foundation-sites/scss']
      }
    }
  }
});
```

If you're using Compass, open your project's `config.rb` and add the import path there:

```ruby
add_import_path "node_modules/foundation-sites/scss"
```

Finally, load the framework as a module at the top of your primary Sass file and include its mixins through the module's namespace. Refer to [Adjusting CSS Output](#adjusting-css-output) below to learn how to control the CSS output of the framework.

```scss
@use 'foundation';

@include foundation.foundation-everything;
```

You're also going to want a settings file for your project, which will allow you to modify the default styles of Foundation. See [The Settings File](#the-settings-file) below for both configuration workflows.

<div class="callout">
The module path above is the forward-looking workflow this documentation now teaches. The legacy <code>@import</code> workflow (<code>@import 'settings'; @import 'foundation';</code>) keeps compiling unchanged and is documented in the <a href="#legacy-import-workflow">compatibility appendix</a> &mdash; Foundation 7 keeps both paths alive, but new projects should start with <code>@use</code>, and the Sass project itself will remove <code>@import</code> in Dart Sass 3.0.
</div>

### Using Compiled CSS

The Foundation for Sites npm package includes pre-compiled CSS files, in minified (compressed) and unminified flavors. If you're interested in editing the framework CSS directly, use the unminified file. For production, use the minified version.

```html
<link rel="stylesheet" href="node_modules/foundation-sites/dist/css/foundation-sites.css">

<link rel="stylesheet" href="node_modules/foundation-sites/dist/css/foundation-sites.min.css">
```

---

## Adjusting CSS Output

Foundation outputs many classes for its various components. These help developers get up and running quickly. However, when you move to production, you may wish to build your grid semantically, replace our pre-built classes with your own, or remove components entirely.

Each component has an **export mixin** which prints out the CSS for that component. If you're cool with having everything, you just need one line of code:

```scss
@use 'foundation';

@include foundation.foundation-everything;
```

Our [starter projects](starter-projects.html) include the full list of includes, making it easy to comment out the components you don't need. A full list is also included below.

```scss
@use 'foundation';

// Global styles
@include foundation.foundation-global-styles;
@include foundation.foundation-forms;
@include foundation.foundation-typography;

// Grids (choose one)
@include foundation.foundation-xy-grid-classes;
// @include foundation.foundation-grid;
// @include foundation.foundation-flex-grid;

// Generic components
@include foundation.foundation-button;
@include foundation.foundation-button-group;
@include foundation.foundation-close-button;
@include foundation.foundation-label;
@include foundation.foundation-progress-bar;
@include foundation.foundation-slider;
@include foundation.foundation-switch;
@include foundation.foundation-table;
// Basic components
@include foundation.foundation-badge;
@include foundation.foundation-breadcrumbs;
@include foundation.foundation-callout;
@include foundation.foundation-card;
@include foundation.foundation-dropdown;
@include foundation.foundation-pagination;
@include foundation.foundation-tooltip;

// Containers
@include foundation.foundation-accordion;
@include foundation.foundation-media-object;
@include foundation.foundation-orbit;
@include foundation.foundation-responsive-embed;
@include foundation.foundation-tabs;
@include foundation.foundation-thumbnail;
// Menu-based containers
@include foundation.foundation-menu;
@include foundation.foundation-menu-icon;
@include foundation.foundation-accordion-menu;
@include foundation.foundation-drilldown-menu;
@include foundation.foundation-dropdown-menu;

// Layout components
@include foundation.foundation-off-canvas;
@include foundation.foundation-reveal;
@include foundation.foundation-sticky;
@include foundation.foundation-title-bar;
@include foundation.foundation-top-bar;

// Helpers
@include foundation.foundation-float-classes;
// @include foundation.foundation-flex-classes;
@include foundation.foundation-visibility-classes;
// @include foundation.foundation-prototype-classes;
```

---

## The Settings File

Every Foundation component ships a set of variables that modify its core structural or visual styles. If there's something you can't customize with a variable, you can just write your own CSS to add it.

Foundation supports two configuration workflows:

- **The settings-module workflow** (`@use`): you keep only the variables you actually changed in a small settings *module*, and each component reads your values through Foundation's configuration pipeline. This is the workflow new projects should adopt.
- **The legacy settings-file workflow** (`@import`): you copy the full settings template, change values in place, and import it before Foundation. It keeps working unchanged &mdash; see the [compatibility appendix](#legacy-import-workflow).

<div class="callout warning">
  <p>Once you've set up a new project, your settings file can't be automatically updated when new versions change, add, or remove variables. Keep tabs on new <a href="https://github.com/foundation/foundation-sites/releases">Foundation releases</a> so you know when things change.</p>
</div>

### Settings-Module Workflow

**1. Turn your settings file into a settings module.** Keep only the variables you actually want to change &mdash; the library defaults are merged in for you, so an untouched copy of the settings template is no longer needed. Helper functions like `rem-calc()` still come from `util/util`:

```scss
// _my-settings.scss
@import 'util/util'; // keep while the module calls helpers like rem-calc()

$global-radius: 8px;
$foundation-palette: (
  "primary": #1240ab,
  "secondary": #767676,
  "success": #3adb76,
  "warning": #ffae00,
  "alert": #cc4b37,
);
$button-padding: 2rem 3rem;
```

A direct assignment of a palette-derived color such as `$primary-color` wins over the palette derivation. Colors you do not assign directly are derived from the effective `$foundation-palette`.

**2. Reflect the module and pass it to the components you want.** The component mixins of the `foundation-next` entry take your settings map:

```scss
// main.scss
@use "sass:meta";
@use "foundation-next" as fs;
@use "my-settings" as prefs;

@include fs.foundation-button(meta.module-variables("prefs"));
@include fs.foundation-table(meta.module-variables("prefs"));
```

Calling a mixin without arguments (plain `fs.foundation-button`) compiles the component with pure library defaults. Typo'd keys in your module (say `$gobal-radius`) are reported with a `@warn` so they don't fail silently.

<div class="callout">
The settings-module pipeline currently covers the <strong>button</strong> and <strong>table</strong> components and is being extended component by component. Configure every other component through the <a href="#legacy-import-workflow">legacy workflow</a> for now, and never mix both pipelines in one compilation &mdash; the component CSS would be emitted twice.
</div>

The pipeline has a few structural constraints worth knowing: each component can be included once per compilation (a module can be configured only once), the includes must sit at the top level of your stylesheet (they cannot be nested inside `@media` or other at-rules), and variables defined inside component partials &mdash; like `$button-radius`, which derives from `$global-radius` &mdash; are re-derived from your ambient settings automatically.

---

## Legacy Import Workflow

<div class="callout">
This is the classic Foundation workflow, fully supported in Foundation 6. It compiles on Dart Sass today, but the Sass project will remove <code>@import</code> in Dart Sass 3.0, so plan a move to the <a href="#settings-module-workflow">settings-module workflow</a>.
</div>

**[Download the latest settings file here](https://raw.githubusercontent.com/foundation/foundation-sites/master/scss/settings/_settings.scss)**, add it to your project as `_settings.scss`, then import it *before* Foundation itself. The settings file needs to import `util/util` from Foundation &mdash; ensure the Foundation folder is included in your Sass load paths, or point the import at the full path of the file (for example `node_modules/foundation-sites/scss/util/util` for npm users).

```scss
@import 'settings';
@import 'foundation';

@include foundation-everything;
```

With this workflow you edit the copied settings template in place. Here's an example set of settings variables from that template. These change the default styling of [buttons](button.html):

```scss
// Default padding for button.
$button-padding: 0.85em 1em !default;

// Default margin for button.
$button-margin: 0 $global-padding $global-padding 0 !default;

// Default fill for button. Is either solid or hollow.
$button-fill: solid !default;

// Default background color for button.
$button-background: $primary-color !default;

// Default hover background color for button.
$button-background-hover: scale-color($button-background, $lightness: -15%) !default;

// Default font color for button.
$button-font-color: #fff !default;

// Default alternative font color for button.
$button-font-color-alt: #000 !default;

// Default radius for button.
$button-radius: 0 !default;

// Default sizes for button.
$button-sizes: (
  tiny: 0.7,
  small: 0.8,
  medium: 1,
  large: 1.3,
) !default;

// Default font size for button.
$button-font-size: 0.9rem !default;

// Default opacity for a disabled button.
$button-opacity-disabled: 0.25 !default;
```
