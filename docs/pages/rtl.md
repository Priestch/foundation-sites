---
title: Right-to-Left Support
description: Foundation can easily adapt its components to work with languages that read from right to left.
video: 'TPz2Uzr4urE'
---

## HTML

You'll need to make a few changes to your markup to get the Javascript components working nice and smooth. In the `<html>` tag, you'll need to add a `dir` attribute with a value of `rtl`. Here's what your `<html>` tag should look like:

```html
<!-- This example is for a right-to-left Arabic layout -->
<html class="no-js" lang="ar" dir="rtl">
```

### Language Code

You'll need to change your lang attribute value to match your language. Here's a handy list of common right-to-left languages and their html codes.

- **Arabic:** `ar`
- **Farsi:** `fa`
- **Hebrew:** `he`, `iw`
- **Urdu:** `ur`
- **Yiddish:** `yi`, `ji`

View of a [full list of language codes](https://www.loc.gov/standards/iso639-2/php/code_list.php) on the website of the Library of Congress.

---

## CSS Download

The pre-built `foundation-rtl.css` shipped in the package contains the full framework compiled with `$global-text-direction: rtl`. If you need a different combination of components, build it from Sass instead (see below) &mdash; the online customizer referenced by older versions of this documentation has been discontinued.

<div class="callout alert">
  <p><strong>Looking ahead to 7.0:</strong> the standalone RTL build will be removed in Foundation 7.0, which rewrites the framework to use CSS <em>logical properties</em> so a single stylesheet serves both text directions. Plan your migration accordingly.</p>
</div>

---

## Sass Configuration

If you're using the Sass version of Foundation, open your project's [settings file](sass.html#the-settings-file) (`settings.scss`) and change this variable in the Global section:

```scss
$global-text-direction: rtl;
```

This will convert the framework's components to RTL format.
