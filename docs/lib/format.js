// Local port of string-template@0.2.1 (the version the docs pipeline
// resolved). Semantics kept byte-for-byte: positional or object args,
// `{{name}}` escaping, null/undefined → empty string.
var nargs = /\{([0-9a-zA-Z]+)\}/g;

module.exports = template;

function template(string) {
  var args;

  if (arguments.length === 2 && typeof arguments[1] === 'object') {
    args = arguments[1];
  } else {
    args = Array.prototype.slice.call(arguments, 1);
  }

  if (!args || !args.hasOwnProperty) {
    args = {};
  }

  return string.replace(nargs, function replaceArg(match, i, index) {
    if (string[index - 1] === '{' && string[index + match.length] === '}') {
      return i;
    }

    var result = args.hasOwnProperty(i) ? args[i] : null;
    if (result === null || result === undefined) {
      return '';
    }

    return result;
  });
}
