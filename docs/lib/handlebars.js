// Local port of foundation-docs' handlebars instance (7.0 docs-chain
// localization). requireDir is replaced by explicit requires — same shared
// handlebars module, same helper registrations.
var handlebars = require('handlebars');

require('./handlebars/formatting');
require('./handlebars/javascript');
require('./handlebars/links');
require('./handlebars/partials');
require('./handlebars/sass');
require('./handlebars/utils');

module.exports = handlebars;
