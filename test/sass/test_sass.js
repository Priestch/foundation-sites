var path = require('path');
var sassTrue = require('sass-true');
var sass = require('sass-embedded');

// Test Files
var breakpointFile = path.join(__dirname, '_breakpoint.scss');
var colorFile = path.join(__dirname, '_color.scss');
var mathFile = path.join(__dirname, '_math.scss');
var selectorFile = path.join(__dirname, '_selector.scss');
var unitFile = path.join(__dirname, '_unit.scss');
var valueFile = path.join(__dirname, '_value.scss');
var componentsFile = path.join(__dirname, '_components.scss');
var settingsOverrideFile = path.join(__dirname, '_settings_override.scss');
var settingsModuleFile = path.join(__dirname, '_settings_module.scss');
var utilFacadeFile = path.join(__dirname, '_util_facade.scss');
var formsFacadeFile = path.join(__dirname, '_forms_facade.scss');
var typographyFacadeFile = path.join(__dirname, '_typography_facade.scss');

// Load path for suites that reach the settings module through the 7.0 pipeline
// (scss/settings/_settings.scss resolves its own `@import 'util/util'` against
// the scss/ directory, not against test/sass/).
var scssDir = path.join(__dirname, '../../scss');

// Run Tests
sassTrue.runSass({describe, it, sass }, breakpointFile);
sassTrue.runSass({describe, it, sass }, colorFile);
sassTrue.runSass({describe, it, sass }, mathFile);
sassTrue.runSass({describe, it, sass }, selectorFile);
sassTrue.runSass({describe, it, sass }, unitFile);
sassTrue.runSass({describe, it, sass }, valueFile);
sassTrue.runSass({describe, it, sass }, componentsFile);
sassTrue.runSass({describe, it, sass }, settingsOverrideFile);
sassTrue.runSass({describe, it, sass }, settingsModuleFile, { loadPaths: [scssDir] });
sassTrue.runSass({describe, it, sass }, utilFacadeFile);
sassTrue.runSass({describe, it, sass }, formsFacadeFile);
sassTrue.runSass({describe, it, sass }, typographyFacadeFile);