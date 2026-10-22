/**
 * Thin DOM helpers for the jQuery-free plugin layer (7.0 line A, slice S1).
 * Dependency-free replacements for the jQuery conveniences the plugin layer
 * leans on, with the 7.0 semantics decisions recorded inline.
 */

/**
 * Returns the first element matching `sel` inside `ctx` (the document by
 * default), like `$(sel, ctx)[0]`.
 * @param {String} sel - CSS selector.
 * @param {Element|Document} [ctx] - context to search within.
 * @returns {?Element} the first match, or null when there is none.
 */
function q(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

/**
 * Visibility check, narrow semantics: an element counts as visible when
 * neither it nor any ancestor is `display: none`.
 *
 * Deliberately NOT jQuery's `:visible` (the wide semantics), which also treats
 * zero-width/zero-height boxes and detached elements as hidden. The 7.0
 * default is the narrow rule; PENDING DECISION — the differential test suite
 * asserts both backends agree on the display-based cases, and reports the
 * zero-size and detached divergences separately instead of silently picking
 * a side.
 * @param {Element} el - the element to check.
 * @returns {Boolean} true when the element is rendered by the display rules.
 */
function visible(el) {
  for (let node = el; node && node.nodeType === 1; node = node.parentNode) {
    if (window.getComputedStyle(node).display === 'none') {
      return false;
    }
  }
  return true;
}

function camelCase(name) {
  return name.replace(/-([a-z])/g, (match, char) => char.toUpperCase());
}

// jQuery `.data()`'s value conversion (`getData` in its data module):
// "true"/"false" → boolean, "null" → null, and numbers — but only when the
// number converts back to the exact same string, so "42", "-3.5", "0.5" and
// "Infinity" convert, while "042" or "1e3" stay strings. "" stays "".
function convertData(value) {
  if (value === 'true') { return true; }
  if (value === 'false') { return false; }
  if (value === 'null') { return null; }
  if (value === +value + '') { return +value; }
  return value;
}

/**
 * Reads an element's `data-*` attributes into a camelCased plain object,
 * mirroring `$(el).data()`'s key handling (`data-foo-bar` → `fooBar`) AND its
 * value conversion ("true"/"false" → boolean, "null" → null, numeric strings
 * → number, everything else stays a string).
 *
 * DECIDED 2026-10-22 (was PENDING "no coercion" in S1): convert like jQuery
 * `.data()`. Rationale — equivalence: the ~22 component option-merge points
 * (`$.extend({}, defaults, this.$element.data(), options)`) consume the
 * CONVERTED values today, so raw attribute strings would flip truthiness
 * (`"false"` is a truthy string) and feed strings where CSS assignment and
 * arithmetic expect numbers. Running the values through the same conversion
 * keeps every current consumer byte-compatible.
 * @param {Element} el - the element to read.
 * @returns {Object} camelCased map of the element's data-* attributes.
 */
function datasetOptions(el) {
  const options = {};
  if (!el || el.nodeType !== 1) { return options; }
  Array.from(el.attributes).forEach(attr => {
    if (attr.name.indexOf('data-') === 0) {
      options[camelCase(attr.name.slice(5))] = convertData(attr.value);
    }
  });
  return options;
}

export {q, visible, datasetOptions};
