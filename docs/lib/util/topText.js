var Cheerio = require('cheerio');

/**
 * Return the top-level text in the given string without the nested HTML.
 *
 * ```js
 * topText('hello world')         // -> "hello world"
 * topText('hello <b>world</b>')  // -> "hello world"
 * ```
 */
module.exports = function (param) {
  var $el;

  if (typeof param === 'string')
    $el = Cheerio.load(param)('body');
  else if (typeof param === 'object')
    $el = $el.clone();
  else
    throw new Error('expected a string or a jQuery object, got "' + param + '" (' + typeof param + ')');

  // https://stackoverflow.com/a/33592275
  var $topLevelEl = $el.children().remove().end();
  var text = $topLevelEl.text();

  return text;
}
