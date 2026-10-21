var gulp = require('gulp');
var eslint = require('gulp-eslint');
var stylelint = require('stylelint');
var CONFIG = require('../config.js');

// Lints Sass and JavaScript files for formatting issues
gulp.task('lint', gulp.series('lint:sass', 'lint:javascript'));

// Lints Sass and Javascript without throwing error
gulp.task('lint:graceful', gulp.series('lint:graceful:sass', 'lint:graceful:javascript'));

function lintSass(failOnError) {
  return function () {
    var result = stylelint.lint({
      files: CONFIG.SASS_LINT_FILES,
      formatter: 'string',
      customSyntax: 'postcss-scss'
    });

    if (failOnError) {
      return result.then(function (res) {
        if (res.errored) {
          console.log(res.output);
          throw new Error('Sass lint failures');
        }
      });
    }

    return result.then(function (res) {
      if (res.output) { console.log(res.output); }
    });
  };
}

function lintJavascript() {
  return gulp.src(CONFIG.JS_FILES)
    .pipe(eslint({
      useEslintrc: true,
      configFile: '.eslintrc'
    }))
    .pipe(eslint.format());
}

gulp.task('lint:sass', lintSass(true));
gulp.task('lint:javascript', function () {
  return lintJavascript()
  .pipe(eslint.failAfterError());
});

gulp.task('lint:graceful:sass', lintSass(false));
gulp.task('lint:graceful:javascript', lintJavascript);
