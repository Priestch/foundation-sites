'use strict';

var gulp = require('gulp');
var checkDeps = require('gulp-check-deps');
var postcss = require('gulp-postcss');
var doiuse = require('doiuse');
var CONFIG = require('../config.js');

gulp.task('check', gulp.series('check:deps', 'check:browserSupport'));

// Check npm dependencies
gulp.task('check:deps', function() {
  return gulp.src('package.json').pipe(checkDeps());
});

// Check browser support
// Scans the compiled CSS against the ".browserslistrc" baseline and fails
// when a feature is used that is not supported by every target browser.
gulp.task('check:browserSupport', function() {
  var unsupportedCount = 0;
  // Features that degrade gracefully, are print/touch-specific, or trigger
  // known doiuse false positives. Revisit when the baseline is raised in 7.0.
  var KNOWN_SAFE = [
    'css-overflow',        // flags plain overflow:visible/hidden because Safari 15.4-15.6 is "partial" for the new spec (overflow:clip)
    'css3-cursors',        // meaningless on touch-only devices (iOS), harmless elsewhere
    'css3-cursors-grab',
    'text-decoration',     // shorthand degrades to a plain underline
    'css-page-break',      // print-only
    'css-paged-media',     // print-only
    'css-widows-orphans',  // print-only
    'css-touch-action',    // degrades to default touch behavior
    'css-color-adjust'     // print color adjust, degrades without it
  ];
  return gulp.src(['_build/assets/css/foundation.css'])
    .pipe(postcss([doiuse({
      ignore: KNOWN_SAFE,
      onFeatureUsage: function (usageInfo) {
        unsupportedCount++;
        console.log(usageInfo.message)
      }
    })]))
    .on('end', function () {
      if (unsupportedCount > 0) {
        console.log(unsupportedCount + ' CSS feature(s) unsupported by the browserslist baseline');
        process.exitCode = 1;
      }
    });
});
