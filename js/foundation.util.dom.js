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

// --- jQuery pseudo-selector stand-ins (7.0 line A, S12) ---
// The jQuery input pseudos have no CSS equivalents. These helpers mirror the
// exact jQuery definitions (rinputs / createInputPseudo / createButtonPseudo
// in jquery.js); their equivalence against the jQuery selectors is pinned
// element-by-element on a fixture form in abide-native.js.
function isTag(el, name) {
  return el.nodeName.toLowerCase() === name;
}

// jQuery `:input` is the tag-name prefilter rinputs
// (/^(?:input|select|textarea|button)$/i): all four form-control tags.
function formControls(root) {
  return Array.from(root.querySelectorAll('input, select, textarea, button'));
}

// jQuery `:button`: an <input type="button"> or any <button>, whatever the
// button's [type].
function isButton(el) {
  return (isTag(el, 'input') && el.type === 'button') || isTag(el, 'button');
}

// jQuery `:submit` / `:reset` (createButtonPseudo): an input or button whose
// `type` property equals the name - a <button> without [type] defaults to
// "submit".
function isSubmit(el) {
  return (isTag(el, 'input') || isTag(el, 'button')) && el.type === 'submit';
}

function isReset(el) {
  return (isTag(el, 'input') || isTag(el, 'button')) && el.type === 'reset';
}

// jQuery `:radio` / `:checkbox` (createInputPseudo): an input whose `type`
// property equals the name.
function isRadio(el) {
  return isTag(el, 'input') && el.type === 'radio';
}

function isCheckbox(el) {
  return isTag(el, 'input') && el.type === 'checkbox';
}

// --- jQuery `$.extend(true, ...)` stand-in (7.0 line A, S14) ---
// Deep-merges `sources` into `target`, mirroring jQuery's deep-extend
// semantics where they differ from naive deep clones:
// - Arrays are merged by INDEX like jQuery does (not concatenated): source
//   slots overwrite target slots, longer tails survive.
// - A source `null` (or undefined) at a key that exists overwrites the value
//   (only keys absent from the source are skipped).
// - A source plain object meets a non-object: it replaces it (jQuery's
//   "deep" only descends when BOTH sides are plain objects/arrays).
// - Functions, RegExps and other class instances are assigned by reference,
//   never cloned (validator functions and pattern RegExps in Abide's
//   defaults must survive the merge as the same objects).
// - Enumeration mirrors jQuery's `for...in`: inherited enumerable keys are
//   copied too; only `__proto__` and self-references are excluded (the
//   Object.prototype-pollution guard from the jQuery source).
function isPlainObjectish(value) {
  return Object.prototype.toString.call(value) === '[object Object]' ||
    Array.isArray(value);
}

function deepMerge(target, ...sources) {
  // jQuery iterates its sources in order and mutates the first object; the
  // `target` given by the callers here is a fresh `{}`, so the mutation is
  // invisible to callers. `null`/primitive targets fall back to a fresh
  // object, like jQuery's handling of a non-object first argument.
  if (!isPlainObjectish(target)) {
    target = {};
  }

  sources.forEach(source => {
    // jQuery skips null/undefined sources entirely.
    if (source == null) { return; }

    // jQuery iterates `for (name in options)` - INHERITED keys are copied
    // too (only `__proto__` and self-references are excluded). Object.keys
    // would silently diverge for prototype-chained option sources, so the
    // inherited enumeration is kept; the `__proto__` guard carries the
    // Object.prototype-pollution protection from the jQuery source.
    // (eslint-disable at function level: guard-for-in wants an `if`
    // prototype filter, but the inherited enumeration is the point here -
    // parity with the jQuery loop - and the `__proto__` guard does the
    // pollution filtering the rule would otherwise ask for.)
    /* eslint-disable-next-line guard-for-in */
    for (const key in source) {
      const srcValue = source[key];
      // `undefined` source values are skipped (jQuery's copy !== undefined
      // guard), so an option can never be reset to undefined by omission.
      if (srcValue === undefined || key === '__proto__' || srcValue === target) { continue; }

      if (isPlainObjectish(srcValue)) {
        const dstValue = target[key];
        const srcIsArray = Array.isArray(srcValue);
        // jQuery descends only when the destination side carries the
        // matching kind: an array source merges by index into an array
        // destination, an object source into an object destination;
        // anything else (primitive, kind mismatch) starts from a fresh
        // carrier of the source's shape.
        const mergeIntoDst = srcIsArray
          ? Array.isArray(dstValue)
          : !Array.isArray(dstValue) && isPlainObjectish(dstValue);
        target[key] = deepMerge(mergeIntoDst ? dstValue : (srcIsArray ? [] : {}), srcValue);
      } else {
        // Primitives, functions, RegExps, DOM nodes: assigned as-is.
        target[key] = srcValue;
      }
    }
  });

  return target;
}

export {q, visible, datasetOptions, formControls, isButton, isSubmit, isReset, isRadio, isCheckbox, deepMerge};
