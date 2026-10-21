---
title: Flexbox Mode
description: Some of Foundation's key components can be converted to flexbox, supported across the entire browser baseline.
video: 'KxafSdyTCIg'
sass:
  - scss/components/_flex.scss
  - scss/util/_flex.scss
---

## Flexbox Mode

Foundation components use a combination of floats, vertical alignment, table cells, and various other CSS hacks to get layouts looking right. These days though, there's a better way.

Enabling **flexbox mode** replaces those hacks with flexbox properties, streamlining how layouts are made, and making sizing and alignment of elements much easier.

Flexbox mode uses standard, unprefixed flexbox properties and works in every browser of the framework's [support baseline](compatibility.html) &mdash; Chrome/Edge 110+, Firefox 115+, Safari/iOS 15.4+, Samsung Internet 17+. The legacy prefixed flexbox output for IE 10 and old WebKit engines was removed in version 6.10.

---

## Enabling Flexbox Mode

Using the Sass version of Foundation, you can enable flexbox mode two ways:

If you use the `foundation-everything()` mixin in your main Sass file, pass in the parameter `true` to enable flexbox mode.

```scss
@include foundation-everything(true);
```

If you included each component manually (like our starter projects do), open your settings file (basic template: scss/_settings.scss, ZURB template: src/assets/scss/_settings.scss) and set `$global-flexbox` to `true`, and remove the `@include` for the float grid and replace it with the one for the flex grid, along with the helper classes (basic template: scss/app.scss, ZURB template: src/assets/scss/app.scss):

```scss
$global-flexbox: true;

// @include foundation-grid;
@include foundation-flex-grid;
@include foundation-flex-classes;
```

---

## Supported Components

Besides the flex grid, these components have flexbox modes:

- [Button group](button-group.html)
- [Input group - (Forms)](forms.html#inline-labels-and-buttons)
- [Menu](menu.html)
- [Top bar](top-bar.html)
- [Media object](media-object.html)
- [Title bar](off-canvas.html#combining-with-title-bar)
- [Card](card.html)

In general, all of the components work exactly the same. However, a few of them require slight changes to CSS classes used to work properly. Refer to the documentation for each to find out what's different.
