---
title: Upgrading to 7.0
description: Migrate a Foundation 6 project to Foundation for Sites 7.0.
---

Foundation 7 is a compatibility-focused major: the data attributes and the `*.zf.*` events you already use keep working, and most projects migrate in an afternoon. This page is the complete list of what changes.

## JavaScript

### One script, one call

```html
<!-- 6.x -->
<script src="js/vendor/jquery.js"></script>
<script src="js/vendor/what-input.js"></script>
<script src="js/vendor/foundation.min.js"></script>
<script>$(document).foundation();</script>

<!-- 7.0 -->
<script src="js/vendor/what-input.js"></script>
<script src="js/vendor/foundation.min.js"></script>
<script>Foundation.init();</script>
```

`Foundation.init()` accepts an element, a selector string or a document (the default is the whole document):

```js
Foundation.init();                         // whole document
Foundation.init(document.getElementById('app'));  // a subtree (e.g. after AJAX)
```

### Calling plugin methods

The `$(element).foundation('method')` dispatch is gone. Resolve the instance instead:

```js
// 6.x
$('#reveal').foundation('open');

// 7.0
Foundation.Registry.getInstance(document.getElementById('reveal')).open();
```

### Event parameters are elements

Every `*.zf.*` event still fires, with the same names - but the extra parameters are now native elements:

```js
// 6.x: (event, $target) - a jQuery collection
$('#my-tabs').on('change.zf.tabs', function(e, $target) { $target.addClass('seen'); });

// 7.0: (event, target) - the element itself
document.getElementById('my-tabs').addEventListener('change.zf.tabs', function(e) {
  e.detail[0].classList.add('seen');
});
```

### Custom Abide validators

```js
// 6.x: (el, required, parent) - jQuery objects
// 7.0: (el, required, parent) - the DOM elements themselves
Foundation.Abide.defaults.validators['greater_than'] = function(el, required, parent) {
  var from = document.getElementById(el.getAttribute('data-greater-than')).value;
  return parseInt(el.value, 10) > parseInt(from, 10);
};
```

### destroy() keeps third-party listeners

`destroy()` removes exactly what the plugin bound. Listeners your own code attached to the element (or its children) now survive - clean them up yourself if you relied on 6.x removing everything.

### jQuery on the same page

You can still load jQuery for your own code. It no longer participates in Foundation's event flow: jQuery-synthesized events do not reach the plugins, and vice versa. Use real events (`element.dispatchEvent` / `addEventListener`).

## Grid

**The XY grid is the only grid.** If your markup uses the float grid (`.row` / `.columns`) or the legacy flex grid:

```html
<!-- 6.x float grid -->
<div class="row">
  <div class="small-12 large-6 columns">…</div>
</div>

<!-- 7.0 XY grid (the classes you most likely already use) -->
<div class="grid-x grid-padding-x">
  <div class="cell small-12 large-6">…</div>
</div>
```

- `.column` / `.columns` → `cell` (size classes keep their names: `small-6`, `large-expand` → `large-auto`).
- `foundation-everything($flex: false)` → `foundation-everything()` (there is no `$flex` parameter anymore).
- The `foundation-float` CSS variant is not shipped. The XY classes have been the default since 6.4.

## Sass

`@import 'foundation'` keeps working. The new module path is recommended for new code:

```scss
// settings module - only the variables you change
@import 'util/util';  // keep this if your settings call rem-calc() etc.

$primary-color: #1240ab;
$global-radius: 8px;
```

```scss
// entry
@use "sass:meta";
@use "foundation-next" as fs;
@use "my-settings" as prefs;

@include fs.foundation-button(meta.module-variables("prefs"));
@include fs.foundation-everything-else-you-use(...);
```

Notes:

- Assigning `$primary-color` (or any `*-color`) **before** the import now wins over the palette derivation. In 6.x the palette silently overwrote it unless you re-assigned after.
- `@extend`-derived selectors compile in source order now (a few selectors, e.g. reveal's centered variants, change position in the output).
- The `foundation-float`, `foundation-prototype` and `foundation-rtl` variants: **prototype and RTL are still shipped**; only the float variant is gone.

## Removed classes

| Removed | Replacement |
|---|---|
| `.flex-video` (+ widescreen aliases) | `.responsive-embed` (+ `.responsive-embed.widescreen`) - same CSS file, rename the class |
| `.show-for-ie` / `.hide-for-ie` | none - the 7.0 browser matrix has no IE |
| `.row` / `.columns` (float grid) | XY grid classes (above) |

## What does NOT change

- The data attributes: `data-open`, `data-close`, `data-toggle`, `data-closable`, `data-accordion`, `data-tabs`, …
- The event names: `init.zf.*`, `open.zf.*`, `closeme.zf.*`, `changed.zf.*`, …
- The `Foundation` global and `Foundation.<Plugin>` classes, programmatic construction with `new Foundation.Reveal(element, options)`.
- Breakpoint names and `Foundation.MediaQuery` semantics.
- The prototype utilities and the RTL CSS variant (both still shipped).
