// stylelint 16 config, replacing the unmaintained sass-lint (dead since
// 2018) for the 6.x line. Rules mirror the enforced subset of the old
// .sass-lint.yml. Notes:
// - Pure formatting rules (indentation, space-after-colon, trailing
//   semicolon, hex case, trailing zeros) were removed from stylelint core
//   in 16 and are intentionally not ported; the codebase formatting is
//   already consistent (Prettier is the 7.0 answer if wanted).
// - No direct equivalent exists for no-color-literals, no-url-protocols,
//   extends-before-declarations/mixins, clean-import-paths; skipped.
// - scss/vendor/** is third-party and ignored.
module.exports = {
  ignoreFiles: ['scss/vendor/**'],
  plugins: ['stylelint-scss'],
  rules: {
    'block-no-empty': true,
    'color-hex-length': 'short',
    'color-named': 'never',
    'color-no-invalid-hex': true,
    'declaration-block-no-duplicate-properties': true,
    'function-url-quotes': 'always',
    'length-zero-no-unit': true,
    'max-nesting-depth': [3, { 'ignoreAtRules': ['if', 'else', 'each', 'for', 'while', 'media', 'include', 'mixin', 'function'] }],
    'property-no-vendor-prefix': [
      true,
      {
        // Non-standard properties that have no unprefixed form
        'ignoreProperties': [
          '-webkit-text-size-adjust',
          '-moz-osx-font-smoothing',
          '-webkit-font-smoothing',
          '-webkit-tap-highlight-color'
        ]
      }
    ],
    'selector-max-id': 0,
    'selector-no-qualifying-type': [true, { 'ignore': ['attribute', 'class'] }],
    'shorthand-property-no-redundant-values': true,
    'value-no-vendor-prefix': true,
    'scss/at-extend-no-missing-placeholder': true,
    // hyphenatedlowercase with optional leading underscore/hyphen
    'scss/dollar-variable-pattern': '^[-_]?[a-z][a-z0-9-]*$',
    'scss/at-function-pattern': '^[-_]?[a-z][a-z0-9-]*$',
    'scss/at-mixin-pattern': '^[-_]?[a-z][a-z0-9-]*$',
    'scss/percent-placeholder-pattern': '^[-_]?[a-z][a-z0-9-]*$',
    'scss/property-no-unknown': true
  }
};
