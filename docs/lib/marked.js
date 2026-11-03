// Local port of foundation-docs' marked renderer (7.0 docs-chain
// localization). Differences from the package copy, none of which change
// output for this repo: the inky_example branch is gone (an
// foundation-emails-only fence, never used by sites pages), and the
// multiline/string-template helpers are replaced by a plain template string
// and the local format() port.
var format  = require('./format');
var hljs    = require('highlight.js');
var heading = require('./util/writeHeading');
var marked  = require('marked');

var mdRenderer = new marked.Renderer();

// The package built this via multiline(...) + a whitespace/newline strip;
// this is the exact resulting string.
var HTML_EXAMPLE_TEMPLATE = '<div class="docs-code" data-docs-code><pre><code class="{0}">{1}</code></pre></div>';

// Adds an anchor link to each heading created
mdRenderer.heading = heading;

// Adds special formatting to each code block created.
// If the language is suffixed with "_example", the raw HTML is printed after
// the code sample, creating a live example.
mdRenderer.code = function(code, language) {
  var extraOutput = '';

  if (typeof language === 'undefined') language = 'html';

  // If the language is *_example, live code will print out along with the sample
  if (language === 'html_example') {
    extraOutput = format('\n\n<div class="docs-code-live">{0}</div>', [code]);
    language = language.replace(/_example$/, '');
  }

  language = hljs.getLanguage(language) ? language : 'html';

  var renderedCode = hljs.highlight(language, code).value;
  var output = format(HTML_EXAMPLE_TEMPLATE, [language, renderedCode]);

  return output + extraOutput;
}

module.exports = mdRenderer;
