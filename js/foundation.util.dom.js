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

/**
 * Reads an element's `data-*` attributes into a camelCased plain object,
 * mirroring `$(el).data()`'s key handling (`data-foo-bar` → `fooBar`).
 *
 * Deliberately does NOT convert value types: values stay the raw attribute
 * strings. jQuery `.data()` coerces "true"/"123" to boolean/number, while the
 * v6 option parsing in `Foundation.reflow`/`parseValue` expects to do its own
 * conversion on the raw strings. 7.0 default: no coercion. PENDING DECISION —
 * around 22 options-merge points are affected by the eventual choice.
 * @param {Element} el - the element to read.
 * @returns {Object} camelCased map of the element's data-* attributes.
 */
function datasetOptions(el) {
  const options = {};
  if (!el || el.nodeType !== 1) { return options; }
  Array.from(el.attributes).forEach(attr => {
    if (attr.name.indexOf('data-') === 0) {
      options[camelCase(attr.name.slice(5))] = attr.value;
    }
  });
  return options;
}

export {q, visible, datasetOptions};
