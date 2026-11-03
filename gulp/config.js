module.exports = {

  // Javascript
  JS_BUNDLE_NAMESPACE: '__FOUNDATION_EXTERNAL__',

  JS_FILES: [
    'js/foundation.core.js',
    'js/foundation.core.utils.js',
    'js/foundation.util.*.js',
    'js/*.js'
  ],

  JS_DEPS: [
    // 7.0 line A: jQuery is gone from the library and from the docs site
    // bundle - the pages below are the strongest end-to-end test (any
    // hidden dependency would throw immediately).
    // motion-ui's dist UMD (window.MotionUI) stays in vendor.js: the docs
    // layout and the visual-regression pages load vendor.js, and the docs
    // motion-ui page demos the standalone library next to Foundation's
    // inlined Foundation.Motion (7.0 line A, S14 evaluation - kept).
    'node_modules/motion-ui/dist/motion-ui.js',
    'node_modules/what-input/dist/what-input.js'
  ],

  // The docs chrome bundle (7.0 chrome re-skin, unit 3): 100% local and
  // jQuery-free. Every former foundation-docs chrome script is ported to
  // docs/assets/js/ (search/typeahead, copy button, TOC, kitchen sink,
  // topbar, video, ad slot, interchange map) — the package, jQuery,
  // corejs-typeahead and clipboard.js all drop out of the bundle. It loads
  // AFTER docs.js so nothing on the page needs jQuery at all anymore.
  JS_DOCS_CHROME: [
    'docs/assets/js/docs.*.js'
  ],

  // The framework bootstrap for the docs pages: jQuery-free.
  JS_DOCS_BOOT: [
    'docs/assets/js/docs.js'
  ],

  // Sass
  SASS_DEPS_FILES: [
  ],

  SASS_DOC_PATHS: [
    'scss',
    // motion-ui's src mixins stay on the docs compile path: docs.scss
    // `@import 'motion-ui'` + `@include motion-ui-transitions` (the docs
    // motion-ui and orbit pages consume the generated classes).
    // 7.0 chrome re-skin: the foundation-docs scss loadPath is gone — the
    // chrome is ported to docs/assets/scss/chrome/.
    'node_modules/motion-ui/src'
  ],

  SASS_LINT_FILES: [
    'scss/**/*.scss',
  ],

  // Assets
  ASSETS_FILES: [
    'docs/assets/**/*',
    '!docs/assets/{js,scss}',
    '!docs/assets/{js,scss}/**/*'
  ],

  // Dist
  VERSIONED_FILES: [
    'composer.json',
    'docs/pages/installation.md',
    'js/foundation.core.js',
    'package.json',
    'scss/foundation.scss',
    'scss/settings/_settings.scss'
  ],

  DIST_FILES: [
    './_build/assets/css/foundation.css',
    './_build/assets/css/foundation.css.map',
    './_build/assets/css/foundation-prototype.css',
    './_build/assets/css/foundation-prototype.css.map',
    './_build/assets/css/foundation-rtl.css',
    './_build/assets/css/foundation-rtl.css.map',
    '_build/assets/js/foundation.js',
    '_build/assets/js/foundation.js.map',
    'js/typescript/foundation.d.ts'
  ],

  // Tests
  TEST_JS_FILES: [
    'test/javascript/core/**/*.js',
    'test/javascript/util/**/*.js',
    'test/javascript/components/**/*.js'
  ]
};
