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

  // The docs chrome bundle: jQuery-dependent third-party pieces (the
  // foundation-docs package, clipboard). It loads AFTER docs.js, so the
  // framework itself boots and runs with NO jQuery on the page - the
  // strongest line-A end-to-end test - while the legacy chrome keeps
  // working until the docs chain replacement (M3 evaluation).
  // corejs-typeahead is dropped entirely: it needs jQuery at load time
  // ($.isArray in its type helpers); the nav search box dies with it.
  JS_DOCS_CHROME: [
    'node_modules/jquery/dist/jquery.js',
    // typeahead needs jQuery at load time - fine inside the chrome bundle,
    // which carries its own jQuery and loads after the jQuery-free
    // framework bootstrap
    'node_modules/corejs-typeahead/dist/typeahead.bundle.js',
    'node_modules/clipboard/dist/clipboard.js',
    'node_modules/foundation-docs/js/**/*.js',
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
