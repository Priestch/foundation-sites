/**
 * Namespace-aware event layer for the jQuery-free plugin layer (7.0 line A,
 * slice S1).
 *
 * Reproduces the subset of jQuery event semantics the library relies on, on
 * top of plain DOM events:
 *
 * - Namespaced binding and triggering: 'open.zf.toggler'. Like jQuery, a
 *   namespace list is a FLAT SET, not a hierarchy: the namespaces of
 *   'resizeme.zf.trigger.revealScrollbarListener' are zf, trigger and
 *   revealScrollbarListener, with no relationship between them.
 * - All four `.off()` forms the codebase uses:
 *     off(el, 'open.zf.toggler')   exact type; handlers whose namespace set
 *                                  contains zf AND toggler are removed
 *     off(el, '.zf.toggler')       bare namespace: removes matching handlers
 *                                  of every event type on the element
 *     off(el, 'resizeme.zf.trigger.revealScrollbarListener')
 *                                  multi-segment: flat set containment, the
 *                                  handler's namespaces must include all of
 *                                  them (jQuery implements this with a regex
 *                                  over the sorted namespace string; here it
 *                                  is a Set membership check)
 *     off(el)                      removes everything bound on the element
 * - `on`/`off` accept several space-separated "type.ns.ns" strings.
 * - `trigger` bubbles (CustomEvent with bubbles: true) and passes the extra
 *   parameters to the handler after the event, in order.
 * - `triggerHandler` runs handlers on the element itself only, does not
 *   bubble, does not fire native method shortcuts, and returns the last
 *   non-undefined handler result (jQuery's event.result semantics).
 * - `trigger('focus')` — and any other type with a same-named function on the
 *   element — calls that native method after the synthetic pass (jQuery's
 *   implicit shortcut, used throughout the library). A handler calling
 *   preventDefault() suppresses it. The real DOM event that the native call
 *   produces is swallowed, mirroring jQuery's `jQuery.event.triggered` guard,
 *   so handlers do not run twice.
 * - Handlers receive the event as `this`-bound element first argument; the
 *   synthetic events carry a jQuery-style `namespace` string property (the
 *   Triggers util reads `event.namespace` on the jQuery side).
 * - Handler return value `false` acts like jQuery's: preventDefault plus
 *   stopPropagation.
 *
 * Listener storage is a Map<EventTarget, Map<type, bucket>>; exactly one real
 * addEventListener per (element, type) funnels into the stored handler list,
 * which is what makes namespace filtering on trigger and off possible —
 * CustomEvent has no namespace concept of its own. Buckets are pruned when
 * their last handler is removed so the layer does not keep elements alive.
 */

// Map<element, Map<type, { recs: Array<{ns, fn, invoke, once}>, dispatcher }>>
const listenerTable = new Map();

// While a triggered event is calling the same-named native method
// (trigger('focus') → el.focus()), the real DOM event that this produces is
// swallowed once, like jQuery's "triggered" guard.
let nativeEcho = null;

function splitTypes(types) {
  return (types || '').match(/\S+/g) || [];
}

// 'open.zf.toggler' → { type: 'open', ns: Set{'zf','toggler'} };
// '.zf.toggler'     → { type: '',     ns: Set{'zf','toggler'} } (all types).
function parseType(namespaced) {
  const parts = namespaced.split('.');
  return { type: parts.shift(), ns: new Set(parts) };
}

// The jQuery fire/remove rule: a handler matches when its namespace set
// contains every namespace of the queried event ("contains all"). An empty
// query namespace matches everything (plain trigger fires namespaced handlers
// too), while a namespaced trigger does NOT fire unnamespaced handlers.
function nsMatch(queryNs, handlerNs) {
  if (queryNs.size === 0) { return true; }
  const names = Array.from(queryNs);
  return names.every(name => handlerNs.has(name));
}

function nsString(ns) {
  return Array.from(ns).sort().join('.');
}

function getBucket(el, type, create) {
  let byType = listenerTable.get(el);
  if (!byType) {
    if (!create) { return null; }
    byType = new Map();
    listenerTable.set(el, byType);
  }
  let bucket = byType.get(type);
  if (!bucket && create) {
    bucket = { recs: [], dispatcher: null };
    byType.set(type, bucket);
  }
  return bucket;
}

// One real addEventListener per (element, type): reads the live handler list
// on every dispatch so off() during dispatch behaves, and filters by the
// namespaces carried on the event.
function installDispatcher(el, type, bucket) {
  const dispatcher = function (event) {
    if (nativeEcho === type) {
      nativeEcho = null;
      return;
    }
    const result = runHandlers(el, bucket.recs, event, nsOf(event), event.detail || []);
    // The dispatch is synchronous, so the triggerHandler caller can read
    // the run's result back off the event object (jQuery's event.result).
    if (result !== undefined) {
      event.zfResult = result;
    }
  };
  bucket.dispatcher = dispatcher;
  el.addEventListener(type, dispatcher);
}

function removeBucket(el, type, bucket) {
  if (!bucket || !bucket.dispatcher) { return; }
  el.removeEventListener(type, bucket.dispatcher);
  const byType = listenerTable.get(el);
  if (!byType) { return; }
  byType.delete(type);
  if (byType.size === 0) {
    listenerTable.delete(el);
  }
}

// Real DOM events have no namespaces; synthetic ones carry the jQuery-style
// `namespace` string grafted on by trigger()/triggerHandler().
function nsOf(event) {
  return new Set(event.namespace ? event.namespace.split('.') : []);
}

// The DOM has no way to query whether stopImmediatePropagation() was called
// (that getter is a jQuery invention), so wrap the method once per event and
// keep the checker on the event itself. Shadowing the prototype method with
// an own property keeps the native behavior (the original is still called).
function immediateChecker(event) {
  if (!event.zfImmediateStopped) {
    let stopped = false;
    const original = event.stopImmediatePropagation;
    event.stopImmediatePropagation = function () {
      stopped = true;
      if (typeof original === 'function') { original.call(event); }
    };
    event.zfImmediateStopped = function () { return stopped; };
  }
  return event.zfImmediateStopped;
}

// Runs the matching handlers for one dispatch. Returns the last non-undefined
// result (jQuery's event.result).
function runHandlers(el, recs, event, queryNs, args) {
  let result;
  const immediateStopped = immediateChecker(event);
  // Snapshot: handlers added during dispatch don't run in it; removed ones do
  // (they were already queued) — matches the jQuery handler queue.
  const queue = recs.slice();
  for (let i = 0; i < queue.length; i++) {
    if (immediateStopped()) { break; }
    const rec = queue[i];
    if (!nsMatch(queryNs, rec.ns)) { continue; }
    const ret = rec.invoke(event, args);
    if (ret !== undefined) {
      result = ret;
      if (ret === false) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    if (rec.once) {
      const at = recs.indexOf(rec);
      if (at > -1) { recs.splice(at, 1); }
      if (recs.length === 0) {
        const bucket = getBucket(el, rec.type);
        if (bucket) { removeBucket(el, rec.type, bucket); }
      }
    }
  }
  return result;
}

function makeRec(el, type, ns, fn, options) {
  const rec = { type, ns, fn, once: !!(options && options.once), invoke: null };
  if (options && options.selector) {
    // Delegated: `this` inside the handler is the closest element matching
    // the selector, searched upward from the event target but never escaping
    // the delegation root (jQuery's delegate walk).
    rec.invoke = function (event, args) {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') { return undefined; }
      const match = target.closest(options.selector);
      if (!match || (match !== el && !el.contains(match))) { return undefined; }
      return fn.apply(match, [event].concat(args));
    };
  } else {
    rec.invoke = function (event, args) {
      return fn.apply(el, [event].concat(args));
    };
  }
  return rec;
}

function on(el, types, fn) {
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    const bucket = getBucket(el, parsed.type, true);
    if (!bucket.dispatcher) { installDispatcher(el, parsed.type, bucket); }
    bucket.recs.push(makeRec(el, parsed.type, parsed.ns, fn));
  });
  return el;
}

function one(el, types, fn) {
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    const bucket = getBucket(el, parsed.type, true);
    if (!bucket.dispatcher) { installDispatcher(el, parsed.type, bucket); }
    bucket.recs.push(makeRec(el, parsed.type, parsed.ns, fn, { once: true }));
  });
  return el;
}

// Delegated listener on a root (typically the document), covering the
// `[data-toggle]` document-level delegation of the Triggers util.
function delegate(root, types, selector, fn) {
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    const bucket = getBucket(root, parsed.type, true);
    if (!bucket.dispatcher) { installDispatcher(root, parsed.type, bucket); }
    bucket.recs.push(makeRec(root, parsed.type, parsed.ns, fn, { selector }));
  });
  return root;
}

function off(el, types, fn) {
  const byType = listenerTable.get(el);
  if (!byType) { return el; }

  if (types == null) {
    // off(): everything on the element.
    Array.from(byType.keys()).forEach(type => {
      off(el, type, fn);
    });
    return el;
  }

  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    if (parsed.type === '') {
      // Bare namespace ('.zf.toggler'): every type on the element.
      Array.from(byType.keys()).forEach(type => {
        removeMatching(el, type, parsed.ns, fn);
      });
    } else {
      removeMatching(el, parsed.type, parsed.ns, fn);
    }
  });
  return el;
}

function removeMatching(el, type, queryNs, fn) {
  const bucket = getBucket(el, type);
  if (!bucket) { return; }
  bucket.recs = bucket.recs.filter(rec => {
    const match = (!fn || rec.fn === fn) && nsMatch(queryNs, rec.ns);
    return !match;
  });
  if (bucket.recs.length === 0) {
    removeBucket(el, type, bucket);
  }
}

// Fires a bubbling, cancelable CustomEvent per namespaced type and passes the
// params to handlers after the event, in order (jQuery extraParameters).
// The detail params stay pass-through (S1 decision, confirmed 2026-10-22):
// final form = native Element, to be switched uniformly in the line-A
// wrap-up slice.
function trigger(el, types, params) {
  const args = params == null ? [] : (Array.isArray(params) ? params : [params]);
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    if (!parsed.type) { return; }
    const event = new CustomEvent(parsed.type, { bubbles: true, cancelable: true, detail: args });
    event.namespace = nsString(parsed.ns);
    el.dispatchEvent(event);
    // jQuery shortcut: a triggered type with a same-named native function on
    // the element (focus, click, …) invokes it, unless a handler cancelled
    // the synthetic event.
    if (!event.defaultPrevented && el !== window && typeof el[parsed.type] === 'function') {
      nativeEcho = parsed.type;
      try {
        el[parsed.type]();
      } finally {
        if (nativeEcho === parsed.type) { nativeEcho = null; }
      }
    }
  });
  return el;
}

// Non-bubbling variant: runs the handlers of the element itself only and
// returns the last non-undefined result. Deliberately NOT a real dispatch:
// a real event would bypass namespace filtering on the jQuery side (jQuery
// cannot filter real DOM events), so the mixed-state delivery to still-on-
// jQuery consumers is done by the callers that own the seam (Triggers util)
// through jQuery's own filtered triggerHandler.
function triggerHandler(el, types, params) {
  const args = params == null ? [] : (Array.isArray(params) ? params : [params]);
  let result;
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    if (!parsed.type) { return; }
    // A real NON-BUBBLING event: jQuery's triggerHandler was local to its
    // single shared table; the native world carries one Events table per
    // bundle (foundation.js beside foundation-next.js), so the shared
    // transport between them is the DOM itself. Same-element listeners on
    // every table hear it, ancestors and other elements do not - the rest
    // of the jQuery semantics (no bubbling, no native-method shortcut,
    // handler `false` still prevents the default).
    const event = new CustomEvent(parsed.type, { bubbles: false, cancelable: true, detail: args });
    event.namespace = nsString(parsed.ns);
    el.dispatchEvent(event);
    result = event.zfResult;
  });
  return result;
}

const Events = { on, one, off, delegate, trigger, triggerHandler };

// Core Foundation Utilities, utilized in a number of places.

// Accepts both the jQuery objects un-migrated callers still pass and plain
// elements, so the helper survives the line-A migration unchanged.
function toElement$1(obj) {
  // window is array-like too - window[0] is the first frame's Window, and
  // unwrapping it hands back a (possibly cross-origin) iframe window that
  // throws on the next property read. Every onLoad(window, ...) call on a
  // page that already contains an iframe hit this.
  if (obj === window) { return obj; }
  // nodeType marks a real node: never unwrap it, even when it is itself
  // array-like (HTMLSelectElement exposes its first option as [0]).
  return obj && obj.nodeType === undefined && obj[0] !== undefined ? obj[0] : obj;
}

  /**
   * Returns a boolean for RTL support
   */
function rtl() {
  return document.documentElement.getAttribute('dir') === 'rtl';
}

/**
 * returns a random base-36 uid with namespacing
 * @function
 * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
 * @param {String} namespace - name of plugin to be incorporated in uid, optional.
 * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
 * @returns {String} - unique id
 */
function GetYoDigits(length = 6, namespace){
  let str = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  const charsLength = chars.length;
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * charsLength)];
  }
  return namespace ? `${str}-${namespace}` : str;
}

/**
 * Escape a string so it can be used as a regexp pattern
 * @function
 * @see https://stackoverflow.com/a/9310752/4317384
 *
 * @param {String} str - string to escape.
 * @returns {String} - escaped string
 */
function RegExpEscape(str){
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function transitionend($elem){
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = document.createElement('div'),
      end;

  for (let transition in transitions){
    if (typeof elem.style[transition] !== 'undefined'){
      end = transitions[transition];
    }
  }
  if (end) {
    return end;
  } else {
    // Fallback for engines without transitions (not reached on the baseline
    // browsers). Dual dispatch like the Triggers util: the native layer for
    // migrated consumers, jQuery's filtered triggerHandler for the
    // `.one(transitionend($elem), ...)` listeners of un-migrated ones.
    let el = toElement$1($elem);
    setTimeout(function(){
      Events.triggerHandler(el, 'transitionend', [el]);
    }, 1);
    return 'transitionend';
  }
}

/**
 * Return an event type to listen for window load.
 *
 * If `$elem` is passed, an event will be triggered on `$elem`. If window is already loaded, the event will still be triggered.
 * If `handler` is passed, attach it to the event on `$elem`.
 * Calling `onLoad` without handler allows you to get the event type that will be triggered before attaching the handler by yourself.
 * @function
 *
 * @param {Object} [] $elem - jQuery element on which the event will be triggered if passed.
 * @param {Function} [] handler - function to attach to the event.
 * @returns {String} - event type that should or will be triggered.
 */
function onLoad($elem, handler) {
  const didLoad = document.readyState === 'complete';
  const eventType = (didLoad ? '_didLoad' : 'load') + '.zf.util.onLoad';

  if ($elem) {
    const el = toElement$1($elem);
    // Local, native-only dispatch: the handler is registered right below on
    // the native layer, and a real echoed 'load' on window would re-notify
    // third-party window-load listeners.
    const cb = () => Events.triggerHandler(el, eventType);

    if (handler) Events.one(el, eventType, handler);

    if (didLoad)
      setTimeout(cb);
    else
      Events.one(window, 'load', cb);
  }

  return eventType;
}

/**
 * Retuns an handler for the `mouseleave` that ignore disappeared mouses.
 *
 * If the mouse "disappeared" from the document (like when going on a browser UI element, See https://git.io/zf-11410),
 * the event is ignored.
 * - If the `ignoreLeaveWindow` is `true`, the event is ignored when the user actually left the window
 *   (like by switching to an other window with [Alt]+[Tab]).
 * - If the `ignoreReappear` is `true`, the event will be ignored when the mouse will reappear later on the document
 *   outside of the element it left.
 *
 * @function
 *
 * @param {Function} [] handler - handler for the filtered `mouseleave` event to watch.
 * @param {Object} [] options - object of options:
 * - {Boolean} [false] ignoreLeaveWindow - also ignore when the user switched windows.
 * - {Boolean} [false] ignoreReappear - also ignore when the mouse reappeared outside of the element it left.
 * @returns {Function} - filtered handler to use to listen on the `mouseleave` event.
 */
function ignoreMousedisappear(handler, { ignoreLeaveWindow = false, ignoreReappear = false } = {}) {
  return function leaveEventHandler(eLeave, ...rest) {
    const callback = handler.bind(this, eLeave, ...rest);

    // The mouse left: call the given callback if the mouse entered elsewhere
    if (eLeave.relatedTarget !== null) {
      return callback();
    }

    // Otherwise, check if the mouse actually left the window.
    // In firefox if the user switched between windows, the window sill have the focus by the time
    // the event is triggered. We have to debounce the event to test this case.
    setTimeout(function leaveEventDebouncer() {
      if (!ignoreLeaveWindow && document.hasFocus && !document.hasFocus()) {
        return callback();
      }

      // Otherwise, wait for the mouse to reeapear outside of the element,
      if (!ignoreReappear) {
        Events.one(document, 'mouseenter', function reenterEventHandler(eReenter) {
          if (!eLeave.currentTarget.contains(eReenter.target)) {
            // Fill where the mouse finally entered.
            eLeave.relatedTarget = eReenter.target;
            callback();
          }
        });
      }

    }, 0);
  };
}

var foundation_core_utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  GetYoDigits: GetYoDigits,
  RegExpEscape: RegExpEscape,
  ignoreMousedisappear: ignoreMousedisappear,
  onLoad: onLoad,
  rtl: rtl,
  transitionend: transitionend
});

/**
 * Instance registry for the jQuery-free plugin layer (7.0 line A, slice S1).
 *
 * Replaces the `$(el).data('zfPlugin')` instance store with point lookups on a
 * WeakMap. Keys are held weakly, so once a plugin is destroyed and every other
 * reference to its element is dropped, the whole entry can be garbage
 * collected — the same lifetime the jQuery data cache had.
 *
 * Scope note: discovery/enumeration of initialized elements is NOT a registry
 * concern and stays where it is today — on the `data-<name>` attribute, found
 * with `querySelectorAll('[data-<name>]')`. The registry only answers "does
 * this element have an instance, and which one?". A WeakMap cannot be
 * enumerated by design, but jQuery data was not enumerable either, so this
 * matches the v6 division of labor exactly.
 */
const instances = new WeakMap();

const Registry = {
  /**
   * Gets the plugin instance registered for an element.
   * @param {Element} el - the element to look up.
   * @returns {?Object} the registered instance, or undefined if there is none.
   */
  getInstance(el) {
    return instances.get(el);
  },

  /**
   * Registers the plugin instance for an element, replacing any previous one.
   * @param {Element} el - the element the instance belongs to.
   * @param {Object} instance - the plugin instance.
   * @returns {Object} the stored instance, for chaining.
   */
  setInstance(el, instance) {
    instances.set(el, instance);
    return instance;
  },

  /**
   * Whether an element currently has a registered instance.
   * @param {Element} el - the element to look up.
   * @returns {Boolean} true if an instance is registered for the element.
   */
  has(el) {
    return instances.has(el);
  },

  /**
   * Removes the entry for an element (used on the plugin destroy path).
   * @param {Element} el - the element to unregister.
   * @returns {Boolean} true if an entry existed and was removed.
   */
  removeInstance(el) {
    return instances.delete(el);
  }
};

// Default set of media queries
// const defaultQueries = {
//   'default' : 'only screen',
//   landscape : 'only screen and (orientation: landscape)',
//   portrait : 'only screen and (orientation: portrait)',
//   retina : 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
//     'only screen and (min--moz-device-pixel-ratio: 2),' +
//     'only screen and (-o-min-device-pixel-ratio: 2/1),' +
//     'only screen and (min-device-pixel-ratio: 2),' +
//     'only screen and (min-resolution: 192dpi),' +
//     'only screen and (min-resolution: 2dppx)'
//   };

// S13 (7.0 line A): the module is jQuery-free. The breakpoint probe reads
// the computed font-family off the meta.foundation-mq element through
// getComputedStyle (the exact value jQuery's `.css('font-family')` returned)
// and the breakpoint watcher runs on the native event layer: real resize
// events reach it directly, and the 'changed.zf.mediaquery' broadcast is a
// real bubbling window event (native consumers directly, still-jQuery
// consumers through the real-event pass-through, parameters in the detail).
var MediaQuery = {
  queries: [],

  current: '',

  /**
   * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
   * @function
   * @private
   */
  _init() {

    // make sure the initialization is only done once when calling _init() several times
    if (this.isInitialized === true) {
      return this;
    } else {
      this.isInitialized = true;
    }

    var self = this;
    var meta = document.querySelector('meta.foundation-mq');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('class', 'foundation-mq');
      meta.setAttribute('name', 'foundation-mq');
      meta.setAttribute('content', '');
      document.head.appendChild(meta);
    }

    var extractedStyles = window.getComputedStyle(meta).getPropertyValue('font-family');
    var namedQueries;

    namedQueries = parseStyleToObject(extractedStyles);

    self.queries = []; // reset

    for (var key in namedQueries) {
      if(namedQueries.hasOwnProperty(key)) {
        self.queries.push({
          name: key,
          value: `only screen and (min-width: ${namedQueries[key]})`
        });
      }
    }

    this.current = this._getCurrentSize();

    this._watcher();
  },

  /**
   * Reinitializes the media query helper.
   * Useful if your CSS breakpoint configuration has just been loaded or has changed since the initialization.
   * @function
   * @private
   */
  _reInit() {
    this.isInitialized = false;
    this._init();
  },

  /**
   * Checks if the screen is at least as wide as a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
   */
  atLeast(size) {
    var query = this.get(size);

    if (query) {
      return window.matchMedia(query).matches;
    }

    return false;
  },

  /**
   * Checks if the screen is within the given breakpoint.
   * If smaller than the breakpoint of larger than its upper limit it returns false.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
   */
  only(size) {
    return size === this._getCurrentSize();
  },

  /**
   * Checks if the screen is within a breakpoint or smaller.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's larger.
   */
  upTo(size) {
    const nextSize = this.next(size);

    // If the next breakpoint does not match, the screen is smaller than
    // the upper limit of this breakpoint.
    if (nextSize) {
      return !this.atLeast(nextSize);
    }

    // If there is no next breakpoint, the "size" breakpoint does not have
    // an upper limit and the screen will always be within it or smaller.
    return true;
  },

  /**
   * Checks if the screen matches to a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
   */
  is(size) {
    const parts = size.trim().split(' ').filter(p => !!p.length);
    const [bpSize, bpModifier = ''] = parts;

    // Only the breakpont
    if (bpModifier === 'only') {
      return this.only(bpSize);
    }
    // At least the breakpoint (included)
    if (!bpModifier || bpModifier === 'up') {
      return this.atLeast(bpSize);
    }
    // Up to the breakpoint (included)
    if (bpModifier === 'down') {
      return this.upTo(bpSize);
    }

    throw new Error(`
      Invalid breakpoint passed to MediaQuery.is().
      Expected a breakpoint name formatted like "<size> <modifier>", got "${size}".
    `);
  },

  /**
   * Gets the media query of a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to get.
   * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
   */
  get(size) {
    for (var i in this.queries) {
      if(this.queries.hasOwnProperty(i)) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }
    }

    return null;
  },

  /**
   * Get the breakpoint following the given breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint.
   * @returns {String|null} - The name of the following breakpoint, or `null` if the passed breakpoint was the last one.
   */
  next(size) {
    const queryIndex = this.queries.findIndex((q) => this._getQueryName(q) === size);
    if (queryIndex === -1) {
      throw new Error(`
        Unknown breakpoint "${size}" passed to MediaQuery.next().
        Ensure it is present in your Sass "$breakpoints" setting.
      `);
    }

    const nextQuery = this.queries[queryIndex + 1];
    return nextQuery ? nextQuery.name : null;
  },

  /**
   * Returns the name of the breakpoint related to the given value.
   * @function
   * @private
   * @param {String|Object} value - Breakpoint name or query object.
   * @returns {String} Name of the breakpoint.
   */
  _getQueryName(value) {
    if (typeof value === 'string')
      return value;
    if (typeof value === 'object')
      return value.name;
    throw new TypeError(`
      Invalid value passed to MediaQuery._getQueryName().
      Expected a breakpoint name (String) or a breakpoint query (Object), got "${value}" (${typeof value})
    `);
  },

  /**
   * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
   * @function
   * @private
   * @returns {String} Name of the current breakpoint.
   */
  _getCurrentSize() {
    var matched;

    for (var i = 0; i < this.queries.length; i++) {
      var query = this.queries[i];

      if (window.matchMedia(query.value).matches) {
        matched = query;
      }
    }

    return matched && this._getQueryName(matched);
  },

  /**
   * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
   * @function
   * @private
   */
  _watcher() {
    Events.on(window, 'resize.zf.mediaquery', () => {
      var newSize = this._getCurrentSize(), currentSize = this.current;

      if (newSize !== currentSize) {
        // Change the current media query
        this.current = newSize;

        // Broadcast the media query change on the window as a real,
        // bubbling event: native consumers receive it directly and
        // still-jQuery consumers keep hearing it through the real-event
        // pass-through, with the new and former breakpoint names on the
        // event detail (jQuery hands them out as the handler arguments
        // 2/3, exactly where the 6.x synthetic trigger put them).
        Events.trigger(window, 'changed.zf.mediaquery', [newSize, currentSize]);
      }
    });
  }
};



// Thank you: https://github.com/sindresorhus/query-string
function parseStyleToObject(str) {
  var styleObject = {};

  if (typeof str !== 'string') {
    return styleObject;
  }

  str = str.trim().slice(1, -1); // browsers re-quote string style values

  if (!str) {
    return styleObject;
  }

  styleObject = str.split('&').reduce(function(ret, param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = parts[0];
    var val = parts[1];
    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = typeof val === 'undefined' ? null : decodeURIComponent(val);

    if (!ret.hasOwnProperty(key)) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
    return ret;
  }, {});

  return styleObject;
}

var FOUNDATION_VERSION = '6.9.0';

// Global Foundation object
// This is attached to the window, or used as a module for AMD/Browserify
var Foundation = {
  version: FOUNDATION_VERSION,

  /**
   * Stores initialized plugins.
   */
  _plugins: {},

  /**
   * Stores generated unique ids for plugin instances
   */
  _uuids: [],

  /**
   * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
   * @param {Object} plugin - The constructor of the plugin.
   */
  plugin: function(plugin, name) {
    // Object key to use when adding to global Foundation object
    // Examples: Foundation.Reveal, Foundation.OffCanvas
    var className = (name || functionName(plugin));
    // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
    // Examples: data-reveal, data-off-canvas
    var attrName  = hyphenate$1(className);

    // Add to the Foundation object and the plugins list (for reflowing)
    this._plugins[attrName] = this[className] = plugin;
  },
  /**
   * @function
   * Populates the _uuids array with pointers to each individual plugin instance.
   * Adds the `data-<name>` attribute to programmatically created plugins.
   * Also fires the initialization event for each plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @param {String} name - the name of the plugin, passed as a camelCased string.
   * @fires Plugin#init
   */
  registerPlugin: function(plugin, name){
    var pluginName = name ? hyphenate$1(name) : functionName(plugin.constructor).toLowerCase();
    plugin.uuid = GetYoDigits(6, pluginName);

    // 7.0 terminal form: the element write, the Registry entry and the
    // real, bubbling init event (the Plugin base class does the same).
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    if(!el.getAttribute(`data-${pluginName}`)){ el.setAttribute(`data-${pluginName}`, plugin.uuid); }
    if(el && !Registry.has(el)){ Registry.setInstance(el, plugin); }
          /**
           * Fires when the plugin has initialized.
           * @event Plugin#init
           */
    Events.trigger(el, `init.zf.${pluginName}`);

    this._uuids.push(plugin.uuid);

    return;
  },
  /**
   * @function
   * Removes the plugins uuid from the _uuids array.
   * Removes the identifying data attribute and the stored Registry entry.
   * Also fires the destroyed event for the plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#destroyed
   */
  unregisterPlugin: function(plugin){
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    var pluginName = hyphenate$1(functionName(Registry.getInstance(el).constructor));

    this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
    el.removeAttribute(`data-${pluginName}`);
    Registry.removeInstance(el);
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    Events.trigger(el, `destroyed.zf.${pluginName}`);
    for(var prop in plugin){
      if(typeof plugin[prop] === 'function'){
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
    }
    return;
  },

  /**
   * @function
   * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
   * @param {Element|String|Array} plugins - a native element (or, legacy, a jQuery collection) holding the plugin, a string of a plugin class i.e. `'dropdown'`, or an array of such strings.
   * @default If no argument is passed, reflow all currently active plugins.
   */
   reInit: function(plugins){
     // 7.0 terminal form: an element (or a collection, legacy shape) holds
     // the instance to re-init; strings name plugin classes to sweep.
     var isElement = typeof Element !== 'undefined' && plugins instanceof Element;
     var isCollection = !isElement && plugins && plugins.nodeType === undefined && plugins.length !== undefined && typeof plugins !== 'string';
     try{
       if(isElement || isCollection){
         var elements = isElement ? [plugins] : Array.from(plugins);
         elements.forEach(function(el){
           var instance = Registry.getInstance(el);
           if (instance) { instance._init(); }
         });
       }else {
         var type = typeof plugins,
         _this = this;
         var reInitByName = function(name) {
           document.querySelectorAll('[data-'+ name +']').forEach(function(el) {
             var instance = Registry.getInstance(el);
             if (instance) { instance._init(); }
           });
         };
         if (type === 'object' && plugins && plugins.forEach) {
           plugins.forEach(function(p){
             reInitByName(hyphenate$1(p));
           });
         } else if (type === 'string') {
           reInitByName(hyphenate$1(plugins));
         } else {
           Object.keys(_this._plugins).forEach(reInitByName);
         }
       }
     }catch(err){
       console.error(err);
     }finally{
       return plugins;
     }
   },

  /**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Element|Document|String|Object} elem - native element or document to scan, a selector string, or (legacy, mixed state) a jQuery object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
  reflow: function(elem, plugins) {

    // If plugins is undefined, just grab everything
    if (typeof plugins === 'undefined') {
      plugins = Object.keys(this._plugins);
    }
    // If plugins is a string, convert it to an array with one item
    else if (typeof plugins === 'string') {
      plugins = [plugins];
    }

    var _this = this;

    // 7.0 terminal form: the root accepts an element, the document, a
    // selector string or (legacy) a collection - unwrapped to elements. The
    // scan stays on the `data-<name>` attribute: v6's find + addBack is the
    // subtree plus the root itself (the document root never matches itself).
    var rootEls;
    if (typeof elem === 'string') {
      rootEls = Array.from(document.querySelectorAll(elem));
    } else if (elem && elem.nodeType === 1) {
      rootEls = [elem];
    } else if (elem && elem.nodeType === 9) {
      rootEls = null; // document: search everything
    } else if (elem && elem.length !== undefined) {
      rootEls = Array.from(elem);
    } else {
      rootEls = null;
    }

    // Iterate through each plugin
    plugins.forEach(function(name) {
      // Get the current plugin
      var plugin = _this._plugins[name];

      // Localize the search to all elements inside elem, as well as elem itself
      var candidates;
      if (rootEls === null) {
        candidates = Array.from(document.querySelectorAll('[data-'+name+']'));
      } else {
        candidates = [];
        rootEls.forEach(function(rootEl) {
          candidates.push(...Array.from(rootEl.querySelectorAll('[data-'+name+']')));
          if (rootEl.matches('[data-'+name+']')) { candidates.push(rootEl); }
        });
      }
      var unregistered = candidates.filter(function (el) {
        return typeof Registry.getInstance(el) === 'undefined';
      });

      // For each plugin found, initialize it
      unregistered.forEach(function(el) {
        var opts = { reflow: true };

        if(el.getAttribute('data-options')){
          el.getAttribute('data-options').split(';').forEach(function(option){
            var opt = option.split(':').map(function(part){ return part.trim(); });
            if(opt[0]) opts[opt[0]] = parseValue(opt[1]);
          });
        }
        try{
          Registry.setInstance(el, new plugin(el, opts));
        }catch(er){
          console.error(er);
        }
      });
    });
  },
  getFnName: functionName,

  /**
   * Initializes Foundation: primes the MediaQuery layer, removes the
   * `no-js` class and reflows (constructs) every plugin found under `root`.
   * @function
   * @param {Element|Document|String} [root=document] - where to scan for plugins: an element, the document, or a selector string.
   * @returns {Element|Document|String} the root that was initialized.
   */
  init: function(root) {
    root = root || document;

    document.querySelectorAll('.no-js').forEach(function(el) {
      el.classList.remove('no-js');
    });

    MediaQuery._init();
    Foundation.reflow(root);
    return root;
  },

};

Foundation.util = {
  /**
   * Function for applying a debounce effect to a function call.
   * @function
   * @param {Function} func - Function to be called at end of timeout.
   * @param {Number} delay - Time in ms to delay the call of `func`.
   * @returns function
   */
  throttle: function (func, delay) {
    var timer = null;

    return function () {
      var context = this, args = arguments;

      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
};

window.Foundation = Foundation;

// Polyfill to get the name of a function in IE9
function functionName(fn) {
  if (typeof Function.prototype.name === 'undefined') {
    var funcNameRegex = /function\s([^(]{1,})\(/;
    var results = (funcNameRegex).exec((fn).toString());
    return (results && results.length > 1) ? results[1].trim() : "";
  }
  else if (typeof fn.prototype === 'undefined') {
    return fn.constructor.name;
  }
  else {
    return fn.prototype.constructor.name;
  }
}
function parseValue(str){
  if ('true' === str) return true;
  else if ('false' === str) return false;
  else if (!isNaN(str * 1)) return parseFloat(str);
  return str;
}
// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate$1(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

var Box = {
  ImNotTouchingYou: ImNotTouchingYou,
  OverlapArea: OverlapArea,
  GetDimensions: GetDimensions,
  GetExplicitOffsets: GetExplicitOffsets
};

/**
 * Compares the dimensions of an element to a container and determines collision events with container.
 * @function
 * @param {jQuery} element - jQuery object to test for collisions.
 * @param {jQuery} parent - jQuery object to use as bounding container.
 * @param {Boolean} lrOnly - set to true to check left and right values only.
 * @param {Boolean} tbOnly - set to true to check top and bottom values only.
 * @default if no parent object passed, detects collisions with `window`.
 * @returns {Boolean} - true if collision free, false if a collision in any direction.
 */
function ImNotTouchingYou(element, parent, lrOnly, tbOnly, ignoreBottom) {
  return OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) === 0;
}

function OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) {
  var eleDims = GetDimensions(element),
  topOver, bottomOver, leftOver, rightOver;
  if (parent) {
    var parDims = GetDimensions(parent);

    bottomOver = (parDims.height + parDims.offset.top) - (eleDims.offset.top + eleDims.height);
    topOver    = eleDims.offset.top - parDims.offset.top;
    leftOver   = eleDims.offset.left - parDims.offset.left;
    rightOver  = (parDims.width + parDims.offset.left) - (eleDims.offset.left + eleDims.width);
  }
  else {
    bottomOver = (eleDims.windowDims.height + eleDims.windowDims.offset.top) - (eleDims.offset.top + eleDims.height);
    topOver    = eleDims.offset.top - eleDims.windowDims.offset.top;
    leftOver   = eleDims.offset.left - eleDims.windowDims.offset.left;
    rightOver  = eleDims.windowDims.width - (eleDims.offset.left + eleDims.width);
  }

  bottomOver = ignoreBottom ? 0 : Math.min(bottomOver, 0);
  topOver    = Math.min(topOver, 0);
  leftOver   = Math.min(leftOver, 0);
  rightOver  = Math.min(rightOver, 0);

  if (lrOnly) {
    return leftOver + rightOver;
  }
  if (tbOnly) {
    return topOver + bottomOver;
  }

  // use sum of squares b/c we care about overlap area.
  return Math.sqrt((topOver * topOver) + (bottomOver * bottomOver) + (leftOver * leftOver) + (rightOver * rightOver));
}

/**
 * Uses native methods to return an object of dimension values.
 * @function
 * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
 * @returns {Object} - nested object of integer pixel values
 * TODO - if element is window, return only those values.
 */
function GetDimensions(elem){
  elem = elem.length ? elem[0] : elem;

  if (elem === window || elem === document) {
    throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
  }

  var rect = elem.getBoundingClientRect(),
      parRect = elem.parentNode.getBoundingClientRect(),
      winRect = document.body.getBoundingClientRect(),
      winY = window.pageYOffset,
      winX = window.pageXOffset;

  return {
    width: rect.width,
    height: rect.height,
    offset: {
      top: rect.top + winY,
      left: rect.left + winX
    },
    parentDims: {
      width: parRect.width,
      height: parRect.height,
      offset: {
        top: parRect.top + winY,
        left: parRect.left + winX
      }
    },
    windowDims: {
      width: winRect.width,
      height: winRect.height,
      offset: {
        top: winY,
        left: winX
      }
    }
  }
}

/**
 * Returns an object of top and left integer pixel values for dynamically rendered elements,
 * such as: Tooltip, Reveal, and Dropdown. Maintained for backwards compatibility, and where
 * you don't know alignment, but generally from
 * 6.4 forward you should use GetExplicitOffsets, as GetOffsets conflates position and alignment.
 * @function
 * @param {jQuery} element - jQuery object for the element being positioned.
 * @param {jQuery} anchor - jQuery object for the element's anchor point.
 * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
 * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
 * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
 * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
 * TODO alter/rewrite to work with `em` values as well/instead of pixels
 */
function GetExplicitOffsets(element, anchor, position, alignment, vOffset, hOffset, isOverflow) {
  var $eleDims = GetDimensions(element),
      $anchorDims = anchor ? GetDimensions(anchor) : null;

      var topVal, leftVal;

  if ($anchorDims !== null) {
  // set position related attribute
  switch (position) {
    case 'top':
      topVal = $anchorDims.offset.top - ($eleDims.height + vOffset);
      break;
    case 'bottom':
      topVal = $anchorDims.offset.top + $anchorDims.height + vOffset;
      break;
    case 'left':
      leftVal = $anchorDims.offset.left - ($eleDims.width + hOffset);
      break;
    case 'right':
      leftVal = $anchorDims.offset.left + $anchorDims.width + hOffset;
      break;
  }

  // set alignment related attribute
  switch (position) {
    case 'top':
    case 'bottom':
      switch (alignment) {
        case 'left':
          leftVal = $anchorDims.offset.left + hOffset;
          break;
        case 'right':
          leftVal = $anchorDims.offset.left - $eleDims.width + $anchorDims.width - hOffset;
          break;
        case 'center':
          leftVal = isOverflow ? hOffset : (($anchorDims.offset.left + ($anchorDims.width / 2)) - ($eleDims.width / 2)) + hOffset;
          break;
      }
      break;
    case 'right':
    case 'left':
      switch (alignment) {
        case 'bottom':
          topVal = $anchorDims.offset.top - vOffset + $anchorDims.height - $eleDims.height;
          break;
        case 'top':
          topVal = $anchorDims.offset.top + vOffset;
          break;
        case 'center':
          topVal = ($anchorDims.offset.top + vOffset + ($anchorDims.height / 2)) - ($eleDims.height / 2);
          break;
      }
      break;
  }
  }

  return {top: topVal, left: leftVal};
}

/**
 * Runs a callback function when images are fully loaded.
 * @param {Object} images - Image(s) to check if loaded. Accepts an element,
 *   a NodeList, an array or a jQuery collection (7.0 line A: the callers
 *   keep passing collections during the mixed state).
 * @param {Func} callback - Function to execute when image is fully loaded.
 */
function onImagesLoaded(images, callback){
  const list = images && images.nodeType === 1 ? [images] : Array.from(images || []);
  var unloaded = list.length;

  if (unloaded === 0) {
    callback();
  }

  list.forEach(function(img){
    // Check if image is loaded
    if (img.complete && typeof img.naturalWidth !== 'undefined') {
      singleImageLoaded();
    }
    else {
      // If the above check failed, simulate loading on detached element.
      var image = new Image();
      // Still count image as loaded if it finalizes with an error. The
      // guard makes the pair idempotent (jQuery's `.one` + `.off` shape:
      // only one of the two events fires the handler).
      var settled = false;
      var handler = function() {
        if (settled) { return; }
        settled = true;
        image.removeEventListener('load', handler);
        image.removeEventListener('error', handler);
        singleImageLoaded();
      };
      image.addEventListener('load', handler);
      image.addEventListener('error', handler);
      image.src = img.getAttribute('src');
    }
  });

  function singleImageLoaded() {
    unloaded--;
    if (unloaded === 0) {
      callback();
    }
  }
}

/**
 * Thin DOM helpers for the jQuery-free plugin layer (7.0 line A, slice S1).
 * Dependency-free replacements for the jQuery conveniences the plugin layer
 * leans on, with the 7.0 semantics decisions recorded inline.
 */


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

/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/


const keyCodes = {
  9: 'TAB',
  13: 'ENTER',
  27: 'ESCAPE',
  32: 'SPACE',
  35: 'END',
  36: 'HOME',
  37: 'ARROW_LEFT',
  38: 'ARROW_UP',
  39: 'ARROW_RIGHT',
  40: 'ARROW_DOWN'
};

// P3-2: real KeyboardEvents carry `key`; map it to the command names the
// keyCode table produces. The keyCode/which fallback below stays for one
// release (legacy synthetic events and the mock's non-mapped keys).
const keyNames = {
  'Tab': 'TAB',
  'Enter': 'ENTER',
  'Escape': 'ESCAPE',
  ' ': 'SPACE',
  'End': 'END',
  'Home': 'HOME',
  'ArrowLeft': 'ARROW_LEFT',
  'ArrowUp': 'ARROW_UP',
  'ArrowRight': 'ARROW_RIGHT',
  'ArrowDown': 'ARROW_DOWN'
};

var commands = {};

// Focusable candidates, in DOM order (7.0 line A, S5: the 6.x implementation
// ran the same selector through jQuery's `.find()`).
const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';

// Functions pulled out to be referenceable from internals
// 7.0 line A terminal form: the return is the sorted native element array
// (the S5 mixed-state shape was a jQuery collection for `.eq()` callers).
function findFocusable(element) {
  if(!element) {return false; }
  // Accepts an element, a NodeList, an array or a jQuery collection.
  const roots = Array.from(element.nodeType === 1 ? [element] : element);

  const candidates = [];
  roots.forEach(root => {
    if (root && root.querySelectorAll) {
      candidates.push(...root.querySelectorAll(focusableSelector));
    }
  });

  const focusable = candidates.filter(function(el) {
    //only have visible elements and those that have a tabindex greater or equal 0
    if (!visible(el) || el.getAttribute('tabindex') < 0) { return false; }
    return true;
  });

  return focusable.sort(function( a, b ) {
    if (a.getAttribute('tabindex') === b.getAttribute('tabindex')) {
      return 0;
    }
    const aTabIndex = parseInt(a.getAttribute('tabindex'), 10),
      bTabIndex = parseInt(b.getAttribute('tabindex'), 10);
    // A missing attribute is treated the same as 0
    if (a.getAttribute('tabindex') === null && bTabIndex > 0) {
      return 1;
    }
    if (b.getAttribute('tabindex') === null && aTabIndex > 0) {
      return -1;
    }
    if (aTabIndex === 0 && bTabIndex > 0) {
      return 1;
    }
    if (bTabIndex === 0 && aTabIndex > 0) {
      return -1;
    }
    if (aTabIndex < bTabIndex) {
      return -1;
    }
    if (aTabIndex > bTabIndex) {
      return 1;
    }
  });
}

function parseKey(event) {
  var key = keyNames[event.key] || keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

  // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
  key = key.replace(/\W+/, '');

  if (event.shiftKey) key = `SHIFT_${key}`;
  if (event.ctrlKey) key = `CTRL_${key}`;
  if (event.altKey) key = `ALT_${key}`;

  // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
  key = key.replace(/_$/, '');

  return key;
}

var Keyboard = {
  keys: getKeyCodes(keyCodes),

  /**
   * Parses the (keyboard) event and returns a String that represents its key
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   * @param {Event} event - the event generated by the event handler
   * @return String key - String that represents the key pressed
   */
  parseKey: parseKey,

  /**
   * Handles the given (keyboard) event
   * @param {Event} event - the event generated by the event handler
   * @param {String} component - Foundation component's name, e.g. Slider or Reveal
   * @param {Objects} functions - collection of functions that are to be executed
   */
  handleKey(event, component, functions) {
    var commandList = commands[component],
      keyCode = this.parseKey(event),
      cmds,
      command,
      fn;

    if (!commandList) return console.warn('Component not defined!');

    // Ignore the event if it was already handled
    if (event.zfIsKeyHandled === true) return;

    // This component does not differentiate between ltr and rtl
    if (typeof commandList.ltr === 'undefined') {
        cmds = commandList; // use plain list
    } else { // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (rtl()) cmds = Object.assign({}, commandList.ltr, commandList.rtl);

        else cmds = Object.assign({}, commandList.rtl, commandList.ltr);
    }
    command = cmds[keyCode];

    fn = functions[command];
     // Execute the handler if found
    if (fn && typeof fn === 'function') {
      var returnValue = fn.apply();

      // Mark the event as "handled" to prevent future handlings
      event.zfIsKeyHandled = true;

      // Execute function when event was handled
      if (functions.handled || typeof functions.handled === 'function') {
          functions.handled(returnValue);
      }
    } else {
       // Execute function when event was not handled
      if (functions.unhandled || typeof functions.unhandled === 'function') {
          functions.unhandled();
      }
    }
  },

  /**
   * Finds all focusable elements within the given `$element`
   * @param {jQuery} $element - jQuery object to search within
   * @return {jQuery} $focusable - all focusable elements within `$element`
   */

  findFocusable: findFocusable,

  /**
   * Returns the component name name
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @return String componentName
   */

  register(componentName, cmds) {
    commands[componentName] = cmds;
  },


  // TODO9438: These references to Keyboard need to not require global. Will 'this' work in this context?
  //
  /**
   * Traps the focus in the given element.
   * The keydown listener lives on the native event layer (7.0 line A, S5);
   * real keydowns reach it while the mixed state lasts, and callers keep
   * handing in the jQuery object.
   * @param  {jQuery} $element  jQuery object to trap the foucs into.
   */
  trapFocus(element) {
    // Accepts an element or a collection (mixed state callers); the
    // focusable list is the native array terminal form.
    const el = element.nodeType === 1 ? element : element[0];
    const focusable = findFocusable(el),
        firstFocusable = focusable[0],
        lastFocusable = focusable[focusable.length - 1];

    Events.on(el, 'keydown.zf.trapfocus', function(event) {
      if (event.target === lastFocusable && parseKey(event) === 'TAB') {
        event.preventDefault();
        firstFocusable.focus();
      }
      else if (event.target === firstFocusable && parseKey(event) === 'SHIFT_TAB') {
        event.preventDefault();
        lastFocusable.focus();
      }
    });
  },
  /**
   * Releases the trapped focus from the given element.
   * @param  {jQuery} $element  jQuery object to release the focus for.
   */
  releaseFocus(element) {
    const el = element.nodeType === 1 ? element : element[0];
    Events.off(el, "keydown.zf.trapfocus");
  }
};

/*
 * Constants for easier comparing.
 * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
 */
function getKeyCodes(kcs) {
  var k = {};
  for (var kc in kcs) {
    if (kcs.hasOwnProperty(kc)) k[kcs[kc]] = kcs[kc];
  }
  return k;
}

/**
 * Motion module.
 * @module foundation.motion
 */

const initClasses   = ['mui-enter', 'mui-leave'];
const activeClasses = ['mui-enter-active', 'mui-leave-active'];

// End-event names the animation completion listens for. Upstream motion-ui
// listens for the standard 'transitionend' only, while the 6.x inlined
// variant resolved a single name through a last-match-wins feature probe
// that ends on 'webkitTransitionEnd' in Chromium. Listening to both keeps
// completion working on every engine; `finish` runs at most once.
const endEvents = ['transitionend', 'webkitTransitionEnd'];

const Motion = {
  animateIn: function(element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function(element, animation, cb) {
    animate(false, element, animation, cb);
  },

  // jQuery fx-compatible primitives (fx 方案 A): slideUp/slideDown,
  // fadeIn/fadeOut, generic per-property animate, stop/finish. Reproduces
  // the jQuery 3.7 semantics the plugin seams relied on - per-element queue
  // serialization, swing easing by default ('linear' and function easings
  // pass through, unknown names fall back to swing), duration-0 completing
  // synchronously, stop/finish jump-to-end with complete callbacks. The
  // methods take an element, a jQuery collection, a NodeList or an array
  // and animate every element in it, the complete firing once per element
  // (the collection semantics the multi-target accordion/menu calls rely
  // on).
  slideUp: function(elements, duration, complete) {
    fxEach(elements, (el) => fxSlide('up', el, duration, complete));
  },
  slideDown: function(elements, duration, complete) {
    fxEach(elements, (el) => fxSlide('down', el, duration, complete));
  },
  fadeIn: function(elements, duration, complete) {
    fxEach(elements, (el) => fxFade('in', el, duration, complete));
  },
  fadeOut: function(elements, duration, complete) {
    fxEach(elements, (el) => fxFade('out', el, duration, complete));
  },
  animate: function(elements, props, duration, easing, complete) {
    fxEach(elements, (el) => fxAnimate(el, props, duration, easing, complete));
  },
  stop: function(elements, clearQueue, jumpToEnd) {
    fxEach(elements, (el) => fxStop(el, clearQueue, jumpToEnd));
  },

  // jQuery's `:animated` check: an element with a RUNNING fx animation
  // (queued-but-not-started ones do not count, like jQuery's timers).
  isAnimating: function(element) {
    const el = toElement(element);
    if (!el) { return false; }
    const st = fxTable.get(el);
    return !!(st && st.running);
  },
  finish: function(elements) {
    fxEach(elements, (el) => fxFinish(el));
  }
};

// Unwraps the mixed-state input (jQuery collection or plain element) to the
// animation target, mirroring `toElement` in foundation.core.utils.
function toElement(obj) {
  // nodeType marks a real node: never unwrap it, even when it is itself
  // array-like (HTMLSelectElement exposes its first option as [0]).
  return obj && obj.nodeType === undefined && obj[0] !== undefined ? obj[0] : obj;
}

// Native stand-ins for jQuery's `.show()`/`.hide()`, after the S6 Reveal
// `_show` precedent: show clears an inline display override and falls back
// to `block` when the stylesheet still hides the element (what jQuery's
// getDefaultDisplay resolved to for everything animated here), hide sets
// the inline `none` jQuery would have written.
function show(el) {
  el.style.display = '';
  if (window.getComputedStyle(el).display === 'none') {
    el.style.display = 'block';
  }
}

function hide(el) {
  el.style.display = 'none';
}

// v6 fired 'finished.zf.animate' twice per Move (bubbling `trigger` plus the
// element-local `triggerHandler`), so persistent element-local handlers ran
// on every pass. The 7.0 flip dispatches ONE real, bubbling CustomEvent:
// listeners on the element and its ancestors receive it exactly once, and
// still-on-jQuery listeners keep receiving it through the S3/S4 white
// absorption (extra params are on `event.originalEvent.detail` for them).
function fireFinished(elem) {
  // S15 (detail-to-Element ruling): the extra parameter is the animation
  // target element, no longer the jQuery collection Move() was called with.
  Events.trigger(toElement(elem), 'finished.zf.animate', [toElement(elem)]);
}

function Move(duration, elem, fn){
  var anim, prog, start = null;

  if (duration === 0) {
    fn.apply(elem);
    fireFinished(elem);
    return;
  }

  function move(ts){
    if(!start) start = ts;
    prog = ts - start;
    fn.apply(elem);

    if(prog < duration){ anim = window.requestAnimationFrame(move, elem); }
    else {
      window.cancelAnimationFrame(anim);
      fireFinished(elem);
    }
  }
  anim = window.requestAnimationFrame(move);
}

/**
 * Animates an element in or out using a CSS transition class.
 * The class lifecycle replicates motion-ui's observable behavior (the v6
 * util inlined it): reset, add the animation class with transitions
 * disabled, then over two animation frames add the init class (showing the
 * element for in animations), force a reflow, release the transition and add
 * the active class. Completion waits for a transition end event, then hides
 * (out animations), resets, and runs the callback.
 * @function
 * @private
 * @param {Boolean} isIn - Defines if the animation is in or out.
 * @param {Object} element - jQuery or HTML object to animate.
 * @param {String} animation - CSS class to use.
 * @param {Function} cb - Callback to run when animation is finished.
 */
function animate(isIn, element, animation, cb) {
  // The mixed-state input is unwrapped to the animation target; the plugin
  // layer now hands in native elements (S15) while the not-yet-migrated
  // callers still pass jQuery collections.
  const el = toElement(element);

  if (!el || el.nodeType !== 1) return;

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];
  // One completion per animate() call: both end-event names are armed below.
  let finished = false;

  // Set up the animation
  reset();

  addClass(el, animation);
  el.style.transition = 'none';

  requestAnimationFrame(() => {
    addClass(el, initClass);
    if (isIn) show(el);
  });

  // Start the animation
  requestAnimationFrame(() => {
    // will trigger the browser to synchronously calculate the style and layout
    // also called reflow or layout thrashing
    // see https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    el.offsetWidth;
    el.style.transition = '';
    addClass(el, activeClass);
  });

  // Clean up the animation when it finishes
  endEvents.forEach(endEvent => Events.one(el, endEvent, finish));

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (finished) return;
    finished = true;
    if (!isIn) hide(el);
    reset();
    if (cb) cb.apply(el);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    el.style.transitionDuration = 0;
    removeClass(el, initClass, activeClass, animation);
  }

  // jQuery's class methods ignore empty tokens (callers may pass '' as the
  // animation class); classList throws on them.
  function addClass(target, token) {
    if (token) { target.classList.add(token); }
  }
  function removeClass(target, ...tokens) {
    tokens.forEach(token => { if (token) { target.classList.remove(token); } });
  }
}


// ---------------------------------------------------------------------------
// jQuery fx-compatible tween engine (7.0 line A, fx 方案 A).
//
// Replaces the jQuery fx calls on the plugin seams. What is reproduced:
// - one fx queue per element: animations serialize, complete callbacks run
//   in queue order, finish()/stop(true) can jump them;
// - swing easing 0.5 - cos(p*PI)/2 as the default (`linear` and function
//   easings pass through, unknown names animate as swing - jQuery's
//   `_default`);
// - duration 0 completes synchronously in the calling tick (the coarse
//   suites' slideSpeed 0 contract);
// - slideUp/slideDown tween the six properties jQuery's genFx builds for
//   slide (height, padding/margin top and bottom, opacity) with
//   border-box aware height writes, and leave the same inline residue:
//   slideUp ends on inline display:none with the tweened props cleared,
//   slideDown ends shown with them cleared;
// - fadeOut remembers the display for the next fadeIn (jQuery's
//   data-priv display save), fadeIn ends with the opacity inline removed;
// - scrollTop on html/body tweens the page through window.scrollTo (the
//   S7 SmoothScroll equivalence: one viewport tween, callback once - the
//   6.x collection form animated html AND body, firing the callback twice,
//   ledger ②).
// ---------------------------------------------------------------------------

const SLIDE_PROPS = ['height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'opacity'];

// Element / jQuery collection / NodeList / array -> element list (jQuery
// collection semantics: an fx call animates every element it was given).
function fxEach(obj, fn) {
  if (!obj) { return; }
  const list = (obj.nodeType === undefined && obj.length !== undefined)
    ? Array.from(obj)
    : [obj];
  list.forEach(fn);
}

function resolveFxEasing(easing) {
  if (typeof easing === 'function') { return easing; }
  if (easing === 'linear') { return (p) => p; }
  return (p) => 0.5 - Math.cos(p * Math.PI) / 2;
}

// getDefaultDisplay, jQuery shape: a detached probe of the same tag measured
// in the document, cached. Falls back to 'block' for display:none by UA
// stylesheet (e.g. <script>), which is what jQuery's own fallback did.
const defaultDisplayCache = {};
function defaultDisplay(tag) {
  if (defaultDisplayCache[tag]) { return defaultDisplayCache[tag]; }
  const probe = document.createElement(tag);
  document.body.appendChild(probe);
  let display = window.getComputedStyle(probe).display;
  document.body.removeChild(probe);
  if (!display || display === 'none') { display = 'block'; }
  defaultDisplayCache[tag] = display;
  return display;
}

// The inline display jQuery saved in its data-priv when hiding, so a later
// show restores it (WeakMap: cleared with the element, like data-priv).
const savedDisplay = new WeakMap();

// Per-element fx state: the running animation plus the queued ones.
const fxTable = new WeakMap();

function fxState(el) {
  let st = fxTable.get(el);
  if (!st) {
    st = {queue: [], running: null};
    fxTable.set(el, st);
  }
  return st;
}

// One animation: prepare() runs once when the animation starts (jQuery
// measured and set overflow there, not at enqueue time), paint() renders an
// eased progress (0..1), complete() runs the end-of-animation state
// (hide/show residue) and then the caller's callback. `jump` prepares,
// paints 1 and completes (stop/finish semantics).
function enqueueFx(el, duration, easing, prepare, paint, complete) {
  const st = fxState(el);
  const ease = resolveFxEasing(easing);

  const anim = {
    rafId: null,
    origin: null,
    prepare: prepare || null,
    complete: complete || null,
    cancel() {
      if (anim.rafId !== null) {
        window.cancelAnimationFrame(anim.rafId);
        anim.rafId = null;
      }
    },
    jump() {
      anim.cancel();
      if (anim.prepare) { anim.prepare(); }
      paint(1);
      anim.finish();
    },
    finish() {
      st.running = null;
      anim.rafId = null;
      // jQuery called the complete with the element as `this`
      if (anim.complete) { anim.complete.call(el); }
      runNextFx(el);
    },
    start() {
      // prepare() may signal `true`: animating toward the element's current
      // state completes synchronously (jQuery's showHide skip), no timer.
      const skip = anim.prepare ? anim.prepare() : false;
      if (duration === 0 || skip) {
        // jQuery's duration-0 dequeue: end state + complete, same tick.
        paint(1);
        anim.finish();
        return;
      }
      const step = function(ts) {
        if (anim.origin === null) { anim.origin = ts; }
        const progress = Math.min((ts - anim.origin) / duration, 1);
        paint(ease(progress));
        if (progress < 1) {
          anim.rafId = window.requestAnimationFrame(step);
        } else {
          anim.rafId = null;
          anim.finish();
        }
      };
      anim.rafId = window.requestAnimationFrame(step);
    }
  };

  st.queue.push(anim);
  runNextFx(el);
}

function runNextFx(el) {
  const st = fxState(el);
  if (st.running || !st.queue.length) { return; }
  st.running = st.queue.shift();
  st.running.start();
}

// jQuery .stop([clearQueue][, jumpToEnd]): the running animation stops where
// it stands (jumpToEnd paints the end first), its complete fires only when
// jumping; clearQueue drops the pending ones.
function fxStop(el, clearQueue, jumpToEnd) {
  const st = fxState(el);
  if (st.queue.length && clearQueue) { st.queue.length = 0; }
  const anim = st.running;
  if (!anim) { return; }
  anim.cancel();
  if (jumpToEnd) {
    anim.jump();
  } else {
    st.running = null;
    runNextFx(el);
  }
}

// jQuery .finish(): everything queued and running jumps to its end state,
// each complete fires, the queue empties. jump() fires completes
// synchronously, which starts the next queued animation (runNextFx), so the
// queue is snapshotted first and whatever finish() left queued (animations
// that just started) is dropped from the pending set - they already jumped.
function fxFinish(el) {
  const st = fxState(el);
  const pending = st.queue.slice();
  st.queue.length = 0;
  if (st.running) {
    st.running.jump();
  }
  // jump()'s completion may have started one of the pending ones (it now
  // runs for real) - only jump the rest.
  pending.forEach(function(anim) {
    if (st.queue.indexOf(anim) === -1) { anim.jump(); }
  });
}

// Page-scroll tween target: html/body scrollTop goes through the viewport.
function isScrollRoot(el) {
  return el === document.documentElement || el === document.body;
}

function fxAnimate(el, props, duration, easing, complete) {
  el = toElement(el);
  const entries = Object.keys(props).map((key) => {
    const camel = key === 'scrolltop' ? 'scrollTop' : key.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    const to = Number(props[key]);
    const from = camel === 'scrollTop'
      ? (isScrollRoot(el) ? window.pageYOffset : el.scrollTop)
      : parseFloat(window.getComputedStyle(el)[camel]);
    return {camel, from, to};
  });

  const paint = function(p) {
    entries.forEach((entry) => {
      const value = entry.from + (entry.to - entry.from) * p;
      if (entry.camel === 'scrollTop') {
        if (isScrollRoot(el)) {
          window.scrollTo(0, Math.round(value));
        } else {
          el.scrollTop = value;
        }
      } else if (entry.camel === 'opacity') {
        el.style.opacity = value;
      } else {
        el.style[entry.camel] = value + 'px';
      }
    });
  };

  enqueueFx(el, duration, easing, null, paint, complete);
}

function measureSlide(el) {
  const cs = window.getComputedStyle(el);
  const values = {};
  SLIDE_PROPS.forEach((prop) => {
    values[prop] = parseFloat(cs[prop]);
    if (isNaN(values[prop])) { values[prop] = prop === 'opacity' ? 1 : 0; }
  });
  return values;
}

function paintSlide(el, values) {
  // Foundation sets border-box globally: an inline height must include the
  // tweened paddings or the pane would shrink by them twice.
  const borderBox = window.getComputedStyle(el).boxSizing !== 'content-box';
  el.style.height = (borderBox ? values.height + values.paddingTop + values.paddingBottom : values.height) + 'px';
  el.style.paddingTop = values.paddingTop + 'px';
  el.style.paddingBottom = values.paddingBottom + 'px';
  el.style.marginTop = values.marginTop + 'px';
  el.style.marginBottom = values.marginBottom + 'px';
  el.style.opacity = values.opacity;
}

function clearSlideInline(el, overflowInline) {
  SLIDE_PROPS.forEach((prop) => { el.style[prop] = ''; });
  el.style.overflow = overflowInline || '';
}

function fxSlide(direction, element, duration, complete) {
  const el = toElement(element);

  if (!el || !el.isConnected) {
    // jQuery animations on detached elements measured 0 and completed; the
    // call sites never pass one, complete keeps firing for queue order.
    enqueueFx(el, 0, null, null, function() {}, complete);
    return;
  }

  const overflowInline = el.style.overflow;
  // jQuery evaluated the hidden/visible branch when the animation STARTED,
  // not when it was enqueued - a queued slideUp hides the element a later
  // slideDown was enqueued against. prepare() is that start point.
  let mode; // 'up' | 'down' | 'noop'
  let from, to;

  const prepare = function() {
    const hidden = window.getComputedStyle(el).display === 'none';
    if (direction === 'down') {
      mode = hidden ? 'down' : 'noop';
      if (mode === 'noop') { return true; }
      if (mode === 'down') {
        el.style.display = savedDisplay.get(el) || defaultDisplay(el.tagName);
        el.style.overflow = 'hidden';
        clearSlideInline(el, overflowInline);
        to = measureSlide(el);
        from = Object.assign({}, to, {height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, opacity: 0});
      }
    } else {
      mode = hidden ? 'noop' : 'up';
      if (mode === 'noop') { return true; }
      from = measureSlide(el);
      el.style.overflow = 'hidden';
    }
  };

  const paint = function(p) {
    if (mode === 'noop') { return; }
    const values = {};
    SLIDE_PROPS.forEach((prop) => {
      if (mode === 'up') {
        values[prop] = from[prop] * (1 - p);
      } else {
        values[prop] = from[prop] + (to[prop] - from[prop]) * p;
      }
    });
    paintSlide(el, values);
  };

  const done = function() {
    if (mode === 'noop') {
      // animating toward the current state: nothing touched, complete still
      // fires (jQuery ran and completed the animation).
      if (complete) { complete(); }
      return;
    }
    if (mode === 'up') {
      savedDisplay.set(el, el.style.display);
      el.style.display = 'none';
    }
    clearSlideInline(el, overflowInline);
    if (complete) { complete(); }
  };

  enqueueFx(el, duration, null, prepare, paint, done);
}

function fxFade(direction, element, duration, complete) {
  const el = toElement(element);

  if (!el || !el.isConnected) {
    enqueueFx(el, 0, null, null, function() {}, complete);
    return;
  }

  let mode; // 'in' | 'out' | 'noop'
  let from, to;

  const prepare = function() {
    const hidden = window.getComputedStyle(el).display === 'none';
    if (direction === 'in') {
      mode = hidden ? 'in' : 'noop';
      if (mode === 'noop') { return true; }
      if (mode === 'in') {
        el.style.display = savedDisplay.get(el) || defaultDisplay(el.tagName);
        const inlineOpacity = el.style.opacity;
        from = 0;
        to = inlineOpacity !== '' ? parseFloat(inlineOpacity) : 1;
      }
    } else {
      mode = hidden ? 'noop' : 'out';
      if (mode === 'noop') { return true; }
      from = parseFloat(window.getComputedStyle(el).opacity);
      if (isNaN(from)) { from = 1; }
      to = 0;
    }
  };

  const paint = function(p) {
    if (mode === 'noop') { return; }
    el.style.opacity = from + (to - from) * p;
  };

  const done = function() {
    if (mode === 'noop') {
      if (complete) { complete(); }
      return;
    }
    if (mode === 'out') {
      savedDisplay.set(el, el.style.display);
      el.style.display = 'none';
    }
    el.style.opacity = '';
    if (complete) { complete(); }
  };

  enqueueFx(el, duration, null, prepare, paint, done);
}

// S13 (7.0 line A): the Nest util is jQuery-free - the DOM reads/writes
// inside Feather and Burn moved from jQuery traversal to the element's own
// DOM API. The `menu` parameter keeps its historical shape - the jQuery
// collections the three menu plugins pass in - and a plain element also
// works (toMenu unwraps it), because the collection reads inside the callers
// were the only jQuery-form requirement.
function toMenu(menu) {
  // nodeType marks a real node: never unwrap it, even when it is itself
  // array-like (HTMLSelectElement exposes its first option as [0]).
  return menu && menu.nodeType === undefined && menu[0] !== undefined && menu[0] !== null ? menu[0] : menu;
}

const Nest = {
  Feather(menu, type = 'zf') {
    menu = toMenu(menu);
    menu.setAttribute('role', 'menubar');
    menu.querySelectorAll('a').forEach(function(anchor) {
      anchor.setAttribute('role', 'menuitem');
    });

    const subMenuClass = `is-${type}-submenu`,
        subItemClass = `${subMenuClass}-item`,
        hasSubClass = `${subMenuClass}-parent`,
        applyAria = (type !== 'accordion'); // Accordions handle their own ARIA attriutes.

    const items = menu.querySelectorAll('li');
    items.forEach(function(item) {
      item.setAttribute('role', 'none');
      const sub = item.querySelector(':scope > ul');

      if (sub) {
        // data-submenu is tagged in this pass; the second pass below sees it

        item.classList.add(hasSubClass);
        if(applyAria) {
          const firstItem = item.querySelector(':scope > a');
          firstItem.setAttribute('aria-haspopup', 'true');
          firstItem.setAttribute('aria-label', firstItem.getAttribute('aria-label') || firstItem.textContent);
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if(type === 'drilldown') {
            item.setAttribute('aria-expanded', 'false');
          }
        }
        sub.classList.add('submenu', subMenuClass);
        sub.setAttribute('data-submenu', '');
        sub.setAttribute('role', 'menubar');
        if(type === 'drilldown') {
          sub.setAttribute('aria-hidden', 'true');
        }
      }

    });
    // Second pass over the SAME item list: each li whose parent ended up
    // tagged with [data-submenu] during the first pass gets the submenu-item
    // classes (the 6.x check read the state after the sub was tagged).
    items.forEach(function(item) {
      if (item.parentElement && item.parentElement.closest('[data-submenu]')) {
        item.classList.add('is-submenu-item', subItemClass);
      }
    });

    return;
  },

  Burn(menu, type) {
    menu = toMenu(menu);
    const subMenuClass = `is-${type}-submenu`,
        subItemClass = `${subMenuClass}-item`,
        hasSubClass = `${subMenuClass}-parent`;

    // `>li, > li > ul, .menu, .menu > li, [data-submenu] > li` from the
    // jQuery find(): the :scope-prefixed parts stay root-relative, the
    // descendant parts search the whole menu.
    const selector = [
      ':scope > li',
      ':scope > li > ul',
      '.menu',
      '.menu > li',
      '[data-submenu] > li'
    ].join(',');

    menu.querySelectorAll(selector).forEach(function(node) {
      node.classList.remove(subMenuClass, subItemClass, hasSubClass, 'is-submenu-item', 'submenu', 'is-active');
      node.removeAttribute('data-submenu');
      node.style.display = '';
    });
  }
};

function Timer(element, options, cb, nameSpace) {
  // 7.0 line A terminal form: the element (Timer's only consumer, Orbit,
  // passes the plain element). The paused bookkeeping rode jQuery's data
  // cache (DOM-invisible); the expando property keeps it invisible, and the
  // timer events dispatch through the native layer (the orbit-native suite
  // pins them as jQuery-synthesized under the old engine; the flip makes
  // them real bubbling events - white absorption keeps jQuery listeners
  // hearing them).
  // 7.0 line A, slice S2: the event namespace is passed explicitly. v6
  // inferred it from the element's FIRST jQuery data key, which coupled the
  // event names to jQuery data key order and would break now that core
  // stopped writing zfPlugin there. The probe is retired since S10 - Orbit,
  // the only Timer consumer, passes 'orbit' explicitly - and the default is
  // the flat 'timer' namespace.
  nameSpace = nameSpace || 'timer';

  var _this = this,
      duration = options.duration,//options is an object for easily adding features later.
      remain = -1,
      start,
      timer;

  this.isPaused = false;

  this.restart = function() {
    remain = -1;
    clearTimeout(timer);
    this.start();
  };

  this.start = function() {
    this.isPaused = false;
    // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
    clearTimeout(timer);
    remain = remain <= 0 ? duration : remain;
    element.zfTimerPaused = false;
    start = Date.now();
    timer = setTimeout(function(){
      if(options.infinite){
        _this.restart();//rerun the timer.
      }
      if (cb && typeof cb === 'function') { cb(); }
    }, remain);
    Events.trigger(element, `timerstart.zf.${nameSpace}`);
  };

  this.pause = function() {
    this.isPaused = true;
    //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
    clearTimeout(timer);
    element.zfTimerPaused = true;
    var end = Date.now();
    remain = remain - (end - start);
    Events.trigger(element, `timerpaused.zf.${nameSpace}`);
  };
}

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************


// S13 (7.0 line A): the synthesizers produce real, bubbling CustomEvents
// through the Events layer instead of jQuery triggers. The 6.x chain armed
// itself per element through the `$.event.special` setup hooks; the native
// chain arms ONCE on the document (Touch.init) and dispatches each synthetic
// event on the touched element, so it bubbles to the same ancestors the
// jQuery synthetic walk reached. Extra parameters ride the event detail in
// the 6.x shapes: 'swipe' carries (touchmoveEvent, direction), the
// directional swipe<dir> and 'tap' carry their source touch event. Native
// handlers receive them as trailing arguments; jQuery listeners of the
// mixed state read them from event.originalEvent.detail.
var Touch = {};

var startPosX,
    startTime,
    elapsedTime,
    startEvent,
    isMoving = false,
    didMoved = false,
    touchTarget = null;

function onTouchEnd(e) {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);

  // If the touch did not move, consider it as a "tap"
  if (!didMoved) {
    Events.trigger(touchTarget || document.body, 'tap', startEvent || e);
  }

  startEvent = null;
  isMoving = false;
  didMoved = false;
  touchTarget = null;
}

function onTouchMove(e) {
  if (true === Touch.spotSwipe.preventDefault) { e.preventDefault(); }

  if(isMoving) {
    var x = e.touches[0].pageX;
    // var y = e.touches[0].pageY;
    var dx = startPosX - x;
    // var dy = startPosY - y;
    var dir;
    didMoved = true;
    elapsedTime = new Date().getTime() - startTime;
    if(Math.abs(dx) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
      dir = dx > 0 ? 'left' : 'right';
    }
    // else if(Math.abs(dy) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
    //   dir = dy > 0 ? 'down' : 'up';
    // }
    if(dir) {
      e.preventDefault();
      // the reset in onTouchEnd clears the module state; the swipe still
      // dispatches on the element the touch started on
      var swipeTarget = touchTarget;
      onTouchEnd.apply(this, arguments);
      Events.trigger(swipeTarget, 'swipe', [e, dir]);
      Events.trigger(swipeTarget, `swipe${dir}`, e);
    }
  }

}

function onTouchStart(e) {

  if (e.touches.length === 1) {
    touchTarget = e.target;
    startPosX = e.touches[0].pageX;
    startEvent = e;
    isMoving = true;
    didMoved = false;
    startTime = new Date().getTime();
    document.addEventListener('touchmove', onTouchMove, { passive : true === Touch.spotSwipe.preventDefault });
    document.addEventListener('touchend', onTouchEnd, false);
  }
}

function handleTouch(event) {
  var touches = event.changedTouches,
      first = touches[0],
      eventTypes = {
        touchstart: 'mousedown',
        touchmove: 'mousemove',
        touchend: 'mouseup'
      },
      type = eventTypes[event.type];

  if('MouseEvent' in window && typeof window.MouseEvent === 'function') {
    first.target.dispatchEvent(new window.MouseEvent(type, {
      'bubbles': true,
      'cancelable': true,
      'screenX': first.screenX,
      'screenY': first.screenY,
      'clientX': first.clientX,
      'clientY': first.clientY
    }));
  }
}

class SpotSwipe {
  constructor() {
    this.version = '1.0.0';
    this.enabled = 'ontouchstart' in document.documentElement;
    this.preventDefault = false;
    this.moveThreshold = 75;
    this.timeThreshold = 200;
    // The 6.x `_init()` registered the synthesizers through `$.event.special`
    // setup hooks, which jQuery invoked for every element a 'tap'/'swipe*'
    // listener was bound to. The native chain arms once on the document (see
    // Touch.init), so there is nothing per-element to set up anymore.
  }
}

/****************************************************
 * As far as I can tell, both setupSpotSwipe and    *
 * setupTouchHandler should be idempotent,          *
 * because they directly replace functions &        *
 * values, and do not add event handlers directly.  *
 ****************************************************/

Touch.setupSpotSwipe = function() {
  Touch.spotSwipe = new SpotSwipe();
};

/****************************************************
 * Method for adding pseudo drag events to elements *
 ***************************************************/
Touch.setupTouchHandler = function() {
  // Native form of `$.fn.addTouch`: the feed replays touch input as mouse
  // events dispatched on the touch origin - real events, which reach the
  // native listeners directly and still-on-jQuery ones through the
  // real-event pass-through.
  Touch.addTouch = function(element) {
    if (!element || !element.addEventListener) { return; }
    element.addEventListener('touchstart', handleTouch, false);
    element.addEventListener('touchmove', handleTouch, false);
    element.addEventListener('touchend', handleTouch, false);
    element.addEventListener('touchcancel', handleTouch, false);
  };
};

Touch.init = function () {
  if(typeof(Touch.spotSwipe) === 'undefined') {
    Touch.setupSpotSwipe();
    Touch.setupTouchHandler();
    // One document-level touchstart arm, replacing the per-element
    // `$.event.special` setups: every tap/swipe below is dispatched on the
    // touched element and bubbles, so the ancestor bindings (body tap
    // handlers) hear it like the jQuery synthetic walk delivered them.
    document.addEventListener('touchstart', onTouchStart, { passive : true });
  }
};

// S13 (7.0 line A): the window-level listeners (resize/scroll debounce,
// closeme broadcast) run on the native event layer. The closeme producers
// (reveal/dropdown/tooltip) fire real events through Events.trigger in the
// same slice, and the listener is registered per plugin name so the name is
// an explicit parameter - the 6.x derivation from the jQuery event
// namespace does not exist on real events. Still-on-jQuery producers (third
// parties) keep reaching the element-level dispatchers through real-event
// pass-through; a jQuery-synthesized window event can no longer drive the
// window-level listeners (jQuery triggers produce no real events).
// dispatchLocal keeps its jQuery half until the wrap-up slice deletes it
// (S4 clause), and closeableListener's fadeOut fx chain stays jQuery-side
// (same ledger as the accordion fx).

const triggers = (el, type) => {
  (el.getAttribute(`data-${type}`) || '').split(' ').forEach(id => {
    let target = document.getElementById(id);
    if (!target) { return; }
    // Historical forms: 'close' bubbles (so it can close a parent component),
    // 'open' and 'toggle' stay element-local.
    if (type === 'close') {
      // One real, bubbling event: reaches native listeners and the document
      // closable delegation, plus the jQuery listeners of un-migrated plugins
      // (white absorption).
      Events.trigger(target, `${type}.zf.trigger`, [el]);
    } else {
      dispatchLocal(target, `${type}.zf.trigger`, el);
    }
  });
};

// Element-local dispatch (S4 ruling, terminal form): the last mixed-state
// consumers are gone, so the dual transport collapses to the native
// triggerHandler alone - a real NON-BUBBLING event (the shared transport
// between the per-bundle Events tables; same-element listeners only, the
// 6.x no-bubble shape). Still-on-jQuery third-party listeners no longer
// receive the element-local zf.trigger dispatches - 7.0 change, ledger.
const dispatchLocal = (target, type, param) => {
  Events.triggerHandler(target, type, [param]);
};

var Triggers = {
  Listeners: {
    Basic: {},
    Global: {}
  },
  Initializers: {}
};

Triggers.Listeners.Basic  = {
  openListener: function() {
    triggers(this, 'open');
  },
  closeListener: function() {
    let id = this.getAttribute('data-close');
    if (id) {
      triggers(this, 'close');
    }
    else {
      Events.trigger(this, 'close.zf.trigger');
    }
  },
  toggleListener: function() {
    let id = this.getAttribute('data-toggle');
    if (id) {
      triggers(this, 'toggle');
    } else {
      Events.trigger(this, 'toggle.zf.trigger');
    }
  },
  closeableListener: function(e) {
    let animation = this.getAttribute('data-closable');

    // Only close the first closable element. See https://git.io/zf-7833
    e.stopPropagation();

    if(animation !== ''){
      Motion.animateOut(this, animation, () => {
        Events.trigger(this, 'closed.zf');
      });
    }else {
      // fx 方案 A: the plain fadeOut on the native primitive (jQuery's fx
      // default duration, 400ms). The closed.zf production keeps its jQuery
      // transport (the S4 dual-transport seam owns it).
      Motion.fadeOut(this, 400);
      // 7.0: the closed production joins the native layer - a real,
      // bubbling event (6.x delivered a jQuery-synthetic one to jQuery
      // listeners only; both shapes reach jQuery listeners now).
      Events.trigger(this, 'closed.zf');
    }
  },
  toggleFocusListener: function() {
    let id = this.getAttribute('data-toggle-focus');
    let target = document.getElementById(id);
    if (target) {
      dispatchLocal(target, 'toggle.zf.trigger', this);
    }
  }
};

// Elements with [data-open] will reveal a plugin that supports it when clicked.
// The former off-then-on dup guard is replaced by module-level flags: once an
// Initializer has installed its delegation, repeated calls (Foundation re-init,
// third parties, IHearYou) are no-ops, so one click still yields one dispatch.
let simpleListenerFlags = {};

function delegateSimple(type, types, selector, listener) {
  if (simpleListenerFlags[type]) { return; }
  simpleListenerFlags[type] = true;
  Events.delegate(document, types, selector, listener);
}

Triggers.Initializers.addOpenListener = () => {
  delegateSimple('open', 'click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
};

// Elements with [data-close] will close a plugin that supports it when clicked.
// If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
Triggers.Initializers.addCloseListener = () => {
  delegateSimple('close', 'click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
};

// Elements with [data-toggle] will toggle a plugin that supports it when clicked.
Triggers.Initializers.addToggleListener = () => {
  delegateSimple('toggle', 'click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
};

// Elements with [data-closable] will respond to close.zf.trigger events.
Triggers.Initializers.addCloseableListener = () => {
  delegateSimple('closeable', 'close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
};

// Elements with [data-toggle-focus] will respond to coming in and out of focus
Triggers.Initializers.addToggleFocusListener = () => {
  delegateSimple('toggleFocus', 'focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
};



// More Global/complex listeners and triggers
Triggers.Listeners.Global  = {
  closeMeListener: function(e, pluginId, pluginName){
    // S13: the plugin name is an explicit parameter - the listener is
    // registered once per name (the 6.x single jQuery listener derived it
    // from the event namespace, which real events do not carry) - and the
    // id rides the event detail, where Events.trigger puts the extra
    // parameters (the 6.x second trigger parameter).
    let plugin = pluginName || (e.namespace ? e.namespace.split('.')[0] : 'dropdown');
    let plugins = document.querySelectorAll(`[data-${plugin}]`);

    for (let i = 0; i < plugins.length; i++) {
      let node = plugins[i];
      if (node.getAttribute('data-yeti-box') !== `${pluginId}`) {
        // Native broadcast: reaches the plugin's own listeners whether they
        // are already native (Events.on) or still jQuery (real-event
        // pass-through). The forwarded parameter is already the final-form
        // native element.
        Events.trigger(node, 'close.zf.trigger', [node]);
      }
    }
  }
};

// Global, parses whole document.
Triggers.Initializers.addClosemeListener = function(pluginName) {
  var yetiBoxes = document.querySelectorAll('[data-yeti-box]'),
      plugNames = ['dropdown', 'tooltip', 'reveal'];

  if(pluginName){
    if(typeof pluginName === 'string'){
      plugNames.push(pluginName);
    }else if(typeof pluginName === 'object' && typeof pluginName[0] === 'string'){
      plugNames = plugNames.concat(pluginName);
    }else {
      console.error('Plugin names must be strings');
    }
  }
  if(yetiBoxes.length){
    // Native side (S13): the producers below fire real events through the
    // Events layer in the same slice. One listener per name keeps the name
    // explicit, and the 6.x off-then-on shape is kept so every arm call
    // leaves exactly one fresh listener set behind (self-healing: a later
    // initializer call rebuilds the window listeners whatever happened to
    // the previous ones).
    let listeners = plugNames.map((name) => `closeme.zf.${name}`).join(' ');
    Events.off(window, listeners);
    plugNames.forEach((name) => {
      Events.on(window, `closeme.zf.${name}`, function(e, pluginId) {
        Triggers.Listeners.Global.closeMeListener(e, pluginId, name);
      });
    });
  }
};

function debounceGlobalListener(debounce, trigger, listener) {
  let timer;
  // Native side (S13): real resize/scroll events reach the listener through
  // the Events layer.
  Events.on(window, trigger, function() {
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(listener, debounce || 10); //default time to emit scroll event
  });
}

Triggers.Initializers.addResizeListener = function(debounce){
  // Snapshot at registration time, as before: elements added later receive
  // nothing (6.x limitation, kept by decision - a ResizeObserver rework is a
  // separate, behavior-changing slice).
  let nodes = document.querySelectorAll('[data-resize]');
  if(nodes.length){
    debounceGlobalListener(debounce, 'resize.zf.trigger', function() {
      for (let i = 0; i < nodes.length; i++) {
        Events.trigger(nodes[i], 'resizeme.zf.trigger', [nodes[i]]);
      }
    });
  }
};

Triggers.Initializers.addScrollListener = function(debounce){
  let nodes = document.querySelectorAll('[data-scroll]');
  if(nodes.length){
    debounceGlobalListener(debounce, 'scroll.zf.trigger', function() {
      for (let i = 0; i < nodes.length; i++) {
        Events.trigger(nodes[i], 'scrollme.zf.trigger', [nodes[i], window.pageYOffset]);
      }
    });
  }
};

Triggers.Initializers.addSimpleListeners = function() {
  Triggers.Initializers.addOpenListener();
  Triggers.Initializers.addCloseListener();
  Triggers.Initializers.addToggleListener();
  Triggers.Initializers.addCloseableListener();
  Triggers.Initializers.addToggleFocusListener();
};

Triggers.Initializers.addGlobalListeners = function() {
  // The MutationObserver-based mutation listener is gone (S4): resize/scroll
  // dispatch to their elements directly and no 'data-events' attribute is
  // written anymore. 'mutateme.zf.trigger' is fired by the plugin causing the
  // mutation (Toggler) or by the interacting plugin (Tabs, ResponsiveToggle).
  Triggers.Initializers.addResizeListener(250);
  Triggers.Initializers.addScrollListener();
  Triggers.Initializers.addClosemeListener();
};


Triggers.init = function (Foundation) {
  // 7.0: arm at DOMContentLoaded (or immediately once the DOM is parsed)
  // instead of window load. A stalled third-party resource - an embedded
  // video iframe that hangs without erroring - would otherwise leave every
  // [data-open]/[data-close]/[data-toggle] interaction dead until it gives
  // up, with nothing in the console. Arming at DOM-ready is safe for the
  // delegation (the document-level listeners resolve targets at event
  // time), and the initial Foundation.init() reflow completes before
  // DOMContentLoaded fires, so the closeme yeti-box snapshot still sees
  // the full plugin set.
  //
  // The armed flag lives on window, not in module state: the docs layout
  // loads the foundation.js monolith next to the per-plugin chain, and
  // every copy of this module used to arm its own delegation set - one
  // click then ran toggle eight times, which nets to "closed" for every
  // open/close style interaction (dropdown, responsive toggle).
  const arm = function () {
    if (window.zfTriggersArmed !== true) {
      Triggers.Initializers.addSimpleListeners();
      Triggers.Initializers.addGlobalListeners();
      window.zfTriggersArmed = true;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arm);
  } else {
    arm();
  }

  if(Foundation) {
    Foundation.Triggers = Triggers;
    // Legacy included to be backwards compatible for now.
    Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
  }
};

// Abstract class for providing lifecycle hooks. Expect plugins to define AT LEAST
// {function} _setup (replaces previous constructor),
// {function} _destroy (replaces previous destroy)
//
// 7.0 line A, slice S2: instance storage moved from the `zfPlugin` jQuery data
// entry to the Registry (WeakMap).
// 7.0 line A, slice S15: the base accepts the native element the 7.0
// constructor contract carries as well as the jQuery collection the mixed
// state still feeds it (core reflow), and the `init.zf`/`destroyed.zf`
// obligation events go through the native event layer as real, bubbling
// events - the still-on-jQuery listeners keep receiving them (white
// absorption), so the obligation is unchanged for every consumer shape.
class Plugin {

  constructor(element, options) {
    this._setup(element, options);
    var pluginName = getPluginName(this);
    this.uuid = GetYoDigits(6, pluginName);

    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    if(!el.getAttribute(`data-${pluginName}`)){ el.setAttribute(`data-${pluginName}`, this.uuid); }
    if(el && !Registry.has(el)){ Registry.setInstance(el, this); }
    /**
     * Fires when the plugin has initialized.
     * @event Plugin#init
     */
    Events.trigger(el, `init.zf.${pluginName}`);
  }

  destroy() {
    this._destroy();
    var pluginName = getPluginName(this);
    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    el.removeAttribute(`data-${pluginName}`);
    if(el){ Registry.removeInstance(el); }
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    Events.trigger(el, `destroyed.zf.${pluginName}`);
    for(var prop in this){
      if (this.hasOwnProperty(prop)) {
        this[prop] = null; //clean up script to prep for garbage collection.
      }
    }
  }
}

// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getPluginName(obj) {
  return hyphenate(obj.className);
}

/**
 * Abide module.
 * @module foundation.abide
 */

// jQuery `.data('abide-describedby')` stand-in (7.0 line A, S12): a module
// side channel like jQuery's data store - the 6.x flag never surfaced in the
// DOM either.
const describedBy = new WeakSet();

// jQuery collection / element / array acceptance for the public $el-shaped
// parameters (core.utils toElement shape, kept local until that helper is
// exported). A node is recognized by nodeType and never unwrapped: native
// array-likes like HTMLSelectElement expose their first option as [0].
function toEl(obj) {
  return obj && obj.nodeType === undefined && obj[0] !== undefined ? obj[0] : obj;
}

function toEls(obj) {
  if (obj && obj.nodeType === undefined && obj[0] !== undefined) { return Array.from(obj); }
  return obj ? [obj] : [];
}

// jQuery addClass/removeClass equivalents: the option classes may carry
// several whitespace-separated names.
function addClasses(el, names) {
  names.split(/\s+/).forEach(name => {
    if (name) { el.classList.add(name); }
  });
}

function removeClasses(el, names) {
  names.split(/\s+/).forEach(name => {
    if (name) { el.classList.remove(name); }
  });
}

class Abide extends Plugin {
  /**
   * Creates a new instance of Abide.
   * @class
   * @name Abide
   * @fires Abide#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options = {}) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    // Native deep merge (7.0 line A, S14): the Dom deepMerge mirrors jQuery's
    // `$.extend(true)` semantics (array index merge, null overwrite,
    // reference assignment for functions/RegExps - the validator functions
    // and RegExp patterns above survive the merge by reference). Pinned
    // against jQuery in the deepMerge equivalence suite.
    this.options = deepMerge({}, Abide.defaults, datasetOptions(this.$element), options);
    this.isEnabled = true;
    this.formnovalidate = null;

    this.className = 'Abide'; // ie9 back compat
    this._init();
  }

  /**
   * Initializes the Abide plugin and calls functions to get Abide functioning on load.
   * @private
   */
  _init() {
    const form = this.$element;
    // Native field sweep (7.0 line A, S12): every input except the submit
    // ones, plus the textareas and selects. The former two-find + $.merge
    // grouped the set by tag; the flat document order changes nothing about
    // which fields are validated (fields are validated independently,
    // checkbox groups are deduped by name while iterating).
    this.inputs = Array.from(form.querySelectorAll('input:not([type="submit"]), textarea, select'));
    this.submits = Array.from(form.querySelectorAll('[type="submit"]'));
    const globalErrors = Array.from(form.querySelectorAll('[data-abide-error]'));

    // Add a11y attributes to all fields
    if (this.options.a11yAttributes) {
      this.inputs.forEach(input => this.addA11yAttributes(input));
      globalErrors.forEach(error => this.addGlobalErrorA11yAttributes(error));
    }

    this._events();
  }

  /**
   * Initializes events for Abide.
   * @private
   */
  _events() {
    const form = this.$element;

    // S12: the form-level and per-field consumers flip to the native event
    // layer. Their producers are the real DOM reset/submit/change/input/
    // blur events (which reach both listener layers during the mixed state)
    // and this plugin's own native triggers, so every seam here closes on
    // the consumer side alone.
    Events.off(form, '.abide');
    Events.on(form, 'reset.zf.abide', () => {
      this.resetForm();
    });
    Events.on(form, 'submit.zf.abide', () => {
      return this.validateForm();
    });

    this.submits.forEach(submit => {
      Events.off(submit, 'click.zf.abide keydown.zf.abide');
      Events.on(submit, 'click.zf.abide keydown.zf.abide', (e) => {
        if (!e.key || (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          this.formnovalidate = e.target.getAttribute('formnovalidate') !== null;
          this._submitForm();
        }
      });
    });

    if (this.options.validateOn === 'fieldChange') {
      this.inputs.forEach(input => {
        Events.off(input, 'change.zf.abide');
        Events.on(input, 'change.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }

    if (this.options.liveValidate) {
      this.inputs.forEach(input => {
        Events.off(input, 'input.zf.abide');
        Events.on(input, 'input.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }

    if (this.options.validateOnBlur) {
      this.inputs.forEach(input => {
        Events.off(input, 'blur.zf.abide');
        Events.on(input, 'blur.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }
  }

  /**
   * Formerly `this.$element.submit()` (7.0 line A, S12): jQuery's synthetic
   * submit trigger ran the submit handlers and handed over to the native
   * form.submit() only when no handler cancelled - Events.trigger implements
   * exactly that shape. The native submit() fires no submit event of its
   * own, so nothing recurses.
   * @private
   */
  _submitForm() {
    Events.trigger(this.$element, 'submit');
  }

  /**
   * Calls necessary functions to update Abide upon DOM change
   * @private
   */
  _reflow() {
    this._init();
  }

  /**
   * Checks whether the submitted form should be validated or not, consodering formnovalidate and isEnabled
   * @returns {Boolean}
   * @private
   */
  _validationIsDisabled() {
    if (this.isEnabled === false) { // whole validation disabled
      return true;
    } else if (typeof this.formnovalidate === 'boolean') { // triggered by $submit
      return this.formnovalidate;
    }
    // triggered by Enter in non-submit input
    return this.submits.length ? this.submits[0].getAttribute('formnovalidate') !== null : false;
  }

  /**
   * Enables the whole validation
   */
  enableValidation() {
    this.isEnabled = true;
  }

  /**
   * Disables the whole validation
   */
  disableValidation() {
    this.isEnabled = false;
  }

  /**
   * Checks whether or not a form element has the required attribute and if it's checked or not
   * @param {Object} element - jQuery object to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  requiredCheck($el) {
    const el = toEl($el);
    if (!el.hasAttribute('required')) return true;

    var isGood = true;

    switch (el.type) {
      case 'checkbox':
        isGood = el.checked;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        var opt = el.querySelectorAll('option:checked');
        if (!opt.length || !opt[0].value) isGood = false;
        break;

      default:
        if (!el.value || !el.value.length) isGood = false;
    }

    return isGood;
  }

  /**
   * Get:
   * - Based on $el, the first element(s) corresponding to `formErrorSelector` in this order:
   *   1. The element's direct sibling('s).
   *   2. The element's parent's children.
   * - Element(s) with the attribute `[data-form-error-for]` set with the element's id.
   *
   * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
   *
   * @param {Object} $el - jQuery object to use as reference to find the form error selector.
   * @param {String[]} [failedValidators] - List of failed validators.
   * @returns {Object} jQuery object with the selector.
   */
  findFormError($el, failedValidators) {
    const els = toEls($el);
    const id = els.length ? els[0].id : '';
    const form = this.$element;
    let errors = [];
    const addUnique = (candidates) => {
      candidates.forEach(candidate => {
        if (candidate && errors.indexOf(candidate) === -1) { errors.push(candidate); }
      });
    };

    // 1. The direct siblings matching the selector (jQuery unions the
    // per-element sibling lists of the whole collection, in order).
    els.forEach(el => {
      addUnique(Array.from(el.parentNode.children).filter(child => child !== el && child.matches(this.options.formErrorSelector)));
    });

    // 2. The parent's matching children, when no sibling matched.
    if (!errors.length) {
      els.forEach(el => {
        addUnique(Array.from(el.parentNode.querySelectorAll(this.options.formErrorSelector)));
      });
    }

    if (id) {
      addUnique(Array.from(form.querySelectorAll(`[data-form-error-for="${id}"]`)));
    }

    if (!!failedValidators) {
      errors = errors.filter(error => !error.hasAttribute('data-form-error-on'));

      failedValidators.forEach(v => {
        els.forEach(el => {
          addUnique(Array.from(el.parentNode.children).filter(child => child !== el && child.matches(`[data-form-error-on="${v}"]`)));
        });
        addUnique(Array.from(form.querySelectorAll(`[data-form-error-for="${id}"][data-form-error-on="${v}"]`)));
      });
    }

    // 7.0 terminal form: the plain element array (the mixed state wrapped it)
    return errors;
  }

  /**
   * Get the first element in this order:
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the label.
   */
  findLabel($el) {
    const el = toEl($el);
    const label = this.$element.querySelector(`label[for="${el.id}"]`);

    // 7.0 terminal form: the label elements as an array (empty when absent)
    if (!label) {
      const closest = el.closest('label');
      return closest ? [closest] : [];
    }
    return [label];
  }

  /**
   * Get the set of labels associated with a set of radio els in this order
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the labels.
   */
  findRadioLabels($els) {
    return this._labelsForGroup($els);
  }

  /**
   * Get the set of labels associated with a set of checkbox els in this order
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the labels.
   */
  findCheckboxLabels($els) {
    return this._labelsForGroup($els);
  }

  _labelsForGroup($els) {
    const labels = [];
    toEls($els).forEach(el => {
      let label = el.id ? this.$element.querySelector(`label[for="${el.id}"]`) : null;

      if (!label) {
        label = el.closest('label');
      }
      if (label) {
        labels.push(label);
      }
    });

    return labels;
  }

  /**
   * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
   * @param {Object} $el - jQuery object to add the class to
   * @param {String[]} [failedValidators] - List of failed validators.
   */
  addErrorClasses($el, failedValidators) {
    const el = toEl($el);
    const $label = this.findLabel($el);
    const $formError = this.findFormError($el, failedValidators);

    $label.forEach(label => addClasses(label, this.options.labelErrorClass));

    $formError.forEach(error => addClasses(error, this.options.formErrorClass));

    addClasses(el, this.options.inputErrorClass);
    el.setAttribute('data-invalid', '');
    el.setAttribute('aria-invalid', 'true');

    if ($formError.some(visible)) {
      this.addA11yErrorDescribe($el, $formError);
    }
  }

  /**
   * Adds [for] and [role=alert] attributes to all form error targetting $el,
   * and [aria-describedby] attribute to $el toward the first form error.
   * @param {Object} $el - jQuery object
   */
  addA11yAttributes($el) {
    const el = toEl($el);
    const errors = this.findFormError($el);
    const labels = errors.filter(error => error.matches('label'));
    if (!errors.length) return;

    // The former `:visible` filter, narrowed to the display rule (Dom's
    // `visible` - see the PENDING DECISION note there).
    const firstError = errors.find(visible);
    if (firstError) {
      this.addA11yErrorDescribe($el, firstError);
    }

    if (labels.filter(label => label.hasAttribute('for')).length < labels.length) {
      // Get the input ID or create one
      let elemId = el.getAttribute('id');
      if (elemId == null) {
        elemId = GetYoDigits(6, 'abide-input');
        el.setAttribute('id', elemId);
      }

      // For each label targeting $el, set [for] if it is not set.
      labels.forEach(label => {
        if (!label.hasAttribute('for')) {
          label.setAttribute('for', elemId);
        }
      });
    }

    // For each error targeting $el, set [role=alert] if it is not set.
    errors.forEach(error => {
      if (!error.hasAttribute('role')) {
        error.setAttribute('role', 'alert');
      }
    });
  }

  addA11yErrorDescribe($el, $error) {
    const el = toEl($el);
    const error = toEl($error);
    if (el.getAttribute('type') === 'hidden') return;
    if (el.hasAttribute('aria-describedby')) return;

    // Set [aria-describedby] on the input toward the first form error if it is not set
    // Get the first error ID or create one
    let errorId = error.getAttribute('id');
    if (errorId == null) {
      errorId = GetYoDigits(6, 'abide-error');
      error.setAttribute('id', errorId);
    }

    el.setAttribute('aria-describedby', errorId);
    describedBy.add(el);
  }

  /**
   * Adds [aria-live] attribute to the given global form error $el.
   * @param {Object} $el - jQuery object to add the attribute to
   */
  addGlobalErrorA11yAttributes($el) {
    const el = toEl($el);
    if (!el.hasAttribute('aria-live')) {
      el.setAttribute('aria-live', this.options.a11yErrorLevel);
    }
  }

  /**
   * Remove CSS error classes etc from an entire radio button group
   * @param {String} groupName - A string that specifies the name of a radio button group
   *
   */
  removeRadioErrorClasses(groupName) {
    const $els = this._groupEls('radio', groupName);
    const $labels = this.findRadioLabels($els);
    const $formErrors = this.findFormError($els);

    $labels.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formErrors.forEach(error => removeClasses(error, this.options.formErrorClass));

    $els.forEach(el => {
      removeClasses(el, this.options.inputErrorClass);
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

  }

  /**
   * Remove CSS error classes etc from an entire checkbox group
   * @param {String} groupName - A string that specifies the name of a checkbox group
   *
   */
  removeCheckboxErrorClasses(groupName) {
    const $els = this._groupEls('checkbox', groupName);
    const $labels = this.findCheckboxLabels($els);
    const $formErrors = this.findFormError($els);

    $labels.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formErrors.forEach(error => removeClasses(error, this.options.formErrorClass));

    $els.forEach(el => {
      removeClasses(el, this.options.inputErrorClass);
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

  }

  // Native stand-in for the former `:radio/:checkbox` group queries (7.0
  // line A, S12): `input[type="..."][name="..."]`, the exact
  // createInputPseudo set.
  _groupEls(type, groupName) {
    return Array.from(this.$element.querySelectorAll(`input[type="${type}"][name="${groupName}"]`));
  }

  /**
   * Removes CSS error class as specified by the Abide settings from the label, input, and the form
   * @param {Object} $el - jQuery object to remove the class from
   */
  removeErrorClasses($el) {
    const el = toEl($el);
    // radios need to clear all of the els
    if (el.type === 'radio') {
      return this.removeRadioErrorClasses(el.getAttribute('name'));
    }
    // checkboxes need to clear all of the els
    else if (el.type === 'checkbox') {
      return this.removeCheckboxErrorClasses(el.getAttribute('name'));
    }

    const $label = this.findLabel($el);
    const $formError = this.findFormError($el);

    $label.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formError.forEach(error => removeClasses(error, this.options.formErrorClass));

    removeClasses(el, this.options.inputErrorClass);
    el.removeAttribute('data-invalid');
    el.removeAttribute('aria-invalid');

    if (describedBy.has(el)) {
      el.removeAttribute('aria-describedby');
      describedBy.delete(el);
    }
  }

  /**
   * Goes through a form to find inputs and proceeds to validate them in ways specific to their type.
   * Ignores inputs with data-abide-ignore, type="hidden" or disabled attributes set
   * @fires Abide#invalid
   * @fires Abide#valid
   * @param {Object} element - jQuery object to validate, should be an HTML input
   * @returns {Boolean} goodToGo - If the input is valid or not.
   */
  validateInput($el) {
    const el = toEl($el);
    var clearRequire = this.requiredCheck($el),
        validator = el.getAttribute('data-validator'),
        failedValidators = [],
        manageErrorClasses = true;

    // skip validation if disabled
    if (this._validationIsDisabled()) {
      return true;
    }

    // don't validate ignored inputs or hidden inputs or disabled inputs
    if (el.hasAttribute('data-abide-ignore') || el.matches('[type="hidden"]') || el.hasAttribute('disabled')) {
      return true;
    }

    switch (el.type) {
      case 'radio':
        this.validateRadio(el.getAttribute('name')) || failedValidators.push('required');
        break;

      case 'checkbox':
        this.validateCheckbox(el.getAttribute('name')) || failedValidators.push('required');
        // validateCheckbox() adds/removes error classes
        manageErrorClasses = false;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        clearRequire || failedValidators.push('required');
        break;

      default:
        clearRequire || failedValidators.push('required');
        this.validateText($el) || failedValidators.push('pattern');
    }

    if (validator) {
      const required = el.hasAttribute('required');

      validator.split(' ').forEach((v) => {
        this.options.validators[v]($el, required, el.parentElement) || failedValidators.push(v);
      });
    }

    if (el.getAttribute('data-equalto')) {
      this.options.validators.equalTo($el) || failedValidators.push('equalTo');
    }

    var goodToGo = failedValidators.length === 0;
    var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

    if (goodToGo) {
      // Re-validate inputs that depend on this one with equalto
      const dependentElements = this.$element.querySelectorAll(`[data-equalto="${el.id}"]`);
      if (dependentElements.length) {
        Array.from(dependentElements).forEach(dependent => {
          if (dependent.value) {
            this.validateInput(dependent);
          }
        });
      }
    }

    if (manageErrorClasses) {
      this.removeErrorClasses($el);
      if (!goodToGo) {
          this.addErrorClasses($el, failedValidators);
      }
    }

    /**
     * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
     * Trigger includes the DOM element of the input.
     * @event Abide#valid
     * @event Abide#invalid
     */
    // S12: the production flips to the native event layer - a real, bubbling
    // event; still-on-jQuery listeners receive it through the real-event
    // pass-through, the forwarded $el rides in event.originalEvent.detail
    // (the final param form is the wrap-up slice's uniform move).
    Events.trigger(el, message, [el]);

    return goodToGo;
  }

  /**
   * Goes through a form and if there are any invalid inputs, it will display the form error element
   * @returns {Boolean} noError - true if no errors were detected...
   * @fires Abide#formvalid
   * @fires Abide#forminvalid
   */
  validateForm() {
    var acc = [];
    var checkboxGroupName;
    const form = this.$element;

    // Remember first form submission to prevent specific checkbox validation (more than one required) until form got initially submitted
    if (!this.initialized) {
      this.initialized = true;
    }

    // skip validation if disabled
    if (this._validationIsDisabled()) {
      this.formnovalidate = null;
      return true;
    }

    this.inputs.forEach(el => {

      // Only use one checkbox per group since validateCheckbox() iterates over all associated checkboxes
      if (el.type === 'checkbox') {
        if (el.getAttribute('name') === checkboxGroupName) return;
        checkboxGroupName = el.getAttribute('name');
      }

      acc.push(this.validateInput(el));
    });

    var noError = acc.indexOf(false) === -1;

    form.querySelectorAll('[data-abide-error]').forEach(elem => {
      // Ensure a11y attributes are set
      if (this.options.a11yAttributes) this.addGlobalErrorA11yAttributes(elem);
      // Show or hide the error
      elem.style.display = (noError ? 'none' : 'block');
    });

    /**
     * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
     * Trigger includes the element of the form.
     * @event Abide#formvalid
     * @event Abide#forminvalid
     */
    // S12: production flips to the native event layer, same shape as the
    // input-level events above.
    // Terminal form: the forwarded form is the plain element.
    Events.trigger(form, (noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [form]);

    return noError;
  }

  /**
   * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
   * @param {Object} $el - jQuery object to validate, should be a text input HTML element
   * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
   * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
   */
  validateText($el, pattern) {
    const el = toEl($el);
    // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
    pattern = (pattern || el.getAttribute('data-pattern') || el.getAttribute('pattern') || el.getAttribute('type'));
    var inputText = el.value;
    var valid = true;

    if (inputText.length) {
      // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
      if (this.options.patterns.hasOwnProperty(pattern)) {
        valid = this.options.patterns[pattern].test(inputText);
      }
      // If the pattern name isn't also the type attribute of the field, then test it as a regexp
      else if (pattern !== el.getAttribute('type')) {
        valid = new RegExp(pattern).test(inputText);
      }
    }

    return valid;
   }

  /**
   * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
   * @param {String} groupName - A string that specifies the name of a radio button group
   * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
   */
  validateRadio(groupName) {
    // If at least one radio in the group has the `required` attribute, the group is considered required
    // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
    const $group = this._groupEls('radio', groupName);
    var valid = false, required = false;

    // For the group to be required, at least one radio needs to be required
    $group.forEach(el => {
      if (el.hasAttribute('required')) {
        required = true;
      }
    });
    if (!required) valid=true;

    if (!valid) {
      // For the group to be valid, at least one radio needs to be checked
      $group.forEach(el => {
        if (el.checked) {
          valid = true;
        }
      });
    }

    return valid;
  }

  /**
   * Determines whether or a not a checkbox input is valid based on whether or not it is required and checked. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all checkboxes in its group.
   * @param {String} groupName - A string that specifies the name of a checkbox group
   * @returns {Boolean} Boolean value depends on whether or not at least one checkbox input has been checked (if it's required)
   */
  validateCheckbox(groupName) {
    // If at least one checkbox in the group has the `required` attribute, the group is considered required
    // Per W3C spec, all checkboxes in a group should have `required`, but we're being nice
    const $group = this._groupEls('checkbox', groupName);
    var valid = false, required = false, minRequired = 1, checked = 0;

    // For the group to be required, at least one checkbox needs to be required
    $group.forEach(el => {
      if (el.hasAttribute('required')) {
        required = true;
      }
    });
    if (!required) valid=true;

    if (!valid) {
      // Count checked checkboxes within the group
      // Use data-min-required if available (default: 1)
      $group.forEach(el => {
        if (el.checked) {
          checked++;
        }
        if (el.hasAttribute('data-min-required')) {
          minRequired = parseInt(el.getAttribute('data-min-required'), 10);
        }
      });

      // For the group to be valid, the minRequired amount of checkboxes have to be checked
      if (checked >= minRequired) {
        valid = true;
      }
    }

    // Skip validation if more than 1 checkbox have to be checked AND if the form hasn't got submitted yet (otherwise it will already show an error during the first fill in)
    if (this.initialized !== true && minRequired > 1) {
      return true;
    }

    // Refresh error class for all input
    $group.forEach(el => {
      if (!valid) {
        this.addErrorClasses(el, ['required']);
      } else {
        this.removeErrorClasses(el);
      }
    });

    return valid;
  }

  /**
   * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
   * @param {Object} $el - jQuery input element.
   * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
   * @param {Boolean} required - self explanatory?
   * @returns {Boolean} - true if validations passed.
   */
  matchValidation($el, validators, required) {
    required = required ? true : false;
    // The 6.x third validator argument was the parent element; validateInput
    // resolves its own `el` via toEl, matchValidation needs the same step
    // (the bare `el` here was a crash on every data-validator run).
    const el = toEl($el);

    var clear = validators.split(' ').map((v) => {
      return this.options.validators[v]($el, required, el.parentElement);
    });
    return clear.indexOf(false) === -1;
  }

  /**
   * Resets form inputs and styles
   * @fires Abide#formreset
   */
  resetForm() {
    const form = this.$element,
        opts = this.options;

    form.querySelectorAll(`.${opts.labelErrorClass}`).forEach(el => {
      if (!el.matches('small')) removeClasses(el, opts.labelErrorClass);
    });
    form.querySelectorAll(`.${opts.inputErrorClass}`).forEach(el => {
      if (!el.matches('small')) removeClasses(el, opts.inputErrorClass);
    });
    document.querySelectorAll(`${opts.formErrorSelector}.${opts.formErrorClass}`).forEach(el => {
      removeClasses(el, opts.formErrorClass);
    });
    form.querySelectorAll('[data-abide-error]').forEach(el => {
      el.style.display = 'none';
    });

    // Native reset sweep (7.0 line A, S12) - the former pseudo-selector
    // chain `:input :not(:button, :submit, :reset, :hidden, :radio,
    // :checkbox, [data-abide-ignore])` with the Dom stand-in helpers; the
    // jQuery `:hidden` zero-box sense is narrowed to input[type=hidden],
    // which was its only effect on a rendered form.
    formControls(form).forEach(el => {
      if (isButton(el) || isSubmit(el) || isReset(el) ||
          el.matches('input[type="hidden"]') ||
          isRadio(el) || isCheckbox(el) ||
          el.hasAttribute('data-abide-ignore')) {
        return;
      }
      el.value = '';
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('input[type="radio"]').forEach(el => {
      if (el.hasAttribute('data-abide-ignore')) return;
      el.checked = false;
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(el => {
      if (el.hasAttribute('data-abide-ignore')) return;
      el.checked = false;
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

    /**
     * Fires when the form has been reset.
     * @event Abide#formreset
     */
    // S12: production flips to the native event layer, same shape as the
    // other productions above.
    Events.trigger(form, 'formreset.zf.abide', [this.$element]);
  }

  /**
   * Destroys an instance of Abide.
   * Removes error styles and classes from elements, without resetting their values.
   */
  _destroy() {
    const form = this.$element;

    // The plugin-namespaced listeners on the form (the native table the
    // library owns).
    Events.off(form, '.abide');
    form.querySelectorAll('[data-abide-error]').forEach(error => {
      error.style.display = 'none';
    });

    this.inputs.forEach(input => {
      Events.off(input, '.abide');
      this.removeErrorClasses(input);
    });

    this.submits.forEach(submit => {
      Events.off(submit, '.abide');
    });
  }
}

/**
 * Default settings for plugin
 */
Abide.defaults = {
  /**
   * The default event to validate inputs. Checkboxes and radios validate immediately.
   * Remove or change this value for manual validation.
   * @option
   * @type {?string}
   * @default 'fieldChange'
   */
  validateOn: 'fieldChange',

  /**
   * Class to be applied to input labels on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-label'
   */
  labelErrorClass: 'is-invalid-label',

  /**
   * Class to be applied to inputs on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-input'
   */
  inputErrorClass: 'is-invalid-input',

  /**
   * Class selector to use to target Form Errors for show/hide.
   * @option
   * @type {string}
   * @default '.form-error'
   */
  formErrorSelector: '.form-error',

  /**
   * Class added to Form Errors on failed validation.
   * @option
   * @type {string}
   * @default 'is-visible'
   */
  formErrorClass: 'is-visible',

  /**
   * If true, automatically insert when possible:
   * - `[aria-describedby]` on fields
   * - `[role=alert]` on form errors and `[for]` on form error labels
   * - `[aria-live]` on global errors `[data-abide-error]` (see option `a11yErrorLevel`).
   * @option
   * @type {boolean}
   * @default true
   */
  a11yAttributes: true,

  /**
   * [aria-live] attribute value to be applied on global errors `[data-abide-error]`.
   * Options are: 'assertive', 'polite' and 'off'/null
   * @option
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
   * @type {string}
   * @default 'assertive'
   */
  a11yErrorLevel: 'assertive',

  /**
   * Set to true to validate text inputs on any value change.
   * @option
   * @type {boolean}
   * @default false
   */
  liveValidate: false,

  /**
   * Set to true to validate inputs on blur.
   * @option
   * @type {boolean}
   * @default false
   */
  validateOnBlur: false,

  patterns: {
    alpha : /^[a-zA-Z]+$/,
    // eslint-disable-next-line camelcase
    alpha_numeric : /^[a-zA-Z0-9]+$/,
    integer : /^[-+]?\d+$/,
    number : /^[-+]?\d*(?:[\.\,]\d+)?$/,

    // amex, visa, diners
    card : /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(?:222[1-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
    cvv : /^([0-9]){3,4}$/,

    // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
    email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

    // From CommonRegexJS (@talyssonoc)
    // https://github.com/talyssonoc/CommonRegexJS/blob/e2901b9f57222bc14069dc8f0598d5f412555411/lib/commonregex.js#L76
    // For more restrictive URL Regexs, see https://mathiasbynens.be/demo/url-regex.
    url: /^((?:(https?|ftps?|file|ssh|sftp):\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))$/,

    // abc.de
    domain : /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

    datetime : /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
    // YYYY-MM-DD
    date : /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
    // HH:MM:SS
    time : /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
    dateISO : /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
    // MM/DD/YYYY
    // eslint-disable-next-line camelcase
    month_day_year : /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
    // DD/MM/YYYY
    // eslint-disable-next-line camelcase
    day_month_year : /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

    // #FFF or #FFFFFF
    color : /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,

    // Domain || URL
    website: {
      test: (text) => {
        return Abide.defaults.patterns.domain.test(text) || Abide.defaults.patterns.url.test(text);
      }
    }
  },

  /**
   * Optional validation functions to be used. `equalTo` being the only default included function.
   * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
   * el : The jQuery element to validate.
   * @option
   */
  validators: {
    equalTo: function (el) {
      // Native id lookup (7.0 line A, S12): the former `$(`#${...}`).val()`
      // compared against undefined when the source element does not exist;
      // the guard keeps that "no source element means invalid" outcome.
      const source = document.getElementById(toEl(el).getAttribute('data-equalto'));
      return !!source && source.value === toEl(el).value;
    }
  }
};

/**
 * Accordion module.
 * @module foundation.accordion
 * @requires foundation.util.keyboard
 */

// Element | collection | NodeList | array -> element array (the 6.x
// multi-target collection form keeps working).
function normalizeTargets$1(target) {
  if (target.nodeType === 1) { return [target]; }
  if (!target) { return []; }
  return Array.from(target);
}

class Accordion extends Plugin {
  /**
   * Creates a new instance of an accordion.
   * @class
   * @name Accordion
   * @fires Accordion#init
   * @param {jQuery} element - jQuery object to make into an accordion.
   * @param {Object} options - a plain object with settings to override the default options.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Accordion.defaults, datasetOptions(this.$element), options);

    this.className = 'Accordion'; // ie9 back compat
    this._init();

    Keyboard.register('Accordion', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_DOWN': 'next',
      'ARROW_UP': 'previous',
      'HOME': 'first',
      'END': 'last',
    });
  }

  /**
   * Initializes the accordion by animating the preset active pane(s).
   * @private
   */
  _init() {
    this._isInitializing = true;
    // Per-instance id for the native deep-link hashchange namespace (7.0 line
    // A, S8) - the same shape Reveal/Magellan/Tabs use.
    this.id = this.$element.id || GetYoDigits(6, 'accordion');

    this.$tabs = Array.from(this.$element.children).filter(el => el.matches('[data-accordion-item]'));

    this.$tabs.forEach(function(el) {
      var content = el.querySelector(':scope > [data-tab-content]'),
          id = content.id || GetYoDigits(6, 'accordion'),
          linkId = (el.id) ? `${el.id}-label` : `${id}-label`;

      // State/ARIA go through the native layer (7.0 line A, S8).
      var link = el.querySelector('a:first-of-type');
      link.setAttribute('aria-controls', id);
      link.setAttribute('id', linkId);
      link.setAttribute('aria-expanded', 'false');

      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', linkId);
      content.setAttribute('aria-hidden', 'true');
      content.setAttribute('id', id);
    });

    var initActive = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]'));
    if (initActive.length) {
      // Save up the initial hash to return to it later when going back in history
      this._initialAnchor = initActive[0].previousElementSibling.matches('a') ? initActive[0].previousElementSibling.getAttribute('href') : undefined;
      this._openSingleTab(initActive);
    }

    this._checkDeepLink = () => {
      var anchor = window.location.hash;

      if (!anchor.length) {
        // If we are still initializing and there is no anchor, then there is nothing to do
        if (this._isInitializing) return;
        // Otherwise, move to the initial anchor
        if (this._initialAnchor) anchor = this._initialAnchor;
      }

      // jQuery's $(weird-hash) returned an empty collection instead of
      // throwing on invalid selectors; querySelector needs the guard.
      var anchorEl = null;
      if (anchor) {
        try { anchorEl = document.querySelector(anchor); } catch (err) { anchorEl = null; }
      }
      var link = anchor ? this.$element.querySelector(`[href$="${anchor}"]`) : null;
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!(anchorEl && link);

      if (isOwnAnchor) {
        // If there is an anchor for the hash, open it (if not already active)
        if (anchorEl && link) {
          if (!link.closest('[data-accordion-item]').classList.contains('is-active')) {
            this._openSingleTab(anchorEl);
          }
        }
        // Otherwise, close everything
        else {
          this._closeAllTabs();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          onLoad(window, () => {
            // A load callback can land after destroy() nulled the instance
            // state (the S6 slider guard pattern).
            if (!this.$element) { return; }
            var offsetTop = this.$element.getBoundingClientRect().top + window.pageYOffset;
            // fx 方案 A: the native page-scroll tween (SmoothScroll S7
            // equivalence - one viewport tween, callback once per ledger ②)
            Motion.animate(document.documentElement, { scrollTop: offsetTop - this.options.deepLinkSmudgeOffset }, this.options.deepLinkSmudgeDelay);
          });
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Accordion#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        Events.trigger(this.$element, 'deeplink.zf.accordion', [link, anchorEl]);
      }
    };

    //use browser to open a tab, if it exists in this tabset
    if (this.options.deepLink) {
      this._checkDeepLink();
    }

    this._events();

    this._isInitializing = false;
  }

  /**
   * Adds event handlers for items within the accordion.
   * @private
   */
  _events() {
    var _this = this;

    this.$tabs.forEach(function(elem) {
      var tabContent = elem.querySelector(':scope > [data-tab-content]');
      if (!tabContent) { return; }
      Array.from(elem.children).filter(el => el.matches('a')).forEach(function(anchor) {
        // S8: the click consumer runs on the native event layer; the
        // keyboard forwarding below dispatches real clicks on the same
        // layer. Real user clicks reach it directly.
        Events.off(anchor, 'click.zf.accordion');
        Events.on(anchor, 'click.zf.accordion', function(e) {
          e.preventDefault();
          _this.toggle(tabContent);
        });

        // 7.0 line A terminal form: the keydown listener runs on the native
        // event layer (the coarse suite's mocks dispatch real KeyboardEvents
        // since the S16 migration).
        Events.off(anchor, 'keydown.zf.accordion');
        Events.on(anchor, 'keydown.zf.accordion', function(e) {
          Keyboard.handleKey(e, 'Accordion', {
            toggle: function() {
              _this.toggle(tabContent);
            },
            next: function() {
              var a = (elem.nextElementSibling || {}).querySelector && elem.nextElementSibling.querySelector('a');
              if (a) a.focus();
              if (!_this.options.multiExpand) {
                Events.trigger(a, 'click.zf.accordion');
              }
            },
            previous: function() {
              var a = (elem.previousElementSibling || {}).querySelector && elem.previousElementSibling.querySelector('a');
              if (a) a.focus();
              if (!_this.options.multiExpand) {
                Events.trigger(a, 'click.zf.accordion');
              }
            },
            first: function() {
              var a = _this.$tabs[0].querySelector('.accordion-title');
              a.focus();
              if (!_this.options.multiExpand) {
                 Events.trigger(a, 'click.zf.accordion');
              }
            },
            last: function() {
              var a = _this.$tabs[_this.$tabs.length - 1].querySelector('.accordion-title');
              a.focus();
              if (!_this.options.multiExpand) {
                 Events.trigger(a, 'click.zf.accordion');
              }
            },
            handled: function() {
              e.preventDefault();
            }
          });
        });
      });
    });
    if (this.options.deepLink) {
      // S8: the deep-link hashchange moves to the native event layer under
      // the per-instance namespace shape introduced for Reveal's hashchange,
      // so the destroy path can drop it precisely. Real hashchange events are
      // unaffected by the namespace.
      Events.on(window, `hashchange.zf.accordion:${this.id}`, this._checkDeepLink);
    }
  }

  /**
   * Toggles the selected content pane's open/close state.
   * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
   * @function
   */
  toggle(target) {
    // Accepts an element, a collection, a NodeList or an array (the 6.x
    // multi-target collection form works; state and fx iterate per element).
    target = normalizeTargets$1(target);
    if (target[0].closest('[data-accordion]').matches('[disabled]')) {
      console.info('Cannot toggle an accordion that is disabled.');
      return;
    }
    if (target[0].parentElement.classList.contains('is-active')) {
      this.up(target);
    } else {
      this.down(target);
    }
    //either replace or update browser history
    if (this.options.deepLink) {
      var anchor = target[0].previousElementSibling.getAttribute('href');

      if (this.options.updateHistory) {
        history.pushState({}, '', anchor);
      } else {
        history.replaceState({}, '', anchor);
      }
    }
  }

  /**
   * Opens the accordion tab defined by `$target`.
   * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   */
  down(target) {
    target = normalizeTargets$1(target);
    if (target[0].closest('[data-accordion]').matches('[disabled]'))  {
      console.info('Cannot call down on an accordion that is disabled.');
      return;
    }

    if (this.options.multiExpand)
      this._openTab(target);
    else
      this._openSingleTab(target);
  }

  /**
   * Closes the tab defined by `$target`.
   * It may be ignored if the Accordion options don't allow it.
   *
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   */
  up(target) {
    target = normalizeTargets$1(target);
    if (this.$element.matches('[disabled]')) {
      console.info('Cannot call up on an accordion that is disabled.');
      return;
    }

    // Don't close the item if it is already closed
    const targetItem = target[0].parentElement;
    if (!targetItem.classList.contains('is-active')) return;

    // Don't close the item if there is no other active item (unless with `allowAllClosed`)
    const othersItems = Array.from(targetItem.parentElement.children).filter(el => el !== targetItem);
    if (!this.options.allowAllClosed && !othersItems.some(el => el.classList.contains('is-active'))) return;

    this._closeTab(target);
  }

  /**
   * Make the tab defined by `$target` the only opened tab, closing all others tabs.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @function
   * @private
   */
  _openSingleTab(target) {
    target = normalizeTargets$1(target);
    // Close all the others active tabs.
    const activeContents = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]')).filter(el => target.indexOf(el) === -1);
    if (activeContents.length) {
      this._closeTab(activeContents);
    }

    // Then open the target.
    this._openTab(target);
  }

  /**
   * Opens the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   * @private
   */
  _openTab(targets) {
    targets = normalizeTargets$1(targets);
    // The labelledby lookup keeps the 6.x first-element read; the class and
    // aria-hidden writes apply to every pane, like the collection calls did.
    const targetContentId = targets[0].getAttribute('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    targets.forEach(function(el) {
      el.setAttribute('aria-hidden', 'false');
      el.parentElement.classList.add('is-active');
    });

    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'true');

    // fx 方案 A: the fold tween runs on Motion's native slide primitive
    // (jQuery fx parity: finish() jumps any in-flight fold, the down event
    // stays timed by the completion callback and fires once per pane, like
    // the jQuery collection callback did; the terminal form forwards the
    // element array, 6.x forwarded the collection).
    Motion.finish(targets);
    Motion.slideDown(targets, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done opening.
       * @event Accordion#down
       */
      Events.trigger(this.$element, 'down.zf.accordion', [targets]);
    });
  }

  /**
   * Closes the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeTab(targets) {
    targets = normalizeTargets$1(targets);
    // See _openTab: first-element labelledby lookup, per-element writes.
    const targetContentId = targets[0].getAttribute('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    targets.forEach(function(el) {
      el.setAttribute('aria-hidden', 'true');
      el.parentElement.classList.remove('is-active');
    });

    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'false');

    // fx 方案 A, see _openTab.
    Motion.finish(targets);
    Motion.slideUp(targets, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done collapsing up.
       * @event Accordion#up
       */
      Events.trigger(this.$element, 'up.zf.accordion', [targets]);
    });
  }

  /**
   * Closes all active tabs
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeAllTabs() {
    var activeTabs = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]'));
    if (activeTabs.length) {
      this._closeTab(activeTabs);
    }
  }

  /**
   * Destroys an instance of an accordion.
   * @fires Accordion#destroyed
   * @function
   */
  _destroy() {
    // fx 方案 A (see _openTab): the collapse-to-zero cleanup stops any
    // in-flight fold and hides instantly.
    this.$element.querySelectorAll('[data-tab-content]').forEach(function(el) {
      Motion.stop(el, true);
      Motion.slideUp(el, 0);
      el.style.display = '';
    });
    // The click and keydown listeners, by bare plugin namespace.
    this.$element.querySelectorAll('a').forEach(function(anchor) {
      Events.off(anchor, '.zf.accordion');
    });
    if (this.options.deepLink) {
      Events.off(window, `hashchange.zf.accordion:${this.id}`);
    }

  }
}

Accordion.defaults = {
  /**
   * Amount of time to animate the opening of an accordion pane.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Allow the accordion to have multiple open panes.
   * @option
   * @type {boolean}
   * @default false
   */
  multiExpand: false,
  /**
   * Allow the accordion to close all panes.
   * @option
   * @type {boolean}
   * @default false
   */
  allowAllClosed: false,
  /**
   * Link the location hash to the open pane.
   * Set the location hash when the opened pane changes, and open and scroll to the corresponding pane when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,
  /**
   * If `deepLink` is enabled, adjust the deep link scroll to make sure the top of the accordion panel is visible
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinkSmudge: false,
  /**
   * If `deepLinkSmudge` is enabled, animation time (ms) for the deep link adjustment
   * @option
   * @type {number}
   * @default 300
   */
  deepLinkSmudgeDelay: 300,
  /**
   * If `deepLinkSmudge` is enabled, the offset for the scrollToTop to prevent overlap by a sticky element at the top of the page
   * @option
   * @type {number}
   * @default 0
   */
  deepLinkSmudgeOffset: 0,
  /**
   * If `deepLink` is enabled, update the browser history with the open accordion
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false
};

/**
 * AccordionMenu module.
 * @module foundation.accordionMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.nest
 */

// Element | collection | NodeList | array -> element array (the 6.x
// multi-target collection form keeps working).
function normalizeTargets(target) {
  if (target.nodeType === 1) { return [target]; }
  if (!target) { return []; }
  return Array.from(target);
}

class AccordionMenu extends Plugin {
  /**
   * Creates a new instance of an accordion menu.
   * @class
   * @name AccordionMenu
   * @fires AccordionMenu#init
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, AccordionMenu.defaults, datasetOptions(this.$element), options);
    this.className = 'AccordionMenu'; // ie9 back compat

    this._init();

    Keyboard.register('AccordionMenu', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_RIGHT': 'open',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'close',
      'ESCAPE': 'closeAll'
    });
  }



  /**
   * Initializes the accordion menu by hiding all nested menus.
   * @private
   */
  _init() {
    Nest.Feather(this.$element, 'accordion');

    var _this = this;

    // fx 方案 A: the instant-collapse init hide on the native primitive
    this.$element.querySelectorAll('[data-submenu]').forEach(function(sub) {
      if (!sub.classList.contains('is-active')) { Motion.slideUp(sub, 0); }
    });
    this.$element.setAttribute('aria-multiselectable', this.options.multiOpen);

    this.$menuLinks = Array.from(this.$element.querySelectorAll('.is-accordion-submenu-parent'));
    this.$menuLinks.forEach(function(elem) {
      var linkId = elem.id || GetYoDigits(6, 'acc-menu-link'),
          sub = elem.querySelector(':scope > [data-submenu]'),
          subId = sub.id || GetYoDigits(6, 'acc-menu'),
          isActive = sub.classList.contains('is-active');

      if (_this.options.parentLink) {
        // $anchor.clone().prependTo($sub).wrap('<li .../>')
        const anchor = elem.querySelector(':scope > a');
        const wrapper = document.createElement('li');
        wrapper.setAttribute('data-is-parent-link', '');
        wrapper.className = 'is-submenu-parent-item is-submenu-item is-accordion-submenu-item';
        const cloned = anchor.cloneNode(true);
        wrapper.appendChild(cloned);
        sub.insertBefore(wrapper, sub.firstChild);
      }

      if (_this.options.submenuToggle) {
        elem.classList.add('has-submenu-toggle');
        elem.querySelector(':scope > a').insertAdjacentHTML('afterend', '<button id="' + linkId + '" class="submenu-toggle" aria-controls="' + subId + '" aria-expanded="' + isActive + '" title="' + _this.options.submenuToggleText + '"><span class="submenu-toggle-text">' + _this.options.submenuToggleText + '</span></button>');
      } else {
        elem.setAttribute('aria-controls', subId);
        elem.setAttribute('aria-expanded', isActive);
        elem.setAttribute('id', linkId);
      }
      sub.setAttribute('aria-labelledby', linkId);
      sub.setAttribute('aria-hidden', !isActive);
      sub.setAttribute('role', 'group');
      sub.setAttribute('id', subId);
    });
    var initPanes = Array.from(this.$element.querySelectorAll('.is-active'));
    initPanes.forEach(function(pane) {
      _this.down(pane);
    });
    this._events();
  }

  /**
   * Adds event handlers for items within the menu.
   * @private
   */
  _events() {
    var _this = this;

    this.$element.querySelectorAll('li').forEach(function(item) {
      var submenu = item.querySelector(':scope > [data-submenu]');

      if (submenu) {
        // S9: the submenu click consumers run on the native event layer -
        // real clicks reach them directly, jQuery-synthesized clicks ride
        // the `.click()` shortcut bridge (reveal-native precedent; jQuery
        // suppresses that shortcut for link anchors).
        if (_this.options.submenuToggle) {
          Events.off(item.querySelector(':scope > .submenu-toggle'), 'click.zf.accordionMenu');
          Events.on(item.querySelector(':scope > .submenu-toggle'), 'click.zf.accordionMenu', function() {
            _this.toggle(submenu);
          });
        } else {
          item.querySelectorAll(':scope > a').forEach(anchor => {
            Events.off(anchor, 'click.zf.accordionMenu');
            Events.on(anchor, 'click.zf.accordionMenu', function(e) {
              e.preventDefault();
              _this.toggle(submenu);
            });
          });
        }
      }

      // 7.0 line A terminal form: the keydown listener runs on the native
      // event layer (the coarse suite's mocks dispatch real KeyboardEvents
      // since the S16 migration). The traversal below reproduces the jQuery
      // shape: visible submenus (Dom.visible, the narrow display semantics),
      // first/last-child positions, closest('li') for the parents walk.
      Events.off(item, 'keydown.zf.accordionMenu');
      Events.on(item, 'keydown.zf.accordionMenu', function(e) {
        var element = this,
            parentUl = element.parentElement && element.parentElement.matches('ul') ? element.parentElement : null,
            elements = parentUl ? Array.from(parentUl.children).filter(el => el.matches('li')) : [],
            prevElement,
            nextElement,
            target = element.querySelector(':scope > [data-submenu]');

        var i = elements.indexOf(element);
        if (i !== -1) {
          prevElement = elements[Math.max(0, i-1)].querySelector('a');
          nextElement = elements[Math.min(i+1, elements.length-1)].querySelector('a');

          var openSub = element.querySelector(':scope > [data-submenu]');
          if (openSub && visible(openSub)) { // has open sub menu
            nextElement = element.querySelector('li a');
          }
          if (element === element.parentElement.firstElementChild) { // is first element of sub menu
            prevElement = element.closest('li') && element.closest('li') !== element ? element.closest('li').querySelector('a') : prevElement;
          } else if (prevElement && prevElement.closest('li') && prevElement.closest('li').querySelector(':scope > [data-submenu]') && visible(prevElement.closest('li').querySelector(':scope > [data-submenu]'))) { // if previous element has open sub menu
            prevElement = prevElement.closest('li').querySelector('li:last-child a');
          }
          if (element === element.parentElement.lastElementChild) { // is last element of sub menu
            var parentLi = element.closest('li');
            if (parentLi && parentLi !== element && parentLi.nextElementSibling && parentLi.nextElementSibling.matches('li')) {
              nextElement = parentLi.nextElementSibling.querySelector('a');
            }
          }
        }

        Keyboard.handleKey(e, 'AccordionMenu', {
          open: function() {
            if (!visible(target)) {
              _this.down(target);
              target.querySelector('li a').focus();
            }
          },
          close: function() {
            if (target && visible(target)) { // close active sub of this item
              _this.up(target);
            } else if (element.parentElement && element.parentElement.matches('[data-submenu]')) { // close currently open sub
              _this.up(element.parentElement);
              element.closest('li').querySelector('a').focus();
            }
          },
          up: function() {
            if (prevElement) prevElement.focus();
            return true;
          },
          down: function() {
            if (nextElement) nextElement.focus();
            return true;
          },
          toggle: function() {
            if (_this.options.submenuToggle) {
              return false;
            }
            if (target) {
              _this.toggle(target);
              return true;
            }
          },
          closeAll: function() {
            _this.hideAll();
          },
          handled: function(preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
          }
        });
      });
    });
  }

  /**
   * Closes all panes of the menu.
   * @function
   */
  hideAll() {
    this.up(Array.from(this.$element.querySelectorAll('[data-submenu]')));
  }

  /**
   * Opens all panes of the menu.
   * @function
   */
  showAll() {
    this.down(Array.from(this.$element.querySelectorAll('[data-submenu]')));
  }

  /**
   * Toggles the open/close state of a submenu.
   * @function
   * @param {jQuery} $target - the submenu to toggle
   */
  toggle(target) {
    // Accepts an element, a collection, a NodeList or an array.
    target = normalizeTargets(target);
    if (!target.some(el => Motion.isAnimating(el))) {
      if (target.some(el => visible(el))) {
        this.up(target);
      }
      else {
        this.down(target);
      }
    }
  }

  /**
   * Opens the sub-menu defined by `$target`.
   * @param {jQuery} $target - Sub-menu to open.
   * @fires AccordionMenu#down
   */
  down(target) {
    target = normalizeTargets(target);
    // If having multiple submenus active is disabled, close all the submenus
    // that are not parents or children of the targeted submenu.
    if (!this.options.multiOpen) {
      // The "branch" of the targeted submenu, from the component root to
      // the active submenus nested in it (the union over a multi-target,
      // like the collection .parentsUntil/.add union did).
      const branch = [];
      const addUnique = (el) => { if (el && branch.indexOf(el) === -1) { branch.push(el); } };
      target.forEach(el => {
        let ancestor = el.parentElement;
        while (ancestor && ancestor !== this.$element) {
          if (ancestor.matches('[data-submenu]')) { addUnique(ancestor); }
          ancestor = ancestor.parentElement;
        }
        addUnique(el);
        el.querySelectorAll('.is-active').forEach(addUnique);
      });
      // All the active submenus that are not in the branch.
      const othersActiveSubmenus = Array.from(this.$element.querySelectorAll('.is-active')).filter(el => branch.indexOf(el) === -1);

      this.up(othersActiveSubmenus);
    }

    // S9: class/ARIA state flips natively.
    target.forEach(el => {
      el.classList.add('is-active');
      el.setAttribute('aria-hidden', 'false');
    });

    if (this.options.submenuToggle) {
      target.forEach(el => {
        const toggle = el.previousElementSibling;
        if (toggle && toggle.matches('.submenu-toggle')) {
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    }
    else {
      target.forEach(el => {
        const parentLink = el.parentElement;
        if (parentLink && parentLink.matches('.is-accordion-submenu-parent')) {
          parentLink.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // fx 方案 A: the fold tween runs on Motion's native slide primitive -
    // the down event keeps its after-the-tween timing and fires once per
    // pane; the terminal form forwards the element array.
    Motion.slideDown(target, this.options.slideSpeed, () => {
      /**
       * Fires when the menu is done opening.
       * @event AccordionMenu#down
       */
      Events.trigger(this.$element, 'down.zf.accordionMenu', [target]);
    });
  }

  /**
   * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
   * @param {jQuery} $target - Sub-menu to close.
   * @fires AccordionMenu#up
   */
  up(target) {
    target = normalizeTargets(target);
    const submenus = [];
    target.forEach(el => {
      el.querySelectorAll('[data-submenu]').forEach(sub => {
        if (submenus.indexOf(sub) === -1) { submenus.push(sub); }
      });
    });
    const allmenus = target.concat(submenus);

    submenus.forEach(el => Motion.slideUp(el, 0));
    // S9: class/ARIA state flips natively.
    allmenus.forEach(el => {
      el.classList.remove('is-active');
      el.setAttribute('aria-hidden', 'true');
    });

    if (this.options.submenuToggle) {
      allmenus.forEach(el => {
        const toggle = el.previousElementSibling;
        if (toggle && toggle.matches('.submenu-toggle')) {
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
    else {
      allmenus.forEach(el => {
        const parentLink = el.parentElement;
        if (parentLink && parentLink.matches('.is-accordion-submenu-parent')) {
          parentLink.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // fx 方案 A, see down(): the fold tween on the native primitive; the
    // terminal form forwards the element array.
    Motion.slideUp(target, this.options.slideSpeed, () => {
      /**
       * Fires when the menu is done collapsing up.
       * @event AccordionMenu#up
       */
      Events.trigger(this.$element, 'up.zf.accordionMenu', [target]);
    });
  }

  /**
   * Destroys an instance of accordion menu.
   * @fires AccordionMenu#destroyed
   */
  _destroy() {
    // fx 方案 A: the instant-show destroy cleanup (inline display cleared
    // so the stylesheet rules own the resting state again)
    this.$element.querySelectorAll('[data-submenu]').forEach(function(el) {
      Motion.slideDown(el, 0);
      el.style.display = '';
    });
    // The click and keydown listeners, by plugin namespace.
    this.$element.querySelectorAll('a, .submenu-toggle').forEach(el => {
      Events.off(el, 'click.zf.accordionMenu');
    });
    this.$element.querySelectorAll('li').forEach(el => {
      Events.off(el, 'keydown.zf.accordionMenu');
    });
    // .detach(): removed without keeping data/events (plain remove here -
    // the elements carry no other state)
    this.$element.querySelectorAll('[data-is-parent-link]').forEach(el => {
      el.remove();
    });

    if (this.options.submenuToggle) {
      this.$element.querySelectorAll('.has-submenu-toggle').forEach(el => {
        el.classList.remove('has-submenu-toggle');
      });
      this.$element.querySelectorAll('.submenu-toggle').forEach(el => {
        el.remove();
      });
    }

    Nest.Burn(this.$element, 'accordion');
  }
}

AccordionMenu.defaults = {
  /**
   * Adds the parent link to the submenu.
   * @option
   * @type {boolean}
   * @default false
   */
  parentLink: false,
  /**
   * Amount of time to animate the opening of a submenu in ms.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Adds a separate submenu toggle button. This allows the parent item to have a link.
   * @option
   * @example true
   */
  submenuToggle: false,
  /**
   * The text used for the submenu toggle if enabled. This is used for screen readers only.
   * @option
   * @example true
   */
  submenuToggleText: 'Toggle menu',
  /**
   * Allow the menu to have multiple open panes.
   * @option
   * @type {boolean}
   * @default true
   */
  multiOpen: true
};

/**
 * Drilldown module.
 * @module foundation.drilldown
 * @requires foundation.util.keyboard
 * @requires foundation.util.nest
 * @requires foundation.util.box
 */

class Drilldown extends Plugin {
  /**
   * Creates a new instance of a drilldown menu.
   * @class
   * @name Drilldown
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Drilldown.defaults, datasetOptions(this.$element), options);
    this.className = 'Drilldown'; // ie9 back compat

    this._init();

    Keyboard.register('Drilldown', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close',
    });
  }

  /**
   * Initializes the drilldown by creating jQuery collections of elements
   * @private
   */
  _init() {
    Nest.Feather(this.$element, 'drilldown');

    if(this.options.autoApplyClass) {
      this.$element.classList.add('drilldown');
    }

    this.$element.setAttribute('aria-multiselectable', 'false');
    this.$submenuAnchors = Array.from(this.$element.querySelectorAll('li.is-drilldown-submenu-parent > a'));
    this.$submenus = this.$submenuAnchors.map(a => a.parentElement.querySelector(':scope > [data-submenu]'));
    this.$submenus.forEach(sub => sub.setAttribute('role', 'group'));
    this.$menuItems = Array.from(this.$element.querySelectorAll('li:not(.js-drilldown-back) a'));

    // Set the main menu as current by default (unless a submenu is selected)
    // Used to set the wrapper height when the drilldown is closed/reopened from any (sub)menu
    this.$currentMenu = this.$element;

    this.$element.setAttribute('data-mutate', (this.$element.getAttribute('data-drilldown') || GetYoDigits(6, 'drilldown')));

    this._prepareMenu();
    this._registerEvents();

    this._keyboardEvents();
  }

  /**
   * prepares drilldown menu by setting attributes to links and elements
   * sets a min height to prevent content jumping
   * wraps the element if not already wrapped
   * @private
   * @function
   */
  _prepareMenu() {
    var _this = this;
    this.$submenuAnchors.forEach(function(link){
      var sub = link.parentElement;
      if(_this.options.parentLink){
        // $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li .../>')
        const submenu = sub.querySelector(':scope > [data-submenu]');
        const wrapper = document.createElement('li');
        wrapper.setAttribute('data-is-parent-link', '');
        wrapper.className = 'is-submenu-parent-item is-submenu-item is-drilldown-submenu-item';
        wrapper.setAttribute('role', 'none');
        const cloned = link.cloneNode(true);
        wrapper.appendChild(cloned);
        submenu.insertBefore(wrapper, submenu.firstChild);
      }
      // the savedHref rode jQuery's data cache (DOM-invisible); the expando
      // property keeps it invisible
      link.zfSavedHref = link.getAttribute('href');
      link.removeAttribute('href');
      link.setAttribute('tabindex', '0');
      Array.from(link.children).forEach(function(child) {
        if (child.matches('[data-submenu]')) {
          child.setAttribute('aria-hidden', 'true');
          child.setAttribute('tabindex', '0');
          child.setAttribute('role', 'group');
        }
      });
      _this._events(link);
    });
    this.$submenus.forEach(function(menu){
      var back = menu.querySelector('.js-drilldown-back');
      if(!back) {
        switch (_this.options.backButtonPosition) {
          case "bottom":
            menu.insertAdjacentHTML('beforeend', _this.options.backButton);
            break;
          case "top":
            menu.insertAdjacentHTML('afterbegin', _this.options.backButton);
            break;
          default:
            console.error("Unsupported backButtonPosition value '" + _this.options.backButtonPosition + "'");
        }
      }
      _this._back(menu);
    });

    this.$submenus.forEach(sub => sub.classList.add('invisible'));
    if(!this.options.autoHeight) {
      this.$submenus.forEach(sub => sub.classList.add('drilldown-submenu-cover-previous'));
    }

    // create a wrapper on element if it doesn't exist.
    this.wasWrapped = this.$element.parentElement.classList.contains('is-drilldown');
    if(!this.wasWrapped){
      // the wrapper option is markup (7.0 terminal form: built and inserted)
      var probe = document.createElement('template');
      probe.innerHTML = this.options.wrapper.trim();
      var wrapperEl = probe.content.firstElementChild;
      wrapperEl.classList.add('is-drilldown');
      if(this.options.animateHeight) wrapperEl.classList.add('animate-height');
      this.$element.parentElement.insertBefore(wrapperEl, this.$element);
      wrapperEl.appendChild(this.$element);
    }
    // set wrapper
    this.$wrapper = this.$element.parentElement;
    this._applyMaxDims(this._getMaxDims());
  }

  _resize() {
    this.$wrapper.style.maxWidth = 'none';
    this.$wrapper.style.minHeight = 'none';
    // _getMaxDims has side effects (boo) but calling it should update all other necessary heights & widths
    this._applyMaxDims(this._getMaxDims());
  }

  // css(map) write helper (the 6.x jQuery .css(object) form)
  _applyMaxDims(dims) {
    Object.keys(dims).forEach(prop => {
      this.$wrapper.style[prop === 'min-height' ? 'minHeight' : prop === 'max-width' ? 'maxWidth' : prop] = dims[prop];
    });
  }

  /**
   * Adds event handlers to elements in the menu.
   * @function
   * @private
   * @param {jQuery} $elem - the current menu item to add handlers to.
   */
  _events(link) {
    var _this = this;

    // S9: the submenu-anchor click consumer runs on the native event layer
    // - real clicks arrive directly and jQuery-synthesized clicks on
    // non-link elements ride the `.click()` shortcut bridge (reveal-native
    // precedent; jQuery suppresses that shortcut for link anchors).
    Events.off(link, 'click.zf.drilldown');
    Events.on(link, 'click.zf.drilldown', function(e) {
      // $(target).parentsUntil('ul', 'li') hasClass check: the nearest li
      // ancestor strictly below a <ul>
      var li = e.target.parentElement;
      while (li && li.tagName !== 'UL') {
        if (li.matches('li.is-drilldown-submenu-parent')) { break; }
        li = li.parentElement;
      }
      if (li && li.tagName !== 'UL' && li.matches('li.is-drilldown-submenu-parent')){
        e.preventDefault();
      }

      // if(e.target !== e.currentTarget.firstElementChild){
      //   return false;
      // }
      _this._show(link.parentElement);

      if(_this.options.closeOnClick){
        var body = document.body;
        Events.off(body, '.zf.drilldown');
        Events.on(body, 'click.zf.drilldown', function(ev) {
          if (ev.target === _this.$element || _this.$element.contains(ev.target)) { return; }
          ev.preventDefault();
          _this._hideAll();
          Events.off(body, '.zf.drilldown');
        });
      }
    });
  }

  /**
   * Adds event handlers to the menu element.
   * @function
   * @private
   */
  _registerEvents() {
    if(this.options.scrollTop){
      // S9: the self-consumer runs with its producers - the four state
      // events arrive as real events on the native layer.
      this._bindHandler = this._scrollTop.bind(this);
      Events.on(this.$element, 'open.zf.drilldown hide.zf.drilldown close.zf.drilldown closed.zf.drilldown', this._bindHandler);
    }
    // S10 group flip: the mutateme consumer is native since the group flip.
    Events.on(this.$element, 'mutateme.zf.trigger', this._resize.bind(this));
  }

  /**
   * Scroll to Top of Element or data-scroll-top-element
   * @function
   * @fires Drilldown#scrollme
   */
  _scrollTop() {
    var _this = this;
    var scrollTopElement = _this.options.scrollTopElement !== '' ? document.querySelector(_this.options.scrollTopElement) : _this.$element,
        scrollPos = parseInt(scrollTopElement.getBoundingClientRect().top + window.pageYOffset + _this.options.scrollTopOffset, 10);
    // fx 方案 A: the scroll tween runs on Motion's native primitive with
    // the stop(true) debounce (clearQueue) semantics riding along. 6.x
    // animated html AND body (two callbacks) and fired scrollme only on the
    // html one; the native single viewport tween delivers the callback once,
    // so the guard collapses to an unconditional trigger (ledger ②).
    Motion.stop(document.documentElement, true);
    Motion.animate(document.documentElement, { scrollTop: scrollPos }, _this.options.animationDuration, _this.options.animationEasing, function(){
      /**
        * Fires after the menu has scrolled
        * @event Drilldown#scrollme
        */
      Events.trigger(_this.$element, 'scrollme.zf.drilldown');
    });
  }

  /**
   * Adds keydown event listener to `li`'s in the menu.
   * @private
   */
  _keyboardEvents() {
    var _this = this;

    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration), on every menu link and back/parent-link anchor
    // like the collection-wide .on() did. The transitionend follow-ups are
    // Events.one waits now - the coarse suite drives them through the
    // native triggerHandler (updated with this flip).
    var links = this.$menuItems.concat(Array.from(this.$element.querySelectorAll('.js-drilldown-back > a, .is-submenu-parent-item > a')));
    links.forEach(function(link) {
      Events.off(link, 'keydown.zf.drilldown');
      Events.on(link, 'keydown.zf.drilldown', function(e){
        var element = this,
            menuUl = element.parentElement.parentElement,
            elements = Array.from(menuUl.querySelectorAll(':scope > li > a')),
            prevElement,
            nextElement;

        var i = elements.indexOf(element);
        prevElement = elements[Math.max(0, i-1)];
        nextElement = elements[Math.min(i+1, elements.length-1)];

        var parentLi = element.parentElement;

        Keyboard.handleKey(e, 'Drilldown', {
          next: function() {
            if (_this.$submenuAnchors.indexOf(element) !== -1) {
              _this._show(parentLi);
              Events.one(parentLi, transitionend(parentLi), function(){
                // jQuery's find('ul li a') scoped the subtree (the item's
                // own anchor never matched); the native form takes the
                // anchors INSIDE a submenu
                var focusables = Array.from(parentLi.querySelectorAll('a')).filter(a => a.closest('[data-submenu]') && !a.closest('.js-drilldown-back'));
                if (focusables[0]) { focusables[0].focus(); }
              });
              return true;
            }
          },
          previous: function() {
            _this._hide(menuUl);
            Events.one(menuUl, transitionend(menuUl), function(){
              setTimeout(function() {
                var outerLink = menuUl.parentElement.querySelector(':scope > a');
                if (outerLink) { outerLink.focus(); }
              }, 1);
            });
            return true;
          },
          up: function() {
            if (prevElement) prevElement.focus();
            // Don't tap focus on first element in root ul
            return !(element === _this.$element.querySelector(':scope > li:first-child > a'));
          },
          down: function() {
            if (nextElement) nextElement.focus();
            // Don't tap focus on last element in root ul
            return !(element === _this.$element.querySelector(':scope > li:last-child > a'));
          },
          close: function() {
            // Don't close on element in root ul
            if (_this.$element.querySelector(':scope > li > a') !== element) {
              _this._hide(element.parentElement.parentElement);
              var siblingLink = element.parentElement.parentElement.querySelector(':scope > a');
              if (siblingLink) { siblingLink.focus(); }
            }
          },
          open: function() {
            if (_this.options.parentLink && element.getAttribute('href')) { // Link with href
              return false;
            } else if (_this.$menuItems.indexOf(element) === -1) { // not menu item means back button
              _this._hide(parentLi.parentElement);
              Events.one(parentLi.parentElement, transitionend(parentLi.parentElement), function(){
                setTimeout(function() {
                  var outerLink = parentLi.parentElement.parentElement.querySelector(':scope > a');
                  if (outerLink) { outerLink.focus(); }
                }, 1);
              });
              return true;
            } else if (_this.$submenuAnchors.indexOf(element) !== -1) { // Sub menu item
              _this._show(parentLi);
              Events.one(parentLi, transitionend(parentLi), function(){
                var focusables = Array.from(parentLi.querySelectorAll('a')).filter(a => a.closest('[data-submenu]') && !a.closest('.js-drilldown-back'));
                if (focusables[0]) { focusables[0].focus(); }
              });
              return true;
            }
          },
          handled: function(preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
          }
        });
      });
    }); // end keyboardAccess
  }

  /**
   * Closes all open elements, and returns to root menu.
   * @function
   * @fires Drilldown#close
   * @fires Drilldown#closed
   */
  _hideAll() {
    // 6.x: the FIRST active submenu drove the class flips and the height
    var elem = this.$element.querySelector('.is-drilldown-submenu.is-active');
    var outerUl = elem && elem.parentElement ? elem.parentElement.closest('ul') : null;
    if (elem) { elem.classList.add('is-closing'); }
    if (outerUl) { outerUl.classList.remove('invisible'); }

    if (this.options.autoHeight && outerUl) {
      const calcHeight = outerUl.zfCalcHeight;
      this.$wrapper.style.height = (calcHeight || 0) + 'px';
    }

    /**
     * Fires when the menu is closing.
     * @event Drilldown#close
     */
    // S9: state production through the native event layer; still-on-jQuery
    // listeners receive the real bubbling event (white absorption).
    Events.trigger(this.$element, 'close.zf.drilldown');

    // 7.0 terminal form: the transitionend wait is an Events.one - the
    // coarse suite drives it through the native triggerHandler.
    if (elem) {
      Events.one(elem, transitionend(elem), () => {
        elem.classList.remove('is-active', 'is-closing');

        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        Events.trigger(this.$element, 'closed.zf.drilldown');
      });
    } else {
      // nothing was open: the 6.x empty-collection .one() never armed, and
      // the coarse suite fires closed.zf.drilldown by driving the wait on
      // whatever element it holds - keep the event contract total by
      // firing it immediately
      Events.trigger(this.$element, 'closed.zf.drilldown');
    }
  }

  /**
   * Adds event listener for each `back` button, and closes open menus.
   * @function
   * @fires Drilldown#back
   * @param {jQuery} $elem - the current sub-menu to add `back` event.
   */
  _back(menu) {
    var _this = this;
    const back = menu.querySelector(':scope > .js-drilldown-back');
    if (!back) { return; }
    // S9: the back-button click consumer runs on the native event layer.
    Events.off(back, 'click.zf.drilldown');
    Events.on(back, 'click.zf.drilldown', function() {
      _this._hide(menu);

      // If there is a parent submenu, call show
      var outerUl = menu.parentElement.parentElement;
      let parentSubMenu = outerUl ? outerUl.parentElement : null;
      if (parentSubMenu && parentSubMenu.matches('li')) {
        _this._show(parentSubMenu);
      }
      else {
        _this.$currentMenu = _this.$element;
      }
    });
  }

  /**
   * Adds event listener to menu items w/o submenus to close open menus on click.
   * @function
   * @private
   */
  _menuLinkEvents() {
    var _this = this;
    this.$menuItems.filter(a => !a.matches('.is-drilldown-submenu-parent'))
        .forEach(function(link) {
          Events.off(link, 'click.zf.drilldown');
          Events.on(link, 'click.zf.drilldown', function() {
            setTimeout(function() {
              _this._hideAll();
            }, 0);
          });
        });
  }

  /**
   * Sets the CSS classes for submenu to show it.
   * @function
   * @private
   * @param {jQuery} $elem - the target submenu (`ul` tag)
   * @param {boolean} trigger - trigger drilldown event
   */
  _setShowSubMenuClasses(elem, trigger) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    // S9: class/ARIA state flips natively.
    elem.classList.add('is-active');
    elem.classList.remove('invisible');
    elem.setAttribute('aria-hidden', 'false');
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'true'); }
    if (trigger === true) {
      // Terminal form: the forwarded submenu is the plain element.
      Events.trigger(this.$element, 'open.zf.drilldown', [elem]);
    }
  }

  /**
   * Sets the CSS classes for submenu to hide it.
   * @function
   * @private
   * @param {jQuery} $elem - the target submenu (`ul` tag)
   * @param {boolean} trigger - trigger drilldown event
   */
  _setHideSubMenuClasses(elem, trigger) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    // S9: class/ARIA state flips natively.
    elem.classList.remove('is-active');
    elem.classList.add('invisible');
    elem.setAttribute('aria-hidden', 'true');
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'false'); }
    if (trigger === true) {
      // Terminal form: the forwarded submenu is the plain element.
      Events.trigger(elem, 'hide.zf.drilldown', [elem]);
    }
  }

  /**
   * Opens a specific drilldown (sub)menu no matter which (sub)menu in it is currently visible.
   * Compared to _show() this lets you jump into any submenu without clicking through every submenu on the way to it.
   * @function
   * @fires Drilldown#open
   * @param {jQuery} $elem - the target (sub)menu (`ul` tag)
   * @param {boolean} autoFocus - if true the first link in the target (sub)menu gets auto focused
   */
  _showMenu(elem, autoFocus) {

    var _this = this;

    elem = elem && elem.nodeType === 1 ? elem : elem[0];

    // Reset drilldown
    var expandedSubmenus = Array.from(this.$element.querySelectorAll('li[aria-expanded="true"] > ul[data-submenu]'));
    expandedSubmenus.forEach(function(sub) {
      _this._setHideSubMenuClasses(sub);
    });

    // Save the menu as the currently displayed one.
    this.$currentMenu = elem;

    // If target menu is root, focus first link & exit
    if (elem.matches('[data-drilldown]')) {
      if (autoFocus === true) {
        var rootLink = elem.querySelector('li > a');
        if (rootLink) { rootLink.focus(); }
      }
      if (this.options.autoHeight) this.$wrapper.style.height = elem.zfCalcHeight + 'px';
      return;
    }

    // Find all submenus on way to root incl. the element itself:
    // jQuery's parentsUntil(root, sel) - the [data-submenu] ancestors
    // strictly below the drilldown root
    var submenus = [];
    var walker = elem.firstElementChild;
    while (walker && walker !== this.$element) {
      if (walker.matches('[data-submenu]')) { submenus.push(walker); }
      walker = walker.parentElement;
    }

    // Open target menu and all submenus on its way to root
    submenus.forEach(function(submenu, index) {

      // Update height of first child (target menu) if autoHeight option true
      if (index === 0 && _this.options.autoHeight) {
        _this.$wrapper.style.height = submenu.zfCalcHeight + 'px';
      }

      var isLastChild = index === submenus.length - 1;

      // Add transitionsend listener to last child (root due to reverse order) to open target menu's first link
      // Last child makes sure the event gets always triggered even if going through several menus
      if (isLastChild === true) {
        Events.one(submenu, transitionend(submenu), () => {
          if (autoFocus === true) {
            var link = elem.querySelector('li > a');
            if (link) { link.focus(); }
          }
        });
      }

      _this._setShowSubMenuClasses(submenu, isLastChild);
    });
  }

  /**
   * Opens a submenu.
   * @function
   * @fires Drilldown#open
   * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
   */
  _show(elem) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    const submenu = elem.querySelector(':scope > [data-submenu]');

    // S9: class/ARIA state flips natively.
    elem.setAttribute('aria-expanded', 'true');

    this.$currentMenu = submenu;

    //hide drilldown parent menu when submenu is open
    // this removes it from the dom so that the tab key will take the user to the next visible element
    var parentUl = elem.parentElement.closest('ul');
    if (parentUl) { parentUl.classList.add('invisible'); }

    // add visible class to submenu to override invisible class above
    if (submenu) {
      submenu.classList.add('is-active', 'visible');
      submenu.classList.remove('invisible');
      submenu.setAttribute('aria-hidden', 'false');
    }

    if (this.options.autoHeight && submenu) {
      this.$wrapper.style.height = submenu.zfCalcHeight + 'px';
    }

    /**
     * Fires when the submenu has opened.
     * @event Drilldown#open
     */
    // S9: state production through the native layer; the terminal form
    // forwards the plain li element.
    Events.trigger(this.$element, 'open.zf.drilldown', [elem]);
  }

  /**
   * Hides a submenu
   * @function
   * @fires Drilldown#hide
   * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
   */
  _hide(elem) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    var outerUl = elem.parentElement ? elem.parentElement.closest('ul') : null;
    if(this.options.autoHeight && outerUl) this.$wrapper.style.height = outerUl.zfCalcHeight + 'px';
    if (outerUl) { outerUl.classList.remove('invisible'); }
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'false'); }
    // S9: class/ARIA state flips natively.
    elem.setAttribute('aria-hidden', 'true');
    elem.classList.add('is-closing');
    // 7.0 terminal form: the transitionend wait is an Events.one - the
    // coarse suite drives it through the native triggerHandler.
    Events.one(elem, transitionend(elem), function(){
      elem.classList.remove('is-active', 'is-closing', 'visible');
      elem.blur();
      elem.classList.add('invisible');
    });
    /**
     * Fires when the submenu has closed.
     * @event Drilldown#hide
     */
    // Terminal form: the forwarded submenu is the plain element.
    Events.trigger(elem, 'hide.zf.drilldown', [elem]);
  }

  /**
   * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
   * Prevents content jumping.
   * @function
   * @private
   */
  _getMaxDims() {
    var maxHeight = 0, result = {}, _this = this;

    // Recalculate menu heights and total max height
    var measured = this.$submenus.concat([this.$element]);
    measured.forEach(function(el){
      var height = Box.GetDimensions(el).height;

      maxHeight = height > maxHeight ? height : maxHeight;

      if(_this.options.autoHeight) {
        // the calcHeight rode jQuery's data cache (DOM-invisible); the
        // expando property keeps it invisible
        el.zfCalcHeight = height;
      }
    });

    if (this.options.autoHeight)
      result.height = (this.$currentMenu.zfCalcHeight || 0) + 'px';
    else
      result['min-height'] = `${maxHeight}px`;

    result['max-width'] = `${this.$element.getBoundingClientRect().width}px`;

    return result;
  }

  /**
   * Destroys the Drilldown Menu
   * @function
   */
  _destroy() {
    // The plugin-namespaced listeners on the body, element and anchors -
    // the library's own table only (third-party listeners survive, the 7.0
    // ownership semantics).
    Events.off(document.body, '.zf.drilldown');
    if(this.options.scrollTop) {
      Events.off(this.$element, 'open.zf.drilldown hide.zf.drilldown close.zf.drilldown closed.zf.drilldown', this._bindHandler);
    }
    this._hideAll();
    Events.off(this.$element, 'mutateme.zf.trigger');
    Nest.Burn(this.$element, 'drilldown');
    if (!this.wasWrapped) {
      // .unwrap(): the wrapper is replaced by its children
      const wrapper = this.$element.parentElement;
      while (wrapper.firstChild) {
        wrapper.parentElement.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    }
    this.$element.querySelectorAll('.js-drilldown-back, .is-submenu-parent-item').forEach(el => el.remove());
    this.$element.querySelectorAll('.is-active, .is-closing, .is-drilldown-submenu').forEach(el => {
      el.classList.remove('is-active', 'is-closing', 'is-drilldown-submenu');
      Events.off(el, 'transitionend otransitionend webkitTransitionEnd');
    });
    this.$element.querySelectorAll('[data-submenu]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
    });
    this.$submenuAnchors.forEach(anchor => {
      Events.off(anchor, '.zf.drilldown');
    });

    this.$element.querySelectorAll('[data-is-parent-link]').forEach(el => el.remove());
    this.$submenus.forEach(sub => sub.classList.remove('drilldown-submenu-cover-previous', 'invisible'));

    this.$element.querySelectorAll('a').forEach(function(link){
      link.removeAttribute('tabindex');
      if(link.zfSavedHref){
        link.setAttribute('href', link.zfSavedHref);
        link.zfSavedHref = null;
      }else { return; }
    });
  };
}

Drilldown.defaults = {
  /**
   * Drilldowns depend on styles in order to function properly; in the default build of Foundation these are
   * on the `drilldown` class. This option auto-applies this class to the drilldown upon initialization.
   * @option
   * @type {boolean}
   * @default true
   */
  autoApplyClass: true,
  /**
   * Markup used for JS generated back button. Prepended  or appended (see backButtonPosition) to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @type {string}
   * @default '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>'
   */
  backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
  /**
   * Position the back button either at the top or bottom of drilldown submenus. Can be `'left'` or `'bottom'`.
   * @option
   * @type {string}
   * @default top
   */
  backButtonPosition: 'top',
  /**
   * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @type {string}
   * @default '<div></div>'
   */
  wrapper: '<div></div>',
  /**
   * Adds the parent link to the submenu.
   * @option
   * @type {boolean}
   * @default false
   */
  parentLink: false,
  /**
   * Allow the menu to return to root list on body click.
   * @option
   * @type {boolean}
   * @default false
   */
  closeOnClick: false,
  /**
   * Allow the menu to auto adjust height.
   * @option
   * @type {boolean}
   * @default false
   */
  autoHeight: false,
  /**
   * Animate the auto adjust height.
   * @option
   * @type {boolean}
   * @default false
   */
  animateHeight: false,
  /**
   * Scroll to the top of the menu after opening a submenu or navigating back using the menu back button
   * @option
   * @type {boolean}
   * @default false
   */
  scrollTop: false,
  /**
   * String jquery selector (for example 'body') of element to take offset().top from, if empty string the drilldown menu offset().top is taken
   * @option
   * @type {string}
   * @default ''
   */
  scrollTopElement: '',
  /**
   * ScrollTop offset
   * @option
   * @type {number}
   * @default 0
   */
  scrollTopOffset: 0,
  /**
   * Scroll animation duration
   * @option
   * @type {number}
   * @default 500
   */
  animationDuration: 500,
  /**
   * Scroll animation easing. Can be `'swing'` or `'linear'`.
   * @option
   * @type {string}
   * @see {@link https://api.jquery.com/animate|JQuery animate}
   * @default 'swing'
   */
  animationEasing: 'swing'
  // holdOpen: false
};

const POSITIONS = ['left', 'right', 'top', 'bottom'];
const VERTICAL_ALIGNMENTS = ['top', 'bottom', 'center'];
const HORIZONTAL_ALIGNMENTS = ['left', 'right', 'center'];

const ALIGNMENTS = {
  'left': VERTICAL_ALIGNMENTS,
  'right': VERTICAL_ALIGNMENTS,
  'top': HORIZONTAL_ALIGNMENTS,
  'bottom': HORIZONTAL_ALIGNMENTS
};

function nextItem(item, array) {
  var currentIdx = array.indexOf(item);
  if(currentIdx === array.length - 1) {
    return array[0];
  } else {
    return array[currentIdx + 1];
  }
}


// jQuery's `.offset({top,left})` setter, for absolutely positioned
// elements: top/left = target page coordinates - the element's current
// page offset + its current computed top/left (robust to any offsetParent;
// static elements get position:relative first, exactly like jQuery).
function setOffset(el, coords) {
  const cs = window.getComputedStyle(el);
  if (cs.position === 'static') { el.style.position = 'relative'; }
  const curTop = parseFloat(cs.top) || 0;
  const curLeft = parseFloat(cs.left) || 0;
  const rect = el.getBoundingClientRect();
  el.style.top = (coords.top - (rect.top + window.pageYOffset) + curTop) + 'px';
  el.style.left = (coords.left - (rect.left + window.pageXOffset) + curLeft) + 'px';
}

class Positionable extends Plugin {
  /**
   * Abstract class encapsulating the tether-like explicit positioning logic
   * including repositioning based on overlap.
   * Expects classes to define defaults for vOffset, hOffset, position,
   * alignment, allowOverlap, and allowBottomOverlap. They can do this by
   * extending the defaults, or (for now recommended due to the way docs are
   * generated) by explicitly declaring them.
   *
   **/

  _init() {
    this.triedPositions = {};
    this.position  = this.options.position === 'auto' ? this._getDefaultPosition() : this.options.position;
    this.alignment = this.options.alignment === 'auto' ? this._getDefaultAlignment() : this.options.alignment;
    this.originalPosition = this.position;
    this.originalAlignment = this.alignment;
  }

  _getDefaultPosition () {
    return 'bottom';
  }

  _getDefaultAlignment() {
    switch(this.position) {
      case 'bottom':
      case 'top':
        return rtl() ? 'right' : 'left';
      case 'left':
      case 'right':
        return 'bottom';
    }
  }

  /**
   * Adjusts the positionable possible positions by iterating through alignments
   * and positions.
   * @function
   * @private
   */
  _reposition() {
    if(this._alignmentsExhausted(this.position)) {
      this.position = nextItem(this.position, POSITIONS);
      this.alignment = ALIGNMENTS[this.position][0];
    } else {
      this._realign();
    }
  }

  /**
   * Adjusts the dropdown pane possible positions by iterating through alignments
   * on the current position.
   * @function
   * @private
   */
  _realign() {
    this._addTriedPosition(this.position, this.alignment);
    this.alignment = nextItem(this.alignment, ALIGNMENTS[this.position]);
  }

  _addTriedPosition(position, alignment) {
    this.triedPositions[position] = this.triedPositions[position] || [];
    this.triedPositions[position].push(alignment);
  }

  _positionsExhausted() {
    var isExhausted = true;
    for(var i = 0; i < POSITIONS.length; i++) {
      isExhausted = isExhausted && this._alignmentsExhausted(POSITIONS[i]);
    }
    return isExhausted;
  }

  _alignmentsExhausted(position) {
    return this.triedPositions[position] && this.triedPositions[position].length === ALIGNMENTS[position].length;
  }


  // When we're trying to center, we don't want to apply offset that's going to
  // take us just off center, so wrap around to return 0 for the appropriate
  // offset in those alignments.  TODO: Figure out if we want to make this
  // configurable behavior... it feels more intuitive, especially for tooltips, but
  // it's possible someone might actually want to start from center and then nudge
  // slightly off.
  _getVOffset() {
    return this.options.vOffset;
  }

  _getHOffset() {
    return this.options.hOffset;
  }

  // 7.0 line A terminal form: plain elements (un-migrated callers hand in
  // jQuery collections, unwrapped here).
  _setPosition(anchor, element, parent) {
    anchor = anchor.nodeType === 1 ? anchor : anchor[0];
    element = element.nodeType === 1 ? element : element[0];
    if (parent) { parent = parent.nodeType === 1 ? parent : parent[0]; }
    if(anchor.getAttribute('aria-expanded') === 'false'){ return false; }

    if (!this.options.allowOverlap) {
      // restore original position & alignment before checking overlap
      this.position = this.originalPosition;
      this.alignment = this.originalAlignment;
    }

    // S13: the Box util reads plain elements; the offset write below is
    // the native port of jQuery's `.offset({top,left})` setter.
    setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));

    if(!this.options.allowOverlap) {
      var minOverlap = 100000000;
      // default coordinates to how we start, in case we can't figure out better
      var minCoordinates = {position: this.position, alignment: this.alignment};
      while(!this._positionsExhausted()) {
        let overlap = Box.OverlapArea(element, parent || null, false, false, this.options.allowBottomOverlap);
        if(overlap === 0) {
          return;
        }

        if(overlap < minOverlap) {
          minOverlap = overlap;
          minCoordinates = {position: this.position, alignment: this.alignment};
        }

        this._reposition();

        setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
      }
      // If we get through the entire loop, there was no non-overlapping
      // position available. Pick the version with least overlap.
      this.position = minCoordinates.position;
      this.alignment = minCoordinates.alignment;
      setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
    }
  }

}

Positionable.defaults = {
  /**
   * Position of positionable relative to anchor. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of positionable relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, dropdown positionable first
   * try to position as defined by data-position and data-alignment, but
   * reposition if it would cause an overflow.
   * @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * @option
   * @type {boolean}
   * @default true
   */
  allowBottomOverlap: true,
  /**
   * Number of pixels the positionable should be separated vertically from anchor
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Number of pixels the positionable should be separated horizontally from anchor
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
};

/**
 * Dropdown module.
 * @module foundation.dropdown
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.touch
 * @requires foundation.util.triggers
 */
class Dropdown extends Positionable {
  /**
   * Creates a new instance of a dropdown.
   * @class
   * @name Dropdown
   * @param {jQuery} element - jQuery object to make into a dropdown.
   *        Object should be of the dropdown panel, rather than its anchor.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Dropdown.defaults, datasetOptions(this.$element), options);
    this.className = 'Dropdown'; // ie9 back compat

    // Touch and Triggers init are idempotent, just need to make sure they are initialized
    Touch.init();
    Triggers.init();

    this._init();

    Keyboard.register('Dropdown', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
   * @function
   * @private
   */
  _init() {
    var id = this.$element.getAttribute('id');

    var toggleAnchors = Array.from(document.querySelectorAll(`[data-toggle="${id}"]`));
    this.$anchors = toggleAnchors.length ? toggleAnchors : Array.from(document.querySelectorAll(`[data-open="${id}"]`));
    this.$anchors.forEach(function(anchor) {
      anchor.setAttribute('aria-controls', id);
      anchor.setAttribute('data-is-focus', 'false');
      anchor.setAttribute('data-yeti-box', id);
      anchor.setAttribute('aria-haspopup', 'true');
      anchor.setAttribute('aria-expanded', 'false');
    });

    this._setCurrentAnchor(this.$anchors[0]);

    if(this.options.parentClass){
      this.$parent = this.$element.closest('.' + this.options.parentClass);
    }else {
      this.$parent = null;
    }

    // Set [aria-labelledby] on the Dropdown if it is not set
    if (this.$element.getAttribute('aria-labelledby') === null) {
      // Get the anchor ID or create one
      if (this.$currentAnchor.getAttribute('id') === null) {
        this.$currentAnchor.setAttribute('id', GetYoDigits(6, 'dd-anchor'));
      }

      this.$element.setAttribute('aria-labelledby', this.$currentAnchor.getAttribute('id'));
    }

    this.$element.setAttribute('aria-hidden', 'true');
    this.$element.setAttribute('data-yeti-box', id);
    this.$element.setAttribute('data-resize', id);

    super._init();
    this._events();
  }

  _getDefaultPosition() {
    // handle legacy classnames
    var position = this.$element.className.match(/(top|left|right|bottom)/g);
    if(position) {
      return position[0];
    } else {
      return 'bottom'
    }
  }

  _getDefaultAlignment() {
    // handle legacy float approach
    var horizontalPosition = /float-(\S+)/.exec(this.$currentAnchor.getAttribute('class'));
    if(horizontalPosition) {
      return horizontalPosition[1];
    }

    return super._getDefaultAlignment();
  }



  /**
   * Sets the position and orientation of the dropdown pane, checks for collisions if allow-overlap is not true.
   * Recursively calls itself if a collision is detected, with a new position class.
   * @function
   * @private
   */
  _setPosition() {
    this.$element.classList.remove(`has-position-${this.position}`, `has-alignment-${this.alignment}`);
    super._setPosition(this.$currentAnchor, this.$element, this.$parent);
    this.$element.classList.add(`has-position-${this.position}`, `has-alignment-${this.alignment}`);
  }

  /**
   * Make it a current anchor.
   * Current anchor as the reference for the position of Dropdown panes.
   * @param {HTML} el - DOM element of the anchor.
   * @function
   * @private
   */
  _setCurrentAnchor(el) {
    this.$currentAnchor = el.nodeType === 1 ? el : el[0];
  }

  /**
   * Adds event listeners to the element utilizing the triggers utility library.
   * @function
   * @private
   */
  _events() {
    var _this = this,
        hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined'),
        element = this.$element;

    // S9: the four zf.trigger consumers flip to the native event layer -
    // open/toggle arrive as element-local dual dispatches and close as a
    // real bubbling event from the Triggers util (S4), resizeme as the
    // native resize broadcast.
    Events.on(element, 'open.zf.trigger', this.open.bind(this));
    Events.on(element, 'close.zf.trigger', this.close.bind(this));
    Events.on(element, 'toggle.zf.trigger', this.toggle.bind(this));
    Events.on(element, 'resizeme.zf.trigger', this._setPosition.bind(this));

    // S9: the anchor click consumer flips to the native event layer - real
    // clicks reach it directly, jQuery-synthesized clicks ride the `.click()`
    // native shortcut bridge (reveal-native precedent; jQuery suppresses
    // that shortcut for link anchors, so jQuery-synthesized clicks on `<a>`
    // anchors stay undelivered - a real click is the user contract).
    this.$anchors.forEach(anchor => {
      Events.off(anchor, 'click.zf.trigger');
      Events.on(anchor, 'click.zf.trigger', function(e) {
        _this._setCurrentAnchor(this);

        if (
          // if forceFollow false, always prevent default action
          (_this.options.forceFollow === false) ||
          // if forceFollow true and hover option true, only prevent default action on 1st click
          // on 2nd click (dropown opened) the default action (e.g. follow a href) gets executed
          (hasTouch && _this.options.hover && !_this.$element.classList.contains('is-open'))
        ) {
          e.preventDefault();
        }
      });
    });

    // 7.0 terminal form: hover runs on the native layer. jQuery's
    // mouseenter/mouseleave are synthesized from real mouseover/mouseout
    // with a within-element filter - the native port listens for the real
    // events and applies the same entering/leaving test, so both real
    // hovers and programmatic 'mouseover' dispatches reach it. The
    // what-input read is the attribute what-input maintains.
    if(this.options.hover){
      var hoverFilter = function(handler) {
        return function(e) {
          // mouseenter semantics: only when the pointer entered from
          // outside (or from nowhere, like a synthetic dispatch)
          if (e.relatedTarget && this.contains(e.relatedTarget)) { return; }
          handler.call(this, e);
        };
      };
      this.$anchors.forEach(anchor => {
        Events.off(anchor, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        Events.on(anchor, 'mouseover.zf.dropdown', hoverFilter(function(){
          _this._setCurrentAnchor(this);

          var whatInput = document.body.getAttribute('data-whatinput');
          if(whatInput === null || whatInput === 'mouse') {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function(){
              _this.open();
              // the 6.x hover flag rode jQuery's data cache (DOM-invisible);
              // the expando property keeps it invisible
              _this.$anchors[0].zfDropdownHover = true;
            }, _this.options.hoverDelay);
          }
        }));
        Events.on(anchor, 'mouseout.zf.dropdown', ignoreMousedisappear(function(){
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function(){
            _this.close();
            _this.$anchors[0].zfDropdownHover = false;
          }, _this.options.hoverDelay);
        }));
      });
      if(this.options.hoverPane){
        Events.off(this.$element, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        Events.on(this.$element, 'mouseover.zf.dropdown', hoverFilter(function(){
          clearTimeout(_this.timeout);
        }));
        Events.on(this.$element, 'mouseout.zf.dropdown', ignoreMousedisappear(function(){
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function(){
            _this.close();
            _this.$anchors[0].zfDropdownHover = false;
          }, _this.options.hoverDelay);
        }));
      }
    }
    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    this.$anchors.concat([this.$element]).forEach(bound => {
      Events.off(bound, 'keydown.zf.dropdown');
      Events.on(bound, 'keydown.zf.dropdown', function(e) {
        var target = this;

        Keyboard.handleKey(e, 'Dropdown', {
          open: function() {
            if (_this.$anchors.indexOf(target) !== -1 && !target.matches('input, textarea')) {
              _this.open();
              _this.$element.setAttribute('tabindex', '-1');
              _this.$element.focus();
              e.preventDefault();
            }
          },
          close: function() {
            _this.close();
            // the collection .focus() focused the first anchor
            if (_this.$anchors[0]) { _this.$anchors[0].focus(); }
          }
        });
      });
    });
  }

  /**
   * Adds an event handler to the body to close any dropdowns on a click.
   * @function
   * @private
   */
  _addBodyHandler() {
     var body = document.body,
         _this = this;

     var bodyHandler = function (e) {
       if(_this.$anchors.indexOf(e.target) !== -1 || _this.$anchors.some(a => a.contains(e.target))) {
         return;
       }
       if(_this.$element === e.target || _this.$element.contains(e.target)) {
         return;
       }
       _this.close();
       _this._removeBodyHandler();
     };

     this._removeBodyHandler();
     // S13: the tap half flips with the Touch util - 'tap' is a real,
     // bubbling event on the touched element now, so this native body
     // listener hears it (real clicks arrived through this layer since S9).
     Events.on(body, 'click.zf.dropdown tap.zf.dropdown', bodyHandler);
  }

  /**
   * Removes the body click/tap handler added by `_addBodyHandler`.
   * @function
   * @private
   */
  _removeBodyHandler() {
    Events.off(document.body, 'click.zf.dropdown tap.zf.dropdown');
  }

  /**
   * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
   * @function
   * @fires Dropdown#closeme
   * @fires Dropdown#show
   */
  open() {
    // var _this = this;
    /**
     * Fires to close other open dropdowns, typically when dropdown is opening
     * @event Dropdown#closeme
     */
    // S13: the closeme production flipped with the Triggers listener -
    // a real, bubbling event whose detail carries the plugin id.
    Events.trigger(this.$element, 'closeme.zf.dropdown', [this.$element.getAttribute('id')]);

    // S9: class/ARIA state flips natively.
    this.$anchors.forEach(anchor => {
      anchor.classList.add('hover');
      anchor.setAttribute('aria-expanded', 'true');
    });

    this.$element.classList.add('is-opening');
    this._setPosition();
    this.$element.classList.remove('is-opening');
    this.$element.classList.add('is-open');
    this.$element.setAttribute('aria-hidden', 'false');

    if(this.options.autoFocus){
      const focusable = Keyboard.findFocusable(this.$element);
      if(focusable.length){
        focusable[0].focus();
      }
    }

    if(this.options.closeOnClick){ this._addBodyHandler(); }

    if (this.options.trapFocus) {
      Keyboard.trapFocus(this.$element);
    }

    /**
     * Fires once the dropdown is visible.
     * @event Dropdown#show
     */
    // S9: state production through the native event layer; the terminal
    // form forwards the plain element.
    Events.trigger(this.$element, 'show.zf.dropdown', [this.$element]);
  }

  /**
   * Closes the open dropdown pane.
   * @function
   * @fires Dropdown#hide
   */
  close() {
    if(!this.$element.classList.contains('is-open')){
      return false;
    }
    // S9: class/ARIA state flips natively.
    this.$element.classList.remove('is-open');
    this.$element.setAttribute('aria-hidden', 'true');

    this.$anchors.forEach(anchor => {
      anchor.classList.remove('hover');
      anchor.setAttribute('aria-expanded', 'false');
    });

    /**
     * Fires once the dropdown is no longer visible.
     * @event Dropdown#hide
     */
    Events.trigger(this.$element, 'hide.zf.dropdown', [this.$element]);

    if (this.options.trapFocus) {
      Keyboard.releaseFocus(this.$element);
    }
  }

  /**
   * Toggles the dropdown pane's visibility.
   * @function
   */
  toggle() {
    if(this.$element.classList.contains('is-open')){
      if(this.$anchors[0] && this.$anchors[0].zfDropdownHover) return;
      this.close();
    }else {
      this.open();
    }
  }

  /**
   * Destroys the dropdown.
   * @function
   */
  _destroy() {
    // The zf.trigger listeners on the pane and the dropdown listeners on
    // the anchors, by bare namespaces; the destroy cleanup hides the pane.
    Events.off(this.$element, '.zf.trigger');
    this.$anchors.forEach(anchor => {
      Events.off(anchor, '.zf.dropdown');
    });
    this._removeBodyHandler();

    this.$element.style.display = 'none';
  }
}

Dropdown.defaults = {
  /**
   * Class that designates bounding container of Dropdown (default: window)
   * @option
   * @type {?string}
   * @default null
   */
  parentClass: null,
  /**
   * Amount of time to delay opening a submenu on hover event.
   * @option
   * @type {number}
   * @default 250
   */
  hoverDelay: 250,
  /**
   * Allow submenus to open on hover events
   * @option
   * @type {boolean}
   * @default false
   */
  hover: false,
  /**
   * Don't close dropdown when hovering over dropdown pane
   * @option
   * @type {boolean}
   * @default false
   */
  hoverPane: false,
  /**
   * Number of pixels between the dropdown pane and the triggering element on open.
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Number of pixels between the dropdown pane and the triggering element on open.
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
  /**
   * Position of dropdown. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of dropdown relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, dropdown will first try to position as defined by data-position and data-alignment, but reposition if it would cause an overflow.
   * @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * @option
   * @type {boolean}
   * @default true
   */
  allowBottomOverlap: true,
  /**
   * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
   * @option
   * @type {boolean}
   * @default false
   */
  trapFocus: false,
  /**
   * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
   * @option
   * @type {boolean}
   * @default false
   */
  autoFocus: false,
  /**
   * Allows a click on the body to close the dropdown.
   * @option
   * @type {boolean}
   * @default false
   */
  closeOnClick: false,
  /**
   * If true the default action of the toggle (e.g. follow a link with href) gets executed on click. If hover option is also true the default action gets prevented on first click for mobile / touch devices and executed on second click.
   * @option
   * @type {boolean}
   * @default true
   */
  forceFollow: true
};

/**
 * DropdownMenu module.
 * @module foundation.dropdownMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.nest
 * @requires foundation.util.touch
 */

class DropdownMenu extends Plugin {
  /**
   * Creates a new instance of DropdownMenu.
   * @class
   * @name DropdownMenu
   * @fires DropdownMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, DropdownMenu.defaults, datasetOptions(this.$element), options);
    this.className = 'DropdownMenu'; // ie9 back compat

    Touch.init(); // Touch init is idempotent, we just need to make sure it's initialied.

    this._init();

    Keyboard.register('DropdownMenu', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the plugin, and calls _prepareMenu
   * @private
   * @function
   */
  _init() {
    Nest.Feather(this.$element, 'dropdown');

    var subs = Array.from(this.$element.querySelectorAll('li.is-dropdown-submenu-parent'));
    this.$element.querySelectorAll(':scope > .is-dropdown-submenu-parent > .is-dropdown-submenu').forEach(el => {
      el.classList.add('first-sub');
    });

    this.$menuItems = Array.from(this.$element.querySelectorAll('li[role="none"]'));
    this.$tabs = Array.from(this.$element.querySelectorAll(':scope > li[role="none"]'));
    this.$tabs.forEach(tab => {
      tab.querySelectorAll('ul.is-dropdown-submenu').forEach(ul => {
        ul.classList.add(this.options.verticalClass);
      });
    });

    if (this.options.alignment === 'auto') {
        // .parents('.top-bar-right').is('*'): any matching ancestor
        var inTopBarRight = false, anc = this.$element.parentElement;
        while (anc && anc.nodeType === 1) {
          if (anc.matches('.top-bar-right')) { inTopBarRight = true; break; }
          anc = anc.parentElement;
        }
        if (this.$element.classList.contains(this.options.rightClass) || rtl() || inTopBarRight) {
            this.options.alignment = 'right';
            subs.forEach(el => el.classList.add('opens-left'));
        } else {
            this.options.alignment = 'left';
            subs.forEach(el => el.classList.add('opens-right'));
        }
    } else {
      if (this.options.alignment === 'right') {
          subs.forEach(el => el.classList.add('opens-left'));
      } else {
          subs.forEach(el => el.classList.add('opens-right'));
      }
    }
    this.changed = false;
    this._events();
  };

  _isVertical() {
    // jQuery .css(): the computed value
    return window.getComputedStyle(this.$tabs[0]).display === 'block'
      || window.getComputedStyle(this.$element).flexDirection === 'column';
  }

  _isRtl() {
    return this.$element.classList.contains('align-right') || (rtl() && !this.$element.classList.contains('align-left'));
  }

  /**
   * Adds event listeners to elements within the menu
   * @private
   * @function
   */
  _events() {
    var _this = this,
        hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined'),
        parClass = 'is-dropdown-submenu-parent';

    // used for onClick and in the keyboard handlers
    var handleClickFn = function(e) {
      // $(target).parentsUntil('ul', '.parClass'): the nearest ancestor
      // matching the class, walking up but not past a <ul>
      var elem = e.target.parentElement;
      while (elem && elem.tagName !== 'UL') {
        if (elem.matches(`.${parClass}`)) { break; }
        elem = elem.parentElement;
      }
      var found = (elem && elem.tagName !== 'UL' && elem.matches(`.${parClass}`)) ? elem : null,
          hasSub = !!found,
          hasClicked = found && found.getAttribute('data-is-click') === 'true',
          sub = found && found.querySelector(':scope > .is-dropdown-submenu');

      if (hasSub) {
        if (hasClicked) {
          if (!_this.options.closeOnClick
            || (!_this.options.clickOpen && !hasTouch)
            || (_this.options.forceFollow && hasTouch)) {
            return;
          }
          e.stopImmediatePropagation();
          e.preventDefault();
          _this._hide(found);
        }
        else {
          e.stopImmediatePropagation();
          e.preventDefault();
          _this._show(sub);
          // S9: the click-state attribute flips natively.
          var chain = [found];
          var anc = found.parentElement;
          while (anc && anc !== _this.$element) {
            if (anc.matches(`.${parClass}`)) { chain.push(anc); }
            anc = anc.parentElement;
          }
          chain.forEach(el => el.setAttribute('data-is-click', 'true'));
        }
      }
    };

    if (this.options.clickOpen || hasTouch) {
      // S9: the click (and real touchstart) consumer flips to the native
      // event layer - real events reach it directly and jQuery-synthesized
      // clicks on non-link items ride the `.click()` shortcut bridge
      // (reveal-native precedent; jQuery suppresses that shortcut for link
      // anchors, so a jQuery-synthesized click on the `<a>` itself stays
      // undelivered - a real click is the user contract). The library itself
      // has no jQuery-synthesized touchstart producer left (the Touch util
      // makes 'tap').
      this.$menuItems.forEach(item => {
        Events.on(item, 'click.zf.dropdownMenu touchstart.zf.dropdownMenu', handleClickFn);
      });
    }

    // Handle Leaf element Clicks
    if(_this.options.closeOnClickInside){
      this.$menuItems.forEach(item => {
        Events.on(item, 'click.zf.dropdownMenu', function() {
          if(!this.classList.contains(parClass)){
            _this._hide();
          }
        });
      });
    }

    if (hasTouch && this.options.disableHoverOnTouch) this.options.disableHover = true;

    // 7.0 terminal form: hover intent runs on the native layer. jQuery's
    // mouseenter/mouseleave are real mouseover/mouseout with the
    // within-element filter; the delay timers ride an expando like jQuery's
    // DOM-invisible data cache.
    if (!this.options.disableHover) {
      var hoverFilter = function(handler) {
        return function(e) {
          if (e.relatedTarget && this.contains(e.relatedTarget)) { return; }
          handler.call(this, e);
        };
      };
      this.$menuItems.forEach(item => {
        Events.off(item, 'mouseover.zf.dropdownMenu mouseout.zf.dropdownMenu');
        Events.on(item, 'mouseover.zf.dropdownMenu', hoverFilter(function () {
          if (this.classList.contains(parClass)) {
            clearTimeout(this.zfMenuDelay);
            const el = this;
            el.zfMenuDelay = setTimeout(function () {
              _this._show(el.querySelector(':scope > .is-dropdown-submenu'));
            }, _this.options.hoverDelay);
          }
        }));
        Events.on(item, 'mouseout.zf.dropdownMenu', ignoreMousedisappear(function () {
          if (this.classList.contains(parClass) && _this.options.autoclose) {
            if (this.getAttribute('data-is-click') === 'true' && _this.options.clickOpen) { return false; }

            clearTimeout(this.zfMenuDelay);
            const el = this;
            el.zfMenuDelay = setTimeout(function () {
              _this._hide(el);
            }, _this.options.closingTime);
          }
        }));
      });
    }
    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    this.$menuItems.forEach(menuItem => {
      Events.off(menuItem, 'keydown.zf.dropdownMenu');
      Events.on(menuItem, 'keydown.zf.dropdownMenu', function(e) {
        // $(target).parentsUntil('ul', '[role="none"]'): the nearest
        // role="none" li ancestor, not walking past a <ul>
        var element = e.target.parentElement;
        while (element && element.tagName !== 'UL') {
          if (element.matches('[role="none"]')) { break; }
          element = element.parentElement;
        }
        element = (element && element.tagName !== 'UL' && element.matches('[role="none"]')) ? element : null;
        if (!element) { return; }
        var isTab = _this.$tabs.indexOf(element) > -1,
            // jQuery .siblings('li').add($element) sorts into document order:
            // the parent's li children including the element itself
            elements = isTab ? _this.$tabs : Array.from(element.parentElement.children).filter(el => el.matches('li')),
            prevElement,
            nextElement;

        var i = elements.indexOf(element);
        prevElement = elements[i-1];
        nextElement = elements[i+1];

        var nextSibling = function() {
          if (nextElement) nextElement.querySelector(':scope > a').focus();
          e.preventDefault();
        }, prevSibling = function() {
          if (prevElement) prevElement.querySelector(':scope > a').focus();
          e.preventDefault();
        }, openSub = function() {
          var sub = element.querySelector(':scope > ul.is-dropdown-submenu');
          if (sub) {
            _this._show(sub);
            // jQuery's find('li > a:first') scoped the child combinator to
            // the subtree (the item's own anchor never matched); the first
            // anchor inside the submenu is the focused one
            sub.querySelector('a').focus();
            e.preventDefault();
          } else { return; }
        }, closeSub = function() {
          //if ($element.is(':first-child')) {
          var close = element.parentElement.parentElement;
          if (close.matches('li')) {
            var link = close.querySelector(':scope > a');
            if (link) link.focus();
            _this._hide(close);
          }
          e.preventDefault();
          //}
        };
        var functions = {
          open: openSub,
          close: function() {
            _this._hide(_this.$element);
            var firstLink = _this.$menuItems[0].querySelector(':scope > a');
            if (firstLink) firstLink.focus(); // focus to first element
            e.preventDefault();
          }
        };

        if (isTab) {
          if (_this._isVertical()) { // vertical menu
            if (_this._isRtl()) { // right aligned
              Object.assign(functions, {
                down: nextSibling,
                up: prevSibling,
                next: closeSub,
                previous: openSub
              });
            } else { // left aligned
              Object.assign(functions, {
                down: nextSibling,
                up: prevSibling,
                next: openSub,
                previous: closeSub
              });
            }
          } else { // horizontal menu
            if (_this._isRtl()) { // right aligned
              Object.assign(functions, {
                next: prevSibling,
                previous: nextSibling,
                down: openSub,
                up: closeSub
              });
            } else { // left aligned
              Object.assign(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          }
        } else { // not tabs -> one sub
          if (_this._isRtl()) { // right aligned
            Object.assign(functions, {
              next: closeSub,
              previous: openSub,
              down: nextSibling,
              up: prevSibling
            });
          } else { // left aligned
            Object.assign(functions, {
              next: openSub,
              previous: closeSub,
              down: nextSibling,
              up: prevSibling
            });
          }
        }
        Keyboard.handleKey(e, 'DropdownMenu', functions);

      });
    });
  }

  /**
   * Adds an event handler to the body to close any dropdowns on a click.
   * @function
   * @private
   */
  _addBodyHandler() {
    const body = document.body;
    this._removeBodyHandler();
    const bodyHandler = (e) => {
      // $(target).closest($element): the element or any descendant
      var isItself = e.target === this.$element || this.$element.contains(e.target);
      if (isItself) return;

      this._hide();
      this._removeBodyHandler();
    };
    // S13: the tap half flips with the Touch util - 'tap' is a real,
    // bubbling event on the touched element now, so this native body
    // listener hears it (real clicks arrived through this layer since S9).
    Events.on(body, 'click.zf.dropdownMenu tap.zf.dropdownMenu', bodyHandler);
  }

  /**
   * Remove the body event handler. See `_addBodyHandler`.
   * @function
   * @private
   */
  _removeBodyHandler() {
    Events.off(document.body, 'click.zf.dropdownMenu tap.zf.dropdownMenu');
  }

  /**
   * Opens a dropdown pane, and checks for collisions first.
   * @param {jQuery} $sub - ul element that is a submenu to show
   * @function
   * @private
   * @fires DropdownMenu#show
   */
  _show(sub) {
    sub = sub.nodeType === 1 ? sub : sub[0];
    // which top-level tab owns this submenu
    var ownerTab = sub.closest('li[role="none"]');
    while (ownerTab && ownerTab.parentElement !== this.$element) {
      ownerTab = ownerTab.parentElement ? ownerTab.parentElement.closest('li[role="none"]') : null;
    }
    var idx = ownerTab ? this.$tabs.indexOf(ownerTab) : -1;
    var parentLi = sub.parentElement && sub.parentElement.matches('li.is-dropdown-submenu-parent') ? sub.parentElement : null;
    var sibs = parentLi ? Array.from(parentLi.parentElement.children).filter(el => el.matches('li.is-dropdown-submenu-parent')) : [];
    this._hide(sibs, idx);
    // S9: class/inline-style state flips natively.
    sub.style.visibility = 'hidden';
    sub.classList.add('js-dropdown-active');
    if (parentLi) {
      parentLi.classList.add('is-active');
    }
    // S13: the Box util reads plain elements.
    var clear = Box.ImNotTouchingYou(sub, null, true);
    if (!clear) {
      var oldClass = this.options.alignment === 'left' ? '-right' : '-left';
      if (parentLi) {
        parentLi.classList.remove(`opens${oldClass}`);
        parentLi.classList.add(`opens-${this.options.alignment}`);
      }
      clear = Box.ImNotTouchingYou(sub, null, true);
      if (!clear && parentLi) {
        parentLi.classList.remove(`opens-${this.options.alignment}`);
        parentLi.classList.add('opens-inner');
      }
      this.changed = true;
    }
    sub.style.visibility = '';
    if (this.options.closeOnClick) { this._addBodyHandler(); }
    /**
     * Fires when the new dropdown pane is visible.
     * @event DropdownMenu#show
     */
    // S9: state production through the native event layer; the terminal
    // form forwards the plain element.
    Events.trigger(this.$element, 'show.zf.dropdownMenu', [sub]);
  }

  /**
   * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
   * @function
   * @param {jQuery} $elem - element with a submenu to hide
   * @param {Number} idx - index of the $tabs collection to hide
   * @fires DropdownMenu#hide
   * @private
   */
  _hide(elem, idx) {
    // Accepts an element, a collection, a NodeList or an array.
    var toClose;
    if (elem) {
      toClose = elem.nodeType === 1 ? [elem] : Array.from(elem);
    } else if (typeof idx !== 'undefined') {
      toClose = this.$tabs.filter(function(tab, i) {
        return i !== idx;
      });
    }
    else {
      toClose = [this.$element];
    }
    var root = toClose[0];
    var somethingToClose = toClose.some(el => el.classList.contains('is-active')) || !!root.querySelector('.is-active');

    if (somethingToClose) {
      var activeItems = Array.from(root.querySelectorAll('li.is-active'));
      // S9: class/data state flips natively.
      toClose.concat(activeItems).forEach(el => {
        el.setAttribute('data-is-click', 'false');
        el.classList.remove('is-active');
      });
      toClose.forEach(closeRoot => {
        closeRoot.querySelectorAll('ul.js-dropdown-active').forEach(ul => {
          ul.classList.remove('js-dropdown-active');
        });
      });

      // the original find('opens-inner') was a selector typo in 6.x - it
      // never matched anything (class selectors need the dot); the changed
      // flag carried the real condition
      if (this.changed) {
        var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
        toClose.forEach(closeRoot => {
          closeRoot.querySelectorAll('li.is-dropdown-submenu-parent').concat(closeRoot.matches('li.is-dropdown-submenu-parent') ? [closeRoot] : [])
                  .forEach(el => {
                    el.classList.remove('opens-inner', `opens-${this.options.alignment}`);
                    el.classList.add(`opens-${oldClass}`);
                  });
        });
        this.changed = false;
      }

      activeItems.forEach(el => { clearTimeout(el.zfMenuDelay); });
      if (root.zfMenuDelay) { clearTimeout(root.zfMenuDelay); }
      this._removeBodyHandler();

      /**
       * Fires when the open menus are closed.
       * @event DropdownMenu#hide
       */
      // S9: state production through the native event layer; the terminal
      // form forwards the element array.
      Events.trigger(this.$element, 'hide.zf.dropdownMenu', [toClose]);
    }
  }

  /**
   * Destroys the plugin.
   * @function
   */
  _destroy() {
    // The listeners by bare namespace, the state attributes and the
    // orientation classes reset.
    this.$menuItems.forEach(item => Events.off(item, '.zf.dropdownMenu'));
    this.$menuItems.forEach(item => {
      item.removeAttribute('data-is-click');
      item.classList.remove('is-right-arrow', 'is-left-arrow', 'is-down-arrow', 'opens-right', 'opens-left', 'opens-inner');
    });
    this._removeBodyHandler();
    Events.off(document.body, '.zf.dropdownMenu');
    Nest.Burn(this.$element, 'dropdown');
  }
}

/**
 * Default settings for plugin
 */
DropdownMenu.defaults = {
  /**
   * Disallows hover events from opening submenus
   * @option
   * @type {boolean}
   * @default false
   */
  disableHover: false,
  /**
   * Disallows hover on touch devices
   * @option
   * @type {boolean}
   * @default true
   */
  disableHoverOnTouch: true,
  /**
   * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
   * @option
   * @type {boolean}
   * @default true
   */
  autoclose: true,
  /**
   * Amount of time to delay opening a submenu on hover event.
   * @option
   * @type {number}
   * @default 50
   */
  hoverDelay: 50,
  /**
   * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
   * @option
   * @type {boolean}
   * @default false
   */
  clickOpen: false,
  /**
   * Amount of time to delay closing a submenu on a mouseleave event.
   * @option
   * @type {number}
   * @default 500
   */

  closingTime: 500,
  /**
   * Position of the menu relative to what direction the submenus should open. Handled by JS. Can be `'auto'`, `'left'` or `'right'`.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow clicks on the body to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Allow clicks on leaf anchor links to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClickInside: true,
  /**
   * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'vertical'
   */
  verticalClass: 'vertical',
  /**
   * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'align-right'
   */
  rightClass: 'align-right',
  /**
   * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
   * @option
   * @type {boolean}
   * @default true
   */
  forceFollow: true
};

/**
 * Equalizer module.
 * @module foundation.equalizer
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.imageLoader if equalizer contains images
 */

class Equalizer extends Plugin {
  /**
   * Creates a new instance of Equalizer.
   * @class
   * @name Equalizer
   * @fires Equalizer#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options){
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options  = deepMerge({}, Equalizer.defaults, datasetOptions(this.$element), options);
    this.className = 'Equalizer'; // ie9 back compat

    this._init();
  }

  /**
   * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  _init() {
    var eqId = this.$element.getAttribute('data-equalizer') || '';
    var watched = Array.from(this.$element.querySelectorAll(`[data-equalizer-watch="${eqId}"]`));

    MediaQuery._init();

    this.$watched = watched.length ? watched : Array.from(this.$element.querySelectorAll('[data-equalizer-watch]'));
    // State attributes go through the native layer (7.0 line A, S8).
    this.$element.setAttribute('data-resize', (eqId || GetYoDigits(6, 'eq')));
    this.$element.setAttribute('data-mutate', (eqId || GetYoDigits(6, 'eq')));

    this.hasNested = this.$element.querySelectorAll('[data-equalizer]').length > 0;
    // jQuery parentsUntil(document.body, sel): the ancestors strictly below
    // body matching the selector
    this.isNested = (function() {
      var p = this.$element.parentElement;
      while (p && p !== document.body) {
        if (p.matches('[data-equalizer]')) { return true; }
        p = p.parentElement;
      }
      return false;
    }).call(this);
    this.isOn = false;
    this._bindHandler = {
      onResizeMeBound: this._onResizeMe.bind(this),
      onPostEqualizedBound: this._onPostEqualized.bind(this),
      onCheckMQBound: this._checkMQ.bind(this)
    };

    var imgs = this.$element.querySelectorAll('img');
    var tooSmall;
    if(this.options.equalizeOn){
      tooSmall = this._checkMQ();
      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/tabs/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs/offcanvas all flipped with the producer in
      // the same move).
      Events.on(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    }else {
      this._events();
    }
    if((typeof tooSmall !== 'undefined' && tooSmall === false) || typeof tooSmall === 'undefined'){
      if(imgs.length){
        onImagesLoaded(imgs, this._reflow.bind(this));
      }else {
        this._reflow();
      }
    }
  }

  /**
   * Removes event listeners if the breakpoint is too small.
   * @private
   */
  _pauseEvents() {
    this.isOn = false;
    // Native side: the mediaquery consumer (S13 flip), the resizeme and
    // mutateme consumers (S4 producers) and the equalizer lifecycle
    // listeners drop in one pass each. The mutateme consumer flipped
    // together with its last producers in the S10 group flip (Tabs forward,
    // ResponsiveToggle animated half).
    Events.off(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    Events.off(this.$element, 'mutateme.zf.trigger resizeme.zf.trigger .zf.equalizer');
  }

  /**
   * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
   * @private
   */
  _onResizeMe() {
    this._reflow();
  }

  /**
   * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
   * @private
   */
  _onPostEqualized(e) {
    if(e.target !== this.$element){ this._reflow(); }
  }

  /**
   * Initializes events for Equalizer.
   * @private
   */
  _events() {
    this._pauseEvents();
    if(this.hasNested){
      // S8: the postequalized consumer flips together with its producer
      // (applyHeight below) in the same commit - both sides of the nested
      // equalizer chain live on the native event layer now.
      Events.on(this.$element, 'postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
    }else {
      // S8: the resizeme consumer flips to the native event layer; the
      // producer in the Triggers util has dispatched real element-local
      // events since S4, so this seam closes on the consumer half alone.
      Events.on(this.$element, 'resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
      // S10 group flip: the mutateme consumer joins the native event layer
      // together with its last jQuery-synthesized producers - the Tabs
      // forward and the ResponsiveToggle animated half flip in the same
      // commit, so every element listens on exactly one side and nothing
      // double-fires.
      Events.on(this.$element, 'mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
    }
    this.isOn = true;
  }

  /**
   * Checks the current breakpoint to the minimum required size.
   * @private
   */
  _checkMQ() {
    var tooSmall = !MediaQuery.is(this.options.equalizeOn);
    if(tooSmall){
      if(this.isOn){
        this._pauseEvents();
        this.$watched.forEach(el => { el.style.height = 'auto'; });
      }
    }else {
      if(!this.isOn){
        this._events();
      }
    }
    return tooSmall;
  }

  /**
   * A noop version for the plugin
   * @private
   */
  _killswitch() {
    return;
  }

  /**
   * Calls necessary functions to update Equalizer upon DOM change
   * @private
   */
  _reflow() {
    if(!this.options.equalizeOnStack){
      if(this._isStacked()){
        this.$watched.forEach(el => { el.style.height = 'auto'; });
        return false;
      }
    }
    if (this.options.equalizeByRow) {
      this.getHeightsByRow(this.applyHeightByRow.bind(this));
    }else {
      this.getHeights(this.applyHeight.bind(this));
    }
  }

  /**
   * Manually determines if the first 2 elements are *NOT* stacked.
   * @private
   */
  _isStacked() {
    if (!this.$watched[0] || !this.$watched[1]) {
      return true;
    }
    return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
  }

  /**
   * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
   * @param {Function} cb - A non-optional callback to return the heights array to.
   * @returns {Array} heights - An array of heights of children within Equalizer container
   */
  getHeights(cb) {
    var heights = [];
    for(var i = 0, len = this.$watched.length; i < len; i++){
      this.$watched[i].style.height = 'auto';
      heights.push(this.$watched[i].offsetHeight);
    }
    cb(heights);
  }

  /**
   * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
   * @param {Function} cb - A non-optional callback to return the heights array to.
   * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
   */
  getHeightsByRow(cb) {
    // jQuery offset(): document-coordinates top of the first watched item
    var lastElTopOffset = (this.$watched.length ? this.$watched[0].getBoundingClientRect().top + window.pageYOffset : 0),
        groups = [],
        group = 0;
    //group by Row
    groups[group] = [];
    for(var i = 0, len = this.$watched.length; i < len; i++){
      this.$watched[i].style.height = 'auto';
      //maybe could use this.$watched[i].offsetTop
      var elOffsetTop = this.$watched[i].getBoundingClientRect().top + window.pageYOffset;
      if (elOffsetTop !== lastElTopOffset) {
        group++;
        groups[group] = [];
        lastElTopOffset=elOffsetTop;
      }
      groups[group].push([this.$watched[i],this.$watched[i].offsetHeight]);
    }

    for (var j = 0, ln = groups.length; j < ln; j++) {
      var heights = groups[j].map(function(item){ return item[1]; });
      var max         = Math.max.apply(null, heights);
      groups[j].push(max);
    }
    cb(groups);
  }

  /**
   * Changes the CSS height property of each child in an Equalizer parent to match the tallest
   * @param {array} heights - An array of heights of children within Equalizer container
   * @fires Equalizer#preequalized
   * @fires Equalizer#postequalized
   */
  applyHeight(heights) {
    var max = Math.max.apply(null, heights);
    /**
     * Fires before the heights are applied
     * @event Equalizer#preequalized
     */
    Events.trigger(this.$element, 'preequalized.zf.equalizer');

    this.$watched.forEach(el => { el.style.height = max + 'px'; });

    /**
     * Fires when the heights have been applied
     * @event Equalizer#postequalized
     */
     Events.trigger(this.$element, 'postequalized.zf.equalizer');
  }

  /**
   * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
   * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
   * @fires Equalizer#preequalized
   * @fires Equalizer#preequalizedrow
   * @fires Equalizer#postequalizedrow
   * @fires Equalizer#postequalized
   */
  applyHeightByRow(groups) {
    /**
     * Fires before the heights are applied
     */
    Events.trigger(this.$element, 'preequalized.zf.equalizer');
    for (var i = 0, len = groups.length; i < len ; i++) {
      var groupsILength = groups[i].length,
          max = groups[i][groupsILength - 1];
      if (groupsILength<=2) {
        groups[i][0][0].style.height = 'auto';
        continue;
      }
      /**
        * Fires before the heights per row are applied
        * @event Equalizer#preequalizedrow
        */
      Events.trigger(this.$element, 'preequalizedrow.zf.equalizer');
      for (var j = 0, lenJ = (groupsILength-1); j < lenJ ; j++) {
        groups[i][j][0].style.height = max + 'px';
      }
      /**
        * Fires when the heights per row have been applied
        * @event Equalizer#postequalizedrow
        */
      Events.trigger(this.$element, 'postequalizedrow.zf.equalizer');
    }
    /**
     * Fires when the heights have been applied
     */
     Events.trigger(this.$element, 'postequalized.zf.equalizer');
  }

  /**
   * Destroys an instance of Equalizer.
   * @function
   */
  _destroy() {
    this._pauseEvents();
    this.$watched.forEach(el => { el.style.height = 'auto'; });
  }
}

/**
 * Default settings for plugin
 */
Equalizer.defaults = {
  /**
   * Enable height equalization when stacked on smaller screens.
   * @option
   * @type {boolean}
   * @default false
   */
  equalizeOnStack: false,
  /**
   * Enable height equalization row by row.
   * @option
   * @type {boolean}
   * @default false
   */
  equalizeByRow: false,
  /**
   * String representing the minimum breakpoint size the plugin should equalize heights on.
   * @option
   * @type {string}
   * @default ''
   */
  equalizeOn: ''
};

/**
 * Interchange module.
 * @module foundation.interchange
 * @requires foundation.util.mediaQuery
 */

class Interchange extends Plugin {
  /**
   * Creates a new instance of Interchange.
   * @class
   * @name Interchange
   * @fires Interchange#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A, slice S16: the plugin works on the native element; the
    // jQuery collection the mixed-state reflow still feeds in is unwrapped.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = Object.assign({}, Interchange.defaults, datasetOptions(this.$element), options);
    this.rules = [];
    this.currentPath = '';
    this.className = 'Interchange'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
    this._events();
  }

  /**
   * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();

    var element = this.$element;
    var id = element.id || GetYoDigits(6, 'interchange');
    // State attributes go through the native layer (7.0 line A, S12).
    element.setAttribute('data-resize', id);
    element.setAttribute('id', id);

    this._parseOptions();
    this._addBreakpoints();
    this._generateRules();
    this._reflow();
  }

  /**
   * Initializes events for Interchange.
   * @function
   * @private
   */
  _events() {
    // S12: the resizeme consumer flips to the native event layer; the
    // producer in the Triggers util has dispatched real element-local
    // events since S4, so this seam closes on the consumer half alone.
    const element = this.$element;
    Events.off(element, 'resizeme.zf.trigger');
    Events.on(element, 'resizeme.zf.trigger', () => this._reflow());
  }

  /**
   * Calls necessary functions to update Interchange upon DOM change
   * @function
   * @private
   */
  _reflow() {
    var match;

    // Iterate through each rule, but only save the last match
    for (var i in this.rules) {
      if(this.rules.hasOwnProperty(i)) {
        var rule = this.rules[i];
        if (window.matchMedia(rule.query).matches) {
          match = rule;
        }
      }
    }

    if (match) {
      this.replace(match.path);
    }
  }

  /**
   * Check options valifity and set defaults for:
   * - `data-interchange-type`: if set, enforce the type of replacement (auto, src, background or html)
   * @function
   * @private
   */
  _parseOptions() {
    var types = ['auto', 'src', 'background', 'html'];
    if (typeof this.options.type === 'undefined')
      this.options.type = 'auto';
    else if (types.indexOf(this.options.type) === -1) {
      console.warn(`Warning: invalid value "${this.options.type}" for Interchange option "type"`);
      this.options.type = 'auto';
    }
  }

  /**
   * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
   * @function
   * @private
   */
  _addBreakpoints() {
    for (var i in MediaQuery.queries) {
      if (MediaQuery.queries.hasOwnProperty(i)) {
        var query = MediaQuery.queries[i];
        Interchange.SPECIAL_QUERIES[query.name] = query.value;
      }
    }
  }

  /**
   * Checks the Interchange element for the provided media query + content pairings
   * @function
   * @private
   * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
   */
  _generateRules() {
    var rulesList = [];
    var rules;

    if (this.options.rules) {
      rules = this.options.rules;
    }
    else {
      // Read the attribute directly: identical to the former
      // `.data('interchange')` for every string rule list (the value is not
      // valid JSON, so jQuery's data parsing never converted it either).
      rules = this.$element.getAttribute('data-interchange');
    }

    rules =  typeof rules === 'string' ? rules.match(/\[.*?, .*?\]/g) : rules;

    for (var i in rules) {
      if(rules.hasOwnProperty(i)) {
        var rule = rules[i].slice(1, -1).split(', ');
        var path = rule.slice(0, -1).join('');
        var query = rule[rule.length - 1];

        if (Interchange.SPECIAL_QUERIES[query]) {
          query = Interchange.SPECIAL_QUERIES[query];
        }

        rulesList.push({
          path: path,
          query: query
        });
      }
    }

    this.rules = rulesList;
  }

  /**
   * Update the `src` property of an image, or change the HTML of a container, to the specified path.
   * @function
   * @param {String} path - Path to the image or HTML partial.
   * @fires Interchange#replaced
   */
  replace(path) {
    if (this.currentPath === path) return;

    var trigger = 'replaced.zf.interchange';
    var element = this.$element;

    var type = this.options.type;
    if (type === 'auto') {
      if (element.nodeName === 'IMG')
        type = 'src';
      else if (path.match(/\.(gif|jpe?g|png|svg|tiff)([?#].*)?/i))
        type = 'background';
      else
        type = 'html';
    }

    // Replacing images
    if (type === 'src') {
      // The M1 fix shape is kept byte-for-byte: a one-time load listener per
      // replace, so listeners stop accumulating across replaces (the S12
      // native form of the former `.one('load')`).
      element.setAttribute('src', path);
      Events.one(element, 'load', () => { this.currentPath = path; });
      Events.trigger(element, trigger);
    }
    // Replacing background images
    else if (type === 'background') {
      path = path.replace(/\(/g, '%28').replace(/\)/g, '%29');
      element.style.backgroundImage = 'url(' + path + ')';
      Events.trigger(element, trigger);
    }
    // Replacing HTML
    else if (type === 'html') {
      // Native fetch (7.0 line A, S14): the former `$.get(path, callback)`.
      // Error semantics aligned to the 6.x observed behavior: `$.get` only
      // called back on HTTP 2xx (its internal success filter), so a failure
      // was SILENT - no event, no state change, a console error from the
      // failed request itself. `fetch` resolves on any status, so `res.ok`
      // reproduces that filter: a non-2xx response drops the promise's
      // result exactly like the dropped jQuery callback (fetch additionally
      // logs its own failed-request console error, as jQuery did).
      fetch(path).then(res => {
        if (!res.ok) { return; }
        return res.text();
      }).then(response => {
        if (response === undefined) { return; }
        // Native html injection (7.0 line A, S12): the assignment re-parses
        // `response` in place, exactly like the former `.html()`.
        element.innerHTML = response;
        Events.trigger(element, trigger);
        // Initialize plugins in the inserted content (it is a re-parsed copy
        // of `response`, so initializing `$(response)` would hit detached nodes)
        Foundation.reflow(this.$element);
        this.currentPath = path;
      });
    }

    /**
     * Fires when content in an Interchange element is done being loaded.
     * @event Interchange#replaced
     */
    // this.$element.trigger('replaced.zf.interchange');
  }

  /**
   * Destroys an instance of interchange.
   * @function
   */
  _destroy() {
    // The resizeme consumer lives on the native event layer only now
    // (Equalizer S8 precedent for fully flipped consumers).
    Events.off(this.$element, 'resizeme.zf.trigger');
  }
}

/**
 * Default settings for plugin
 */
Interchange.defaults = {
  /**
   * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
   * @option
   * @type {?array}
   * @default null
   */
  rules: null,

  /**
   * Type of the responsive ressource to replace. It can take the following options:
   * - `auto` (default): choose the type according to the element tag or the ressource extension,
   * - `src`: replace the `[src]` attribute, recommended for images `<img>`.
   * - `background`: replace the `background-image` CSS property.
   * - `html`: replace the element content.
   * @option
   * @type {string}
   * @default 'auto'
   */
  type: 'auto'
};

Interchange.SPECIAL_QUERIES = {
  'landscape': 'screen and (orientation: landscape)',
  'portrait': 'screen and (orientation: portrait)',
  'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
};

/**
 * SmoothScroll module.
 * @module foundation.smoothScroll
 */

// The page-scroll tween (7.0 line A, S7): replaces the former
// `$('html, body').stop(true).animate({scrollTop}, …)`. It keeps the Move
// shape of the S5 Motion util - duration 0 completes synchronously, longer
// durations advance through requestAnimationFrame - and reproduces the two
// observable jQuery behaviors: only one page animation runs at a time
// (starting a new one stops the previous where it stands, the net effect of
// the `stop(true)` queue clear; 6.x animated both html and body because old
// engines split root scrolling, the baseline browsers scroll the viewport
// only), and unknown easing names fall back to jQuery's `_default` swing.
// 6.x fired no event from this path (the callback is the completion
// contract, delivered once per scroll where jQuery delivered it once per
// animated element), so none is added.
let activeScroll = null;

function stopActiveScroll() {
  if (activeScroll !== null) {
    window.cancelAnimationFrame(activeScroll);
    activeScroll = null;
  }
}

function resolveEasing(easing) {
  if (typeof easing === 'function') { return easing; }
  if (easing === 'linear') { return (p) => p; }
  // jQuery's `_default` easing: unknown names animate as 'swing'
  return (p) => 0.5 - Math.cos(p * Math.PI) / 2;
}

function animateScroll(scrollPos, options, callback) {
  const start = window.pageYOffset;
  const delta = scrollPos - start;
  const duration = options.animationDuration;
  const easing = resolveEasing(options.animationEasing);

  stopActiveScroll();

  if (duration === 0) {
    window.scrollTo(0, scrollPos);
    if (typeof callback === 'function') { callback(); }
    return;
  }

  let origin = null;
  function step(ts) {
    if (origin === null) { origin = ts; }
    const progress = Math.min((ts - origin) / duration, 1);
    window.scrollTo(0, Math.round(start + delta * easing(progress)));
    if (progress < 1) {
      activeScroll = window.requestAnimationFrame(step);
    } else {
      activeScroll = null;
      if (typeof callback === 'function') { callback(); }
    }
  }
  activeScroll = window.requestAnimationFrame(step);
}

class SmoothScroll extends Plugin {
  /**
   * Creates a new instance of SmoothScroll.
   * @class
   * @name SmoothScroll
   * @fires SmoothScroll#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
    _setup(element, options) {
        // 7.0 line A, slice S16: the plugin works on the native element; the
        // jQuery collection the mixed-state reflow still feeds in is unwrapped.
        this.$element = element.nodeType === 1 ? element : element[0];
        this.options = Object.assign({}, SmoothScroll.defaults, datasetOptions(this.$element), options);
        this.className = 'SmoothScroll'; // ie9 back compat

        this._init();
    }

    /**
     * Initialize the SmoothScroll plugin
     * @private
     */
    _init() {
        const element = this.$element;
        const id = element.id || GetYoDigits(6, 'smooth-scroll');
        element.id = id;

        this._events();
    }

    /**
     * Initializes events for SmoothScroll.
     * @private
     */
    _events() {
        // S7: both registrations move to the native event layer. The direct
        // binding keeps the 6.x shape where a click landing on the container
        // itself reaches the handler and is filtered by the anchor check; the
        // delegated binding mirrors the jQuery delegate walk (closest match,
        // never escaping the root) and hands the match to the handler, since
        // a real event's currentTarget stays the listener element.
        const element = this.$element;
        const _this = this;
        this._linkClickListener = function(e) {
            _this._handleLinkClick(e, e.currentTarget);
        };
        this._delegatedClickListener = function(e) {
            _this._handleLinkClick(e, this);
        };
        Events.on(element, 'click.zf.smoothScroll', this._linkClickListener);
        Events.delegate(element, 'click.zf.smoothScroll', 'a[href^="#"]', this._delegatedClickListener);
    }

    /**
     * Handle the given event to smoothly scroll to the anchor pointed by the event target.
     * @param {*} e - event
     * @param {*} link - the element the event landed on: the container for the
     *   direct binding, the closest 'a[href^="#"]' for the delegated one.
     * @function
     * @private
     */
    _handleLinkClick(e, link) {
        // Follow the link if it does not point to an anchor.
        if (!link || !link.matches('a[href^="#"]')) return;

        const arrival = link.getAttribute('href');

        this._inTransition = true;

        SmoothScroll.scrollToLoc(arrival, this.options, () => {
            this._inTransition = false;
        });

        e.preventDefault();
    };

    /**
     * Function to scroll to a given location on the page.
     * @param {String} loc - A properly formatted jQuery id selector. Example: '#foo'
     * @param {Object} options - The options to use.
     * @param {Function} callback - The callback function.
     * @static
     * @function
     */
    static scrollToLoc(loc, options = SmoothScroll.defaults, callback) {
        const target = document.querySelector(loc);

        // Do nothing if target does not exist to prevent errors
        if (!target) return false;

        var scrollPos = Math.round(target.getBoundingClientRect().top + window.pageYOffset - options.threshold / 2 - options.offset);

        animateScroll(scrollPos, options, callback);
    }

    /**
     * Destroys the SmoothScroll instance.
     * @function
     */
    _destroy() {
        // Native side: the direct and delegated click listeners share the
        // zf.smoothScroll namespace and go in one bare-namespace call.
        // (The 6.x jQuery-side `off('.zf.smoothScroll')` line died with this
        // file's jQuery import: the plugin registers nothing on the jQuery
        // side anymore.)
        Events.off(this.$element, '.zf.smoothScroll');
    }
}

/**
 * Default settings for plugin.
 */
SmoothScroll.defaults = {
  /**
   * Amount of time, in ms, the animated scrolling should take between locations.
   * @option
   * @type {number}
   * @default 500
   */
  animationDuration: 500,
  /**
   * Animation style to use when scrolling between locations. Can be `'swing'` or `'linear'`.
   * @option
   * @type {string}
   * @default 'linear'
   * @see {@link https://api.jquery.com/animate|Jquery animate}
   */
  animationEasing: 'linear',
  /**
   * Number of pixels to use as a marker for location changes.
   * @option
   * @type {number}
   * @default 50
   */
  threshold: 50,
  /**
   * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
   * @option
   * @type {number}
   * @default 0
   */
  offset: 0
};

/**
 * Magellan module.
 * @module foundation.magellan
 * @requires foundation.smoothScroll
 * @requires foundation.util.triggers
 */

class Magellan extends Plugin {
  /**
   * Creates a new instance of Magellan.
   * @class
   * @name Magellan
   * @fires Magellan#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options  = deepMerge({}, Magellan.defaults, datasetOptions(this.$element), options);
    this.className = 'Magellan'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
    this.calcPoints();
  }

  /**
   * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  _init() {
    var element = this.$element;
    var id = element.id || GetYoDigits(6, 'magellan');
    this.id = id;
    this.targets = Array.from(document.querySelectorAll('[data-magellan-target]'));
    this.links = Array.from(element.querySelectorAll('a'));
    element.setAttribute('data-resize', id);
    element.setAttribute('data-scroll', id);
    element.id = id;
    this.active = [];
    this.scrollPos = parseInt(window.pageYOffset, 10);

    this._events();
  }

  /**
   * Calculates an array of pixel values that are the demarcation lines between locations on the page.
   * Can be invoked if new elements are added or the size of a location changes.
   * @function
   */
  calcPoints() {
    var _this = this,
        body = document.body,
        html = document.documentElement;

    this.points = [];
    this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
    this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

    this.targets.forEach(function(tar){
      // jQuery offset(): the document-coordinates top (rect + page scroll)
      var pt = Math.round(tar.getBoundingClientRect().top + window.pageYOffset - _this.options.threshold);
      tar.targetPoint = pt;
      _this.points.push(pt);
    });
  }

  /**
   * Initializes events for Magellan.
   * @private
   */
  _events() {
    var _this = this;

    // Interactions arm at DOM-ready, not window load: a hung third-party
    // resource (the docs site's video iframe) would otherwise leave the
    // scroll spy and the nav-link clicks dead for as long as window load
    // is stalled. The 6.x load-time re-measure stays - images settle after
    // DOM-ready and the points need their final dimensions.
    var arm = function () {
      // A late callback can land after destroy() nulled the instance state
      // (the same post-destroy window the S6 slider guards cover; jQuery's
      // $(null) tolerance hid this in 6.x).
      if (!_this.$element) { return; }

      if(_this.options.deepLinking){
        if(location.hash){
          _this.scrollToLoc(location.hash);
        }
      }
      // Re-read the links: DOMContentLoaded runs after every synchronous
      // page script, so nav lists a late script builds (the docs sidebar's
      // generated subnav) are present now but were not at _setup time.
      _this.links = Array.from(_this.$element.querySelectorAll('a'));
      _this.calcPoints();
      _this._updateActive();
      // S7: the resizeme/scrollme consumers flip to the native event layer.
      // Both producers in the Triggers util have dispatched real element-
      // local events since S4, so this seam closes on the consumer half
      // alone; the delegated link clicks join them on the same layer.
      Events.on(_this.$element, 'resizeme.zf.trigger', _this.reflow.bind(_this));
      Events.on(_this.$element, 'scrollme.zf.trigger', _this._updateActive.bind(_this));
      Events.delegate(_this.$element, 'click.zf.magellan', 'a[href^="#"]', function (e) {
        e.preventDefault();
        _this.scrollToLoc(this.getAttribute('href'));
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', arm);
    } else {
      arm();
    }

    // The load-time re-measure: images and late layout settle after
    // DOM-ready, so the demarcation points are recalculated once the
    // document has fully loaded.
    this.onLoadListener = onLoad(window, function () {
      if (!_this.$element) { return; }
      _this.calcPoints();
      _this._updateActive();
    });

    this._deepLinkScroll = function() {
      if(_this.options.deepLinking) {
        _this.scrollToLoc(window.location.hash);
      }
    };

    // S7: the deep-link hashchange moves to the native event layer under the
    // per-instance namespace shape introduced for Reveal's hashchange, so
    // the destroy path can drop it precisely. Real hashchange events are
    // unaffected by the namespace.
    Events.on(window, `hashchange.zf.magellan:${this.id}`, this._deepLinkScroll);
  }

  /**
   * Function to scroll to a given location on the page.
   * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
   * @function
   */
  scrollToLoc(loc) {
    this._inTransition = true;
    var _this = this;

    var options = {
      animationEasing: this.options.animationEasing,
      animationDuration: this.options.animationDuration,
      threshold: this.options.threshold,
      offset: this.options.offset
    };

    SmoothScroll.scrollToLoc(loc, options, function() {
      _this._inTransition = false;
    });
  }

  /**
   * Calls necessary functions to update Magellan upon DOM change
   * @function
   */
  reflow() {
    this.calcPoints();
    this._updateActive();
  }

  /**
   * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
   * @private
   * @function
   * @fires Magellan#update
   */
  _updateActive(/*event, elem, scrollPos*/) {
    if(this._inTransition) return;

    const newScrollPos = parseInt(window.pageYOffset, 10);
    const isScrollingUp = this.scrollPos > newScrollPos;
    this.scrollPos = newScrollPos;

    let activeIdx;
    // Before the first point: no link
    if(newScrollPos < this.points[0] - this.options.offset - (isScrollingUp ? this.options.threshold : 0));
    // At the bottom of the page: last link
    else if(newScrollPos + this.winHeight === this.docHeight){ activeIdx = this.points.length - 1; }
    // Otherwhise, use the last visible link
    else {
      const visibleLinks = this.points.filter((p) => {
        return (p - this.options.offset - (isScrollingUp ? this.options.threshold : 0)) <= newScrollPos;
      });
      activeIdx = visibleLinks.length ? visibleLinks.length - 1 : 0;
    }

    // Get the new active link
    const oldActive = this.active;
    let activeHash = '';
    if(typeof activeIdx !== 'undefined'){
      // 6.x filtered $links by [href="#<target>"]; the data read is the raw
      // attribute (jQuery's .data would convert numbers, the attribute
      // values here are ids)
      const targetName = this.targets[activeIdx] ? this.targets[activeIdx].getAttribute('data-magellan-target') : null;
      this.active = targetName === null ? [] : this.links.filter(function(link) {
        return link.getAttribute('href') === '#' + targetName;
      });
      if (this.active.length) activeHash = this.active[0].getAttribute('href');
    }else {
      this.active = [];
    }
    // jQuery's .is() between collections: any overlap counts as same
    const overlaps = this.active.some(function(el) { return oldActive.indexOf(el) !== -1; });
    const isNewActive = !(!this.active.length && !oldActive.length) && !overlaps;
    const isNewHash = activeHash !== window.location.hash;

    // Update the active link element (native classList, 7.0 line A S7)
    if(isNewActive) {
      oldActive.forEach(function(el) { el.classList.remove(this.options.activeClass); }, this);
      this.active.forEach(function(el) { el.classList.add(this.options.activeClass); }, this);
    }

    // Update the hash (it may have changed with the same active link)
    if(this.options.deepLinking && isNewHash){
      if(window.history.pushState){
        // Set or remove the hash (see: https://stackoverflow.com/a/5298684/4317384
        const url = activeHash ? activeHash : window.location.pathname + window.location.search;
        if(this.options.updateHistory){
          window.history.pushState({}, '', url);
        }else {
          window.history.replaceState({}, '', url);
        }
      }else {
        window.location.hash = activeHash;
      }
    }

    if (isNewActive) {
      /**
       * Fires when magellan is finished updating to the new active element.
       * @event Magellan#update
       */
      // S7: real, bubbling CustomEvent - native listeners receive it
      // directly, still-on-jQuery listeners through the real-event pass-
      // through (the forwarded $active rides in event.originalEvent.detail
      // for them).
      // 7.0 terminal form: the forwarded active links are the native
      // element array (6.x forwarded the jQuery collection).
      Events.trigger(this.$element, 'update.zf.magellan', [this.active]);
	  }
  }

  /**
   * Destroys an instance of Magellan and resets the url of the window.
   * @function
   */
  _destroy() {
    // The bare-namespace forms drop the resizeme/scrollme and delegated
    // click listeners in one pass each, and the deep-link hashchange goes
    // with its per-instance namespace.
    Events.off(this.$element, '.zf.trigger .zf.magellan');
    Events.off(window, `hashchange.zf.magellan:${this.id}`);
    if (this.onLoadListener) Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
    // Reset the active link classes (the 6.x destroy cleanup).
    this.$element.querySelectorAll(`.${this.options.activeClass}`).forEach(function(el) {
      el.classList.remove(this.options.activeClass);
    }, this);
  }
}

/**
 * Default settings for plugin
 */
Magellan.defaults = {
  /**
   * Amount of time, in ms, the animated scrolling should take between locations.
   * @option
   * @type {number}
   * @default 500
   */
  animationDuration: 500,
  /**
   * Animation style to use when scrolling between locations. Can be `'swing'` or `'linear'`.
   * @option
   * @type {string}
   * @default 'linear'
   * @see {@link https://api.jquery.com/animate|Jquery animate}
   */
  animationEasing: 'linear',
  /**
   * Number of pixels to use as a marker for location changes.
   * @option
   * @type {number}
   * @default 50
   */
  threshold: 50,
  /**
   * Class applied to the active locations link on the magellan container.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  activeClass: 'is-active',
  /**
   * Allows the script to manipulate the url of the current page, and if supported, alter the history.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinking: false,
  /**
   * Update the browser history with the active link, if deep linking is enabled.
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false,
  /**
   * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
   * @option
   * @type {number}
   * @default 0
   */
  offset: 0
};

/**
 * OffCanvas module.
 * @module foundation.offCanvas
 * @requires foundation.util.keyboard
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

class OffCanvas extends Plugin {
  /**
   * Creates a new instance of an off-canvas wrapper.
   * @class
   * @name OffCanvas
   * @fires OffCanvas#init
   * @param {Object} element - jQuery object to initialize.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.className = 'OffCanvas'; // ie9 back compat
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, OffCanvas.defaults, datasetOptions(this.$element), options);
    this.contentClasses = { base: [], reveal: [] };
    this.$lastTrigger = null;
    this.$triggers = [];
    this.position = 'left';
    this.$content = null;
    this.nested = !!(this.options.nested);
    this.$sticky = [];
    this.isInCanvas = false;

    // Defines the CSS transition/position classes of the off-canvas content container.
    ['push', 'overlap'].forEach((val) => {
      this.contentClasses.base.push('has-transition-'+val);
    });
    ['left', 'right', 'top', 'bottom'].forEach((val) => {
      this.contentClasses.base.push('has-position-'+val);
      this.contentClasses.reveal.push('has-reveal-'+val);
    });

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();
    MediaQuery._init();

    this._init();
    this._events();

    Keyboard.register('OffCanvas', {
      'ESCAPE': 'close'
    });

  }

  /**
   * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
   * @function
   * @private
   */
  _init() {
    var id = this.$element.getAttribute('id');

    // State attributes and classes go through the native layer (7.0 line A, S10).
    this.$element.setAttribute('aria-hidden', 'true');

    // Find off-canvas content, either by ID (if specified), by siblings or by closest selector (fallback)
    if (this.options.contentId) {
      this.$content = document.getElementById(this.options.contentId);
    } else {
      var siblingContent = Array.from(this.$element.parentElement.children).filter(el => el !== this.$element && el.matches('[data-off-canvas-content]'));
      this.$content = siblingContent[0] || this.$element.closest('[data-off-canvas-content]');
    }

    if (!this.options.contentId) {
      // Assume that the off-canvas element is nested if it isn't a sibling of the content
      this.nested = !(this.$content && this.$content.parentElement === this.$element.parentElement);

    } else if (this.options.contentId && this.options.nested === null) {
      // Warning if using content ID without setting the nested option
      // Once the element is nested it is required to work properly in this case
      console.warn('Remember to use the nested option if using the content ID option!');
    }

    if (this.nested === true) {
      // Force transition overlap if nested
      this.options.transition = 'overlap';
      // Remove appropriate classes if already assigned in markup
      this.$element.classList.remove('is-transition-push');
    }

    this.$element.classList.add(`is-transition-${this.options.transition}`, 'is-closed');

    // Find triggers that affect this element and add aria-expanded to them
    this.$triggers = Array.from(document.querySelectorAll(`[data-open="${id}"], [data-close="${id}"], [data-toggle="${id}"]`));
    this.$triggers.forEach(function(el) {
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-controls', id);
    });

    // Get position by checking for related CSS class
    this.position = this.$element.matches('.position-left, .position-top, .position-right, .position-bottom') ? this.$element.className.match(/position\-(left|top|right|bottom)/)[1] : this.position;

    // Add an overlay over the content if necessary
    if (this.options.contentOverlay === true) {
      var overlay = document.createElement('div');
      var overlayPosition = window.getComputedStyle(this.$element).position === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
      overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
      this.$overlay = overlay;
      if(overlayPosition === 'is-overlay-fixed') {
        this.$element.after(overlay);
      } else {
        this.$content.appendChild(overlay);
      }
    }

    // Get the revealOn option from the class.
    var revealOnRegExp = new RegExp(RegExpEscape(this.options.revealClass) + '([^\\s]+)', 'g');
    var revealOnClass = revealOnRegExp.exec(this.$element.className);
    if (revealOnClass) {
      this.options.isRevealed = true;
      this.options.revealOn = this.options.revealOn || revealOnClass[1];
    }

    // Ensure the `reveal-on-*` class is set.
    if (this.options.isRevealed === true && this.options.revealOn) {
      this.$element.classList.add(`${this.options.revealClass}${this.options.revealOn}`);
      this._setMQChecker();
    }

    if (this.options.transitionTime) {
      this.$element.style.transitionDuration = this.options.transitionTime;
    }

    // Find fixed elements that should stay fixed while off-canvas is opened
    this.$sticky = this.$content ? Array.from(this.$content.querySelectorAll('[data-off-canvas-sticky]')) : [];
    if (this.$sticky.length > 0 && this.options.transition === 'push') {
      // If there's at least one match force contentScroll:false because the absolute top value doesn't get recalculated on scroll
      // Limit to push transition since there's no transform scope for overlap
      this.options.contentScroll = false;
    }

    let inCanvasFor = this.$element.className.match(/\bin-canvas-for-(\w+)/);
    if (inCanvasFor && inCanvasFor.length === 2) {
      // Set `inCanvasOn` option if found in-canvas-for-[BREAKPONT] CSS class
      this.options.inCanvasOn = inCanvasFor[1];
    } else if (this.options.inCanvasOn) {
      // Ensure the CSS class is set
      this.$element.classList.add(`in-canvas-for-${this.options.inCanvasOn}`);
    }

    if (this.options.inCanvasOn) {
      this._checkInCanvas();
    }

    // Initally remove all transition/position CSS classes from off-canvas content container.
    this._removeContentClasses();
  }

  /**
   * Adds event handlers to the off-canvas wrapper and the exit overlay.
   * @function
   * @private
   */
  _events() {
    // S10: the open/close/toggle consumers run on the native event layer;
    // the Triggers producers dispatch element-local on both transports
    // since S4 (dispatchLocal), so exactly one layer holds the listener and
    // nothing double-fires.
    Events.off(this.$element, 'open.zf.trigger close.zf.trigger toggle.zf.trigger');
    Events.on(this.$element, 'open.zf.trigger', this.open.bind(this));
    Events.on(this.$element, 'close.zf.trigger', this.close.bind(this));
    Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));

    // 7.0 terminal form: the keydown consumer runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    Events.off(this.$element, 'keydown.zf.offCanvas');
    Events.on(this.$element, 'keydown.zf.offCanvas', this._handleKeyboard.bind(this));

    if (this.options.closeOnClick === true) {
      var target = this.options.contentOverlay ? this.$overlay : this.$content;
      // S10: the close-on-click consumer runs on the native event layer -
      // real clicks arrive directly and jQuery-synthesized clicks on the
      // overlay/content ride the `.click()` shortcut bridge (reveal-native
      // precedent).
      Events.off(target, 'click.zf.offCanvas');
      Events.on(target, 'click.zf.offCanvas', this.close.bind(this));
    }

    if (this.options.inCanvasOn) {
      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/tabs/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs all flipped with the producer in the same
      // move).
      if (this._inCanvasMqHandler) Events.off(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
      this._inCanvasMqHandler = () => {
        this._checkInCanvas();
      };
      Events.on(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
    }

  }

  /**
   * Applies event listener for elements that will reveal at certain breakpoints.
   * @private
   */
  _setMQChecker() {
    var _this = this;

    this.onLoadListener = onLoad(window, function () {
      if (MediaQuery.atLeast(_this.options.revealOn)) {
        _this.reveal(true);
      }
    });

    // S13 flip: the reveal-on-breakpoint watcher binds to the real
    // changed.zf.mediaquery broadcast on the native layer (see _events).
    if (this._revealMqHandler) Events.off(window, 'changed.zf.mediaquery', this._revealMqHandler);
    this._revealMqHandler = function () {
      if (MediaQuery.atLeast(_this.options.revealOn)) {
        _this.reveal(true);
      } else {
        _this.reveal(false);
      }
    };
    Events.on(window, 'changed.zf.mediaquery', this._revealMqHandler);
  }

  /**
   * Checks if InCanvas on current breakpoint and adjust off-canvas accordingly
   * @private
   */
  _checkInCanvas() {
    this.isInCanvas = MediaQuery.atLeast(this.options.inCanvasOn);
    if (this.isInCanvas === true) {
      this.close();
    }
  }

  /**
   * Removes the CSS transition/position classes of the off-canvas content container.
   * Removing the classes is important when another off-canvas gets opened that uses the same content container.
   * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
   * @private
   */
  _removeContentClasses(hasReveal) {
    // State classes go through the native layer (7.0 line A, S10).
    if (typeof hasReveal !== 'boolean') {
      this.contentClasses.base.forEach(token => this.$content.classList.remove(token));
    } else if (hasReveal === false) {
      this.$content.classList.remove(`has-reveal-${this.position}`);
    }
  }

  /**
   * Adds the CSS transition/position classes of the off-canvas content container, based on the opening off-canvas element.
   * Beforehand any transition/position class gets removed.
   * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
   * @private
   */
  _addContentClasses(hasReveal) {
    this._removeContentClasses(hasReveal);
    if (typeof hasReveal !== 'boolean') {
      this.$content.classList.add(`has-transition-${this.options.transition}`, `has-position-${this.position}`);
    } else if (hasReveal === true) {
      this.$content.classList.add(`has-reveal-${this.position}`);
    }
  }

  /**
   * Preserves the fixed behavior of sticky elements on opening an off-canvas with push transition.
   * Since the off-canvas container has got a transform scope in such a case, it is done by calculating position absolute values.
   * @private
   */
  _fixStickyElements() {
    this.$sticky.forEach((el) => {
      // If sticky element is currently fixed, adjust its top value to match absolute position due to transform scope
      // Limit to push transition because postion:fixed works without problems for overlap (no transform scope)
      if (window.getComputedStyle(el).position === 'fixed') {

        // Save current inline styling to restore it if undoing the absolute fixing
        // (the 6.x save rode jQuery's data cache; the expando keeps it invisible)
        let topVal = parseInt(window.getComputedStyle(el).top, 10);
        el.zfOffCanvasSticky = { top: topVal };

        let absoluteTopVal = window.pageYOffset + topVal;
        el.style.top = `${absoluteTopVal}px`;
        el.style.width = '100%';
        el.style.transition = 'none';
      }
    });
  }

  /**
   * Restores the original fixed styling of sticky elements after having closed an off-canvas that got pseudo fixed beforehand.
   * This reverts the changes of _fixStickyElements()
   * @private
   */
  _unfixStickyElements() {
    this.$sticky.forEach((el) => {
      let stickyData = el.zfOffCanvasSticky;

      // If sticky element has got data object with prior values (meaning it was originally fixed) restore these values once off-canvas is closed
      if (typeof stickyData === 'object') {
        el.style.top = `${stickyData.top}px`;
        el.style.width = '';
        el.style.transition = '';
        el.zfOffCanvasSticky = '';
      }
    });
  }

  /**
   * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
   * @param {Boolean} isRevealed - true if element should be revealed.
   * @function
   */
  reveal(isRevealed) {
    if (isRevealed) {
      this.close();
      this.isRevealed = true;
      this.$element.setAttribute('aria-hidden', 'false');
      Events.off(this.$element, 'open.zf.trigger toggle.zf.trigger');
      this.$element.classList.remove('is-closed');
    } else {
      this.isRevealed = false;
      this.$element.setAttribute('aria-hidden', 'true');
      Events.off(this.$element, 'open.zf.trigger toggle.zf.trigger');
      Events.on(this.$element, 'open.zf.trigger', this.open.bind(this));
      Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));
      this.$element.classList.add('is-closed');
    }
    this._addContentClasses(isRevealed);
  }

  /**
   * Stops scrolling of the body when OffCanvas is open on mobile Safari and other troublesome browsers.
   * @function
   * @private
   */
  _stopScrolling() {
    return false;
  }

  /**
   * Save current finger y-position
   * @param event
   * @private
   */
  _recordScrollable(event) {
    const elem = this;
    elem.lastY = event.touches[0].pageY;
  }

  /**
   * Prevent further scrolling when it hits the edges
   * @param event
   * @private
   */
  _preventDefaultAtEdges(event) {
    // bound with the plugin instance as `this._edgesBound`'s target arg
    const elem = this;
    const _this = event.data || event.currentTarget.zfOffCanvas || this;
    const delta = elem.lastY - event.touches[0].pageY;
    elem.lastY = event.touches[0].pageY;

    if (!_this._canScroll(delta, elem)) {
      event.preventDefault();
    }
  }

  /**
   * Handle continuous scrolling of scrollbox
   * Don't bubble up to _preventDefaultAtEdges
   * @param event
   * @private
   */
  _scrollboxTouchMoved(event) {
    const elem = this;
    const _this = event.data;
    const parent = elem.closest('[data-off-canvas], [data-off-canvas-scrollbox-outer]');
    const delta = elem.lastY - event.touches[0].pageY;
    parent.lastY = elem.lastY = event.touches[0].pageY;

    event.stopPropagation();

    if (!_this._canScroll(delta, elem)) {
      if (!_this._canScroll(delta, parent)) {
        event.preventDefault();
      } else {
        parent.scrollTop += delta;
      }
    }
  }

  /**
   * Detect possibility of scrolling
   * @param delta
   * @param elem
   * @returns boolean
   * @private
   */
  _canScroll(delta, elem) {
    const up = delta < 0;
    const down = delta > 0;
    const allowUp = elem.scrollTop > 0;
    const allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
    return up && allowUp || down && allowDown;
  }

  /**
   * Opens the off-canvas menu.
   * @function
   * @param {Object} event - Event object passed from listener.
   * @param {jQuery} trigger - element that triggered the off-canvas to open.
   * @fires OffCanvas#opened
   * @todo also trigger 'open' event?
   */
  open(event, trigger) {
    if (this.$element.classList.contains('is-open') || this.isRevealed || this.isInCanvas) { return; }

    if (trigger) {
      this.$lastTrigger = trigger;
    }

    if (this.options.forceTo === 'top') {
      window.scrollTo(0, 0);
    } else if (this.options.forceTo === 'bottom') {
      window.scrollTo(0,document.body.scrollHeight);
    }

    Array.from(this.$element.parentElement.children).forEach((sib) => {
      if (sib !== this.$element && sib.matches('[data-off-canvas-content]')) {
        sib.style.transitionDuration = (this.options.transitionTime && this.options.transition !== 'overlap') ? this.options.transitionTime : '';
      }
    });

    // State classes and ARIA go through the native layer (7.0 line A, S10).
    this.$element.classList.add('is-open');
    this.$element.classList.remove('is-closed');

    this.$triggers.forEach(function(el) {
      el.setAttribute('aria-expanded', 'true');
    });
    this.$element.setAttribute('aria-hidden', 'false');

    this.$content.classList.add('is-open-' + this.position);

    // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
    // 7.0 terminal form: the touch guards run on the native event layer;
    // jQuery's event.data binding becomes a closure binding on the element
    // (the delegated scrollbox listeners keep the delegate form).
    if (this.options.contentScroll === false) {
      document.body.classList.add('is-off-canvas-open');
      Events.on(document.body, 'touchmove.zf.offCanvas', this._stopScrolling);
      this._edgesBound = (event) => { this._preventDefaultAtEdges.call(event.currentTarget, event); };
      Events.on(this.$element, 'touchstart.zf.offCanvas', this._recordScrollable);
      Events.on(this.$element, 'touchmove.zf.offCanvas', this._edgesBound);
      Events.delegate(this.$element, 'touchstart.zf.offCanvas', '[data-off-canvas-scrollbox]', this._recordScrollable);
      this._scrollboxBound = (event) => {
        const box = event.target.closest('[data-off-canvas-scrollbox]');
        if (box) { this._scrollboxTouchMoved.call(box, event); }
      };
      Events.delegate(this.$element, 'touchmove.zf.offCanvas', '[data-off-canvas-scrollbox]', this._scrollboxBound);
    }

    if (this.options.contentOverlay === true) {
      this.$overlay.classList.add('is-visible');
    }

    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
      this.$overlay.classList.add('is-closable');
    }

    if (this.options.autoFocus === true) {
      Events.one(this.$element, transitionend(this.$element), function() {
        if (!this.classList.contains('is-open')) {
          return; // exit if prematurely closed
        }
        var canvasFocus = this.querySelector('[data-autofocus]');
        if (canvasFocus) {
            canvasFocus.focus();
        } else {
            var firstLink = this.querySelector('a, button');
            if (firstLink) { firstLink.focus(); }
        }
      });
    }

    if (this.options.trapFocus === true) {
      this.$content.setAttribute('tabindex', '-1');
      Keyboard.trapFocus(this.$element);
    }

    if (this.options.transition === 'push') {
      this._fixStickyElements();
    }

    this._addContentClasses();

    /**
     * Fires when the off-canvas menu opens.
     * @event OffCanvas#opened
     */
    // S10: real, bubbling CustomEvent.
    Events.trigger(this.$element, 'opened.zf.offCanvas');

    /**
     * Fires when the off-canvas menu open transition is done.
     * @event OffCanvas#openedEnd
     */
    // 7.0 terminal form: the transitionend wait is an Events.one (the
    // coarse suite drives it through the native triggerHandler).
    Events.one(this.$element, transitionend(this.$element), () => {
      Events.trigger(this.$element, 'openedEnd.zf.offCanvas');
    });
  }

  /**
   * Closes the off-canvas menu.
   * @function
   * @param {Function} cb - optional cb to fire after closure.
   * @fires OffCanvas#close
   * @fires OffCanvas#closed
   */
  close() {
    if (!this.$element.classList.contains('is-open') || this.isRevealed) { return; }

    /**
     * Fires when the off-canvas menu closes.
     * @event OffCanvas#close
     */
    Events.trigger(this.$element, 'close.zf.offCanvas');

    this.$element.classList.remove('is-open');

    this.$element.setAttribute('aria-hidden', 'true');

    this.$content.classList.remove('is-open-left', 'is-open-top', 'is-open-right', 'is-open-bottom');

    if (this.options.contentOverlay === true) {
      this.$overlay.classList.remove('is-visible');
    }

    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
      this.$overlay.classList.remove('is-closable');
    }

    this.$triggers.forEach(function(el) {
      el.setAttribute('aria-expanded', 'false');
    });


    // Listen to transitionEnd: add class, re-enable scrolling and release focus when done.
    // 7.0 terminal form: the transitionend wait is an Events.one (the
    // coarse suite drives it through the native triggerHandler).
    Events.one(this.$element, transitionend(this.$element), () => {

      this.$element.classList.add('is-closed');
      this._removeContentClasses();

      if (this.options.transition === 'push') {
        this._unfixStickyElements();
      }

      // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        document.body.classList.remove('is-off-canvas-open');
        Events.off(document.body, 'touchmove.zf.offCanvas', this._stopScrolling);
        Events.off(this.$element, 'touchstart.zf.offCanvas touchmove.zf.offCanvas');
      }

      if (this.options.trapFocus === true) {
        this.$content.removeAttribute('tabindex');
        Keyboard.releaseFocus(this.$element);
      }

      /**
       * Fires when the off-canvas menu close transition is done.
       * @event OffCanvas#closed
       */
      Events.trigger(this.$element, 'closed.zf.offCanvas');
    });
  }

  /**
   * Toggles the off-canvas menu open or closed.
   * @function
   * @param {Object} event - Event object passed from listener.
   * @param {jQuery} trigger - element that triggered the off-canvas to open.
   */
  toggle(event, trigger) {
    if (this.$element.classList.contains('is-open')) {
      this.close(event, trigger);
    }
    else {
      this.open(event, trigger);
    }
  }

  /**
   * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
   * @function
   * @private
   */
  _handleKeyboard(e) {
    Keyboard.handleKey(e, 'OffCanvas', {
      close: () => {
        this.close();
        // the empty-collection .focus() was a silent no-op in 6.x
        if (this.$lastTrigger) { this.$lastTrigger.focus(); }
        return true;
      },
      handled: () => {
        e.preventDefault();
      }
    });
  }

  /**
   * Destroys the OffCanvas plugin.
   * @function
   */
  _destroy() {
    this.close();
    // The zf-namespaced listeners on the element and overlay (the native
    // table the library owns), plus the namespaceless transitionend waits -
    // a late real transitionend would dereference the nulled instance.
    Events.off(this.$element, '.zf.trigger .zf.offCanvas');
    Events.off(this.$element, transitionend(this.$element));
    if (this.$overlay) { Events.off(this.$overlay, '.zf.offCanvas'); }
    if (this._inCanvasMqHandler) Events.off(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
    if (this._revealMqHandler) Events.off(window, 'changed.zf.mediaquery', this._revealMqHandler);
    if (this.onLoadListener) Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
  }
}

OffCanvas.defaults = {
  /**
   * Allow the user to click outside of the menu to close it.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,

  /**
   * Adds an overlay on top of `[data-off-canvas-content]`.
   * @option
   * @type {boolean}
   * @default true
   */
  contentOverlay: true,

  /**
   * Target an off-canvas content container by ID that may be placed anywhere. If null the closest content container will be taken.
   * @option
   * @type {?string}
   * @default null
   */
  contentId: null,

  /**
   * Define the off-canvas element is nested in an off-canvas content. This is required when using the contentId option for a nested element.
   * @option
   * @type {boolean}
   * @default null
   */
  nested: null,

  /**
   * Enable/disable scrolling of the main content when an off canvas panel is open.
   * @option
   * @type {boolean}
   * @default true
   */
  contentScroll: true,

  /**
   * Amount of time the open and close transition requires, including the appropriate milliseconds (`ms`) or seconds (`s`) unit (e.g. `500ms`, `.75s`) If none selected, pulls from body style.
   * @option
   * @type {string}
   * @default null
   */
  transitionTime: null,

  /**
   * Type of transition for the OffCanvas menu. Options are 'push', 'detached' or 'slide'.
   * @option
   * @type {string}
   * @default push
   */
  transition: 'push',

  /**
   * Force the page to scroll to top or bottom on open.
   * @option
   * @type {?string}
   * @default null
   */
  forceTo: null,

  /**
   * Allow the OffCanvas to remain open for certain breakpoints.
   * @option
   * @type {boolean}
   * @default false
   */
  isRevealed: false,

  /**
   * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
   * @option
   * @type {?string}
   * @default null
   */
  revealOn: null,

  /**
   * Breakpoint at which the off-canvas gets moved into canvas content and acts as regular page element.
   * @option
   * @type {?string}
   * @default null
   */
  inCanvasOn: null,

  /**
   * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
   * @option
   * @type {boolean}
   * @default true
   */
  autoFocus: true,

  /**
   * Class used to force an OffCanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
   * @option
   * @type {string}
   * @default reveal-for-
   * @todo improve the regex testing for this.
   */
  revealClass: 'reveal-for-',

  /**
   * Triggers optional focus trapping when opening an OffCanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
   * @option
   * @type {boolean}
   * @default false
   */
  trapFocus: false
};

/**
 * Orbit module.
 * @module foundation.orbit
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 * @requires foundation.util.timer
 * @requires foundation.util.imageLoader
 * @requires foundation.util.touch
 */

class Orbit extends Plugin {
  /**
  * Creates a new instance of an orbit carousel.
  * @class
  * @name Orbit
  * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
  * @param {Object} options - Overrides to the default plugin settings.
  */
  _setup(element, options){
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Orbit.defaults, datasetOptions(this.$element), options);
    this.className = 'Orbit'; // ie9 back compat

    Touch.init(); // Touch init is idempotent, we just need to make sure it's initialied.

    this._init();

    Keyboard.register('Orbit', {
      'ltr': {
        'ARROW_RIGHT': 'next',
        'ARROW_LEFT': 'previous'
      },
      'rtl': {
        'ARROW_LEFT': 'next',
        'ARROW_RIGHT': 'previous'
      }
    });
  }

  /**
  * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
  * @function
  * @private
  */
  _init() {
    // @TODO: consider discussion on PR #9278 about DOM pollution by changeSlide
    this._reset();

    this.$wrapper = this.$element.querySelector(`.${this.options.containerClass}`);
    this.$slides = Array.from(this.$element.querySelectorAll(`.${this.options.slideClass}`));

    var images = this.$element.querySelectorAll('img'),
        initActive = this.$slides.filter(slide => slide.classList.contains('is-active')),
        id = this.$element.id || GetYoDigits(6, 'orbit');

    // State attributes and classes go through the native layer (7.0 line A, S10).
    this.$element.setAttribute('data-resize', id);
    this.$element.id = id;

    if (!initActive.length && this.$slides.length) {
      this.$slides[0].classList.add('is-active');
    }

    if (!this.options.useMUI) {
      this.$slides.forEach(slide => slide.classList.add('no-motionui'));
    }

    if (images.length) {
      onImagesLoaded(images, this._prepareForOrbit.bind(this));
    } else {
      this._prepareForOrbit();//hehe
    }

    if (this.options.bullets) {
      this._loadBullets();
    }

    this._events();

    if (this.options.autoPlay && this.$slides.length > 1) {
      this.geoSync();
    }

    if (this.options.accessible) { // allow wrapper to be focusable to enable arrow navigation
      this.$wrapper.setAttribute('tabindex', 0);
    }
  }

  /**
  * Creates a jQuery collection of bullets, if they are being used.
  * @function
  * @private
  */
  _loadBullets() {
    this.$bullets = Array.from(this.$element.querySelectorAll(`.${this.options.boxOfBullets} button`));
  }

  /**
  * Sets a `timer` object on the orbit, and starts the counter for the next slide.
  * @function
  */
  geoSync() {
    var _this = this;
    this.timer = new Timer(
      this.$element,
      {
        duration: this.options.timerDelay,
        infinite: false
      },
      function() {
        _this.changeSlide(true);
      },
      'orbit');
    this.timer.start();
  }

  /**
  * Sets wrapper and slide heights for the orbit.
  * @function
  * @private
  */
  _prepareForOrbit() {
    this._setWrapperHeight();
  }

  /**
  * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
  * @function
  * @private
  * @param {Function} cb - a callback function to fire when complete.
  */
  _setWrapperHeight(cb) {//rewrite this to `for` loop
    var max = 0, temp, counter = 0, _this = this;

    this.$slides.forEach(function(slide) {
      temp = slide.getBoundingClientRect().height;
      slide.setAttribute('data-slide', counter);

      // hide all slides but the active one
      if (!/mui/g.test(slide.className) && _this.$slides.filter(s => s.classList.contains('is-active'))[0] !== _this.$slides[counter]) {
        slide.style.display = 'none';
      }
      max = temp > max ? temp : max;
      counter++;
    });

    if (counter === this.$slides.length) {
      this.$wrapper.style.height = max + 'px'; //only change the wrapper height property once.
      if(cb) {cb(max);} //fire callback with max height dimension.
    }
  }

  /**
  * Sets the max-height of each slide.
  * @function
  * @private
  */
  _setSlideHeight(height) {
    this.$slides.forEach(function(slide) {
      slide.style.maxHeight = height + 'px';
    });
  }

  /**
  * Adds event listeners to basically everything within the element.
  * @function
  * @private
  */
  _events() {
    var _this = this;

    //***************************************
    //**Now using custom event - thanks to:**
    //**      Yohai Ararat of Toronto      **
    //***************************************
    //
    // S10: the resizeme consumer runs on the native event layer; the
    // producer in the Triggers util has dispatched real element-local
    // events since S4.
    Events.off(this.$element, 'resizeme.zf.trigger');
    Events.on(this.$element, 'resizeme.zf.trigger', this._prepareForOrbit.bind(this));
    if (this.$slides.length > 1) {

      if (this.options.swipe) {
        // S13: the swipe consumers flip with the Touch util - swipeleft/
        // swiperight are real, bubbling events on the slide now, so these
        // listeners live on the native event layer.
        this.$slides.forEach(slide => {
          Events.off(slide, 'swipeleft.zf.orbit swiperight.zf.orbit');
          Events.on(slide, 'swipeleft.zf.orbit', function(e){
            e.preventDefault();
            _this.changeSlide(true);
          });
          Events.on(slide, 'swiperight.zf.orbit', function(e){
            e.preventDefault();
            _this.changeSlide(false);
          });
        });
      }
      //***************************************

      if (this.options.autoPlay) {
        // S10: the slide click consumer runs on the native event layer -
        // real clicks arrive directly and jQuery-synthesized clicks on
        // slides ride the `.click()` shortcut bridge (reveal-native
        // precedent). The clickedOn bookkeeping rides an expando (the 6.x
        // jQuery data cache was DOM-invisible).
        this.$slides.forEach(slide => {
          Events.off(slide, 'click.zf.orbit');
          Events.on(slide, 'click.zf.orbit', function() {
            _this.$element.zfOrbitClickedOn = !_this.$element.zfOrbitClickedOn;
            _this.timer[_this.$element.zfOrbitClickedOn ? 'pause' : 'start']();
          });
        });

        if (this.options.pauseOnHover) {
          // 7.0 terminal form: hover on real mouseover/mouseout with the
          // entering/leaving filter (jQuery's mouseenter synthesis port).
          var hoverFilter = function(handler) {
            return function(e) {
              if (e.relatedTarget && this.contains(e.relatedTarget)) { return; }
              handler.call(this, e);
            };
          };
          Events.off(this.$element, 'mouseover.zf.orbit mouseout.zf.orbit');
          Events.on(this.$element, 'mouseover.zf.orbit', hoverFilter(function() {
            _this.timer.pause();
          }));
          Events.on(this.$element, 'mouseout.zf.orbit', hoverFilter(function() {
            if (!_this.$element.zfOrbitClickedOn) {
              _this.timer.start();
            }
          }));
        }
      }

      if (this.options.navButtons) {
        var controls = Array.from(this.$element.querySelectorAll(`.${this.options.nextClass}, .${this.options.prevClass}`));
        // S10: the nav-button click consumers run on the native event
        // layer; the tabindex write goes native with it.
        controls.forEach(control => {
          control.setAttribute('tabindex', 0);
          Events.off(control, 'click.zf.orbit touchend.zf.orbit');
          //also need to handle enter/return and spacebar key presses
          Events.on(control, 'click.zf.orbit touchend.zf.orbit', function(e){
	    e.preventDefault();
            _this.changeSlide(this.classList.contains(_this.options.nextClass));
          });
        });
      }

      if (this.options.bullets) {
        // S10: the bullet click consumers run on the native event layer
        // (real clicks; jQuery-synthesized clicks on buttons ride the
        // `.click()` shortcut bridge). The data reads are the numeric
        // attribute parses jQuery's .data() performed.
        this.$bullets.forEach(bullet => {
          Events.off(bullet, 'click.zf.orbit touchend.zf.orbit');
          Events.on(bullet, 'click.zf.orbit touchend.zf.orbit', function() {
            if (/is-active/g.test(this.className)) { return false; }//if this is active, kick out of function.
            var idx = parseInt(this.getAttribute('data-slide'), 10),
                activeSlide = _this.$slides.filter(s => s.classList.contains('is-active'))[0],
                ltr = activeSlide ? idx > parseInt(activeSlide.getAttribute('data-slide'), 10) : true,
                slide = _this.$slides[idx];

            _this.changeSlide(ltr, slide, idx);
          });
        });
      }

      if (this.options.accessible) {
        // 7.0 terminal form: the keydown listener runs on the native event
        // layer (the coarse suite's mocks dispatch real KeyboardEvents
        // since the S16 migration), on the wrapper and every bullet like
        // the collection-wide .on() did.
        [this.$wrapper].concat(this.$bullets).filter(Boolean).forEach(bound => {
          Events.off(bound, 'keydown.zf.orbit');
          Events.on(bound, 'keydown.zf.orbit', function(e) {
            // handle keyboard event with keyboard util
            Keyboard.handleKey(e, 'Orbit', {
              next: function() {
                _this.changeSlide(true);
              },
              previous: function() {
                _this.changeSlide(false);
              },
              handled: function() { // if bullet is focused, make sure focus moves
                if (_this.$bullets.indexOf(e.target) !== -1) {
                  // the collection .focus() focused the first active bullet
                  var activeBullet = _this.$bullets.filter(b => b.classList.contains('is-active'))[0];
                  if (activeBullet) { activeBullet.focus(); }
                }
              }
            });
          });
        });
      }
    }
  }

  /**
   * Resets Orbit so it can be reinitialized
   */
  _reset() {
    // Don't do anything if there are no slides (first run)
    if (typeof this.$slides === 'undefined') {
      return;
    }

    if (this.$slides.length > 1) {
      // Remove old events (S10/S13): the native wipe drops the click, swipe,
      // keydown and hover listeners on the element and its descendants.
      Events.off(this.$element, '.zf.orbit');
      Array.from(this.$element.querySelectorAll('*')).forEach(el => Events.off(el, '.zf.orbit'));

      // Restart timer if autoPlay is enabled
      if (this.options.autoPlay) {
        this.timer.restart();
      }

      // Reset all slides
      this.$slides.forEach(function(slide) {
        slide.classList.remove('is-active', 'is-in');
        slide.removeAttribute('aria-live');
        slide.style.display = 'none';
      });

      // Show the first slide
      this.$slides[0].classList.add('is-active');
      this.$slides[0].style.display = '';

      // Triggers when the slide has finished animating
      // S10: real, bubbling CustomEvent; the terminal form forwards the
      // plain slide element.
      Events.trigger(this.$element, 'slidechange.zf.orbit', [this.$slides[0]]);

      // Select first bullet if bullets are present
      if (this.options.bullets) {
        this._updateBullets(0);
      }
    }
  }

  /**
  * Changes the current slide to a new one.
  * @function
  * @param {Boolean} isLTR - if true the slide moves from right to left, if false the slide moves from left to right.
  * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
  * @param {Number} idx - the index of the new slide in its collection, if one chosen.
  * @fires Orbit#slidechange
  */
  changeSlide(isLTR, chosenSlide, idx) {
    if (!this.$slides) {return; } // Don't freak out if we're in the middle of cleanup
    // Accepts the plain element (the 7.0 contract) or a collection.
    if (chosenSlide && chosenSlide.nodeType !== 1) { chosenSlide = chosenSlide[0]; }
    var curSlide = this.$slides.filter(s => s.classList.contains('is-active'))[0];

    if (/mui/g.test(curSlide.className)) { return false; } //if the slide is currently animating, kick out of the function

    var firstSlide = this.$slides[0],
    lastSlide = this.$slides[this.$slides.length - 1],
    dirIn = isLTR ? 'Right' : 'Left',
    dirOut = isLTR ? 'Left' : 'Right',
    _this = this,
    newSlide;

    var sibling = function(el, dir) {
      var next = dir === 'next' ? el.nextElementSibling : el.previousElementSibling;
      return (next && next.matches(`.${_this.options.slideClass}`)) ? next : null;
    };

    if (!chosenSlide) { //most of the time, this will be auto played or clicked from the navButtons.
      newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
      (this.options.infiniteWrap ? sibling(curSlide, 'next') || firstSlide : sibling(curSlide, 'next'))//pick next slide if moving left to right
      :
      (this.options.infiniteWrap ? sibling(curSlide, 'prev') || lastSlide : sibling(curSlide, 'prev'));//pick prev slide if moving right to left
    } else {
      newSlide = chosenSlide;
    }

    if (newSlide) {
      /**
      * Triggers before the next slide starts animating in and only if a next slide has been found.
      * @event Orbit#beforeslidechange
      */
      // Terminal form: the forwarded slides are plain elements.
      Events.trigger(this.$element, 'beforeslidechange.zf.orbit', [curSlide, newSlide]);

      if (this.options.bullets) {
        idx = idx || this.$slides.indexOf(newSlide); //grab index to update bullets
        this._updateBullets(idx);
      }

      if (this.options.useMUI && visible(this.$element)) {
        newSlide.classList.add('is-active');
        Motion.animateIn(
          newSlide,
          this.options[`animInFrom${dirIn}`],
          function(){
            newSlide.style.display = 'block';
            newSlide.setAttribute('aria-live', 'polite');
        });

        curSlide.classList.remove('is-active');
        Motion.animateOut(
          curSlide,
          this.options[`animOutTo${dirOut}`],
          function(){
            curSlide.removeAttribute('aria-live');
            if(_this.options.autoPlay && !_this.timer.isPaused){
              _this.timer.restart();
            }
            //do stuff?
          });
      } else {
        curSlide.classList.remove('is-active', 'is-in');
        curSlide.removeAttribute('aria-live');
        curSlide.style.display = 'none';
        newSlide.classList.add('is-active', 'is-in');
        newSlide.setAttribute('aria-live', 'polite');
        newSlide.style.display = '';
        if (this.options.autoPlay && !this.timer.isPaused) {
          this.timer.restart();
        }
      }
    /**
    * Triggers when the slide has finished animating in.
    * @event Orbit#slidechange
    */
      Events.trigger(this.$element, 'slidechange.zf.orbit', [newSlide]);
    }
  }

  /**
  * Updates the active state of the bullets, if displayed.
  * Move the descriptor of the current slide `[data-slide-active-label]` to the newly active bullet.
  * If no `[data-slide-active-label]` is set, will move the exceeding `span` element.
  *
  * @function
  * @private
  * @param {Number} idx - the index of the current slide.
  */
  _updateBullets(idx) {
    var oldBullet = this.$bullets.filter(b => b.classList.contains('is-active'))[0];
    var othersBullets = this.$bullets.filter(b => !b.classList.contains('is-active'));
    var newBullet = this.$bullets[idx];

    if (oldBullet) {
      oldBullet.classList.remove('is-active');
      oldBullet.blur();
    }
    if (newBullet) { newBullet.classList.add('is-active'); }
    if (!oldBullet || !newBullet) { return; }

    // Find the descriptor for the current slide to move it to the new slide button
    var labeled = Array.from(oldBullet.querySelectorAll(':scope > [data-slide-active-label]'));
    var activeStateDescriptor = labeled[labeled.length - 1];

    // If not explicitely given, search for the last "exceeding" span element (compared to others bullets).
    if (!activeStateDescriptor) {
      var spans = Array.from(oldBullet.querySelectorAll(':scope > span'));
      var spanCountInOthersBullets = othersBullets.map(b => b.querySelectorAll(':scope > span').length);

      // If there is an exceeding span element, use it as current slide descriptor
      if (spanCountInOthersBullets.every(count => count < spans.length)) {
        activeStateDescriptor = spans[spans.length - 1];
        activeStateDescriptor.setAttribute('data-slide-active-label', '');
      }
    }

    // Move the current slide descriptor to the new slide button
    if (activeStateDescriptor) {
      // .detach() + .append(): appendChild moves it (the descriptor carried
      // no per-element listeners)
      newBullet.appendChild(activeStateDescriptor);
    }
  }

  /**
  * Destroys the carousel and hides the element.
  * @function
  */
  _destroy() {
    // The native wipe drops every plugin-namespaced listener on the element
    // and its descendants (like _reset), then the destroy cleanup hides it.
    Events.off(this.$element, '.zf.orbit');
    Array.from(this.$element.querySelectorAll('*')).forEach(el => Events.off(el, '.zf.orbit'));
    this.$element.style.display = 'none';
    // Guarded (S14): the timer only exists when geoSync ran - autoPlay on
    // AND more than one slide. 6.x threw a TypeError on every destroy of a
    // single-slide or non-autoplay carousel; the guard keeps the M1 fix
    // (destroy stops the timer) for the instances that have one.
    if (this.timer) {
      this.timer.pause();
    }
  }
}

Orbit.defaults = {
  /**
  * Tells the JS to look for and loadBullets.
  * @option
   * @type {boolean}
  * @default true
  */
  bullets: true,
  /**
  * Tells the JS to apply event listeners to nav buttons
  * @option
   * @type {boolean}
  * @default true
  */
  navButtons: true,
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-in-right'
  */
  animInFromRight: 'slide-in-right',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-out-right'
  */
  animOutToRight: 'slide-out-right',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-in-left'
  *
  */
  animInFromLeft: 'slide-in-left',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-out-left'
  */
  animOutToLeft: 'slide-out-left',
  /**
  * Allows Orbit to automatically animate on page load.
  * @option
   * @type {boolean}
  * @default true
  */
  autoPlay: true,
  /**
  * Amount of time, in ms, between slide transitions
  * @option
   * @type {number}
  * @default 5000
  */
  timerDelay: 5000,
  /**
  * Allows Orbit to infinitely loop through the slides
  * @option
   * @type {boolean}
  * @default true
  */
  infiniteWrap: true,
  /**
  * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
  * @option
   * @type {boolean}
  * @default true
  */
  swipe: true,
  /**
  * Allows the timing function to pause animation on hover.
  * @option
   * @type {boolean}
  * @default true
  */
  pauseOnHover: true,
  /**
  * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
  * @option
   * @type {boolean}
  * @default true
  */
  accessible: true,
  /**
  * Class applied to the container of Orbit
  * @option
   * @type {string}
  * @default 'orbit-container'
  */
  containerClass: 'orbit-container',
  /**
  * Class applied to individual slides.
  * @option
   * @type {string}
  * @default 'orbit-slide'
  */
  slideClass: 'orbit-slide',
  /**
  * Class applied to the bullet container. You're welcome.
  * @option
   * @type {string}
  * @default 'orbit-bullets'
  */
  boxOfBullets: 'orbit-bullets',
  /**
  * Class applied to the `next` navigation button.
  * @option
   * @type {string}
  * @default 'orbit-next'
  */
  nextClass: 'orbit-next',
  /**
  * Class applied to the `previous` navigation button.
  * @option
   * @type {string}
  * @default 'orbit-previous'
  */
  prevClass: 'orbit-previous',
  /**
  * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatibility.
  * @option
   * @type {boolean}
  * @default true
  */
  useMUI: true
};

let MenuPlugins$1 = {
  dropdown: {
    cssClass: 'dropdown',
    plugin: DropdownMenu
  },
 drilldown: {
    cssClass: 'drilldown',
    plugin: Drilldown
  },
  accordion: {
    cssClass: 'accordion-menu',
    plugin: AccordionMenu
  }
};

  // import "foundation.util.triggers.js";


/**
 * ResponsiveMenu module.
 * @module foundation.responsiveMenu
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

// 7.0 line A, slice S11: the wrapper itself runs on the native layer. The
// mq switch is an explicit destroy+rebuild of the sub-plugin on the same
// element - all three sub-plugins (DropdownMenu, AccordionMenu, Drilldown)
// are native since S9 and register their own instance/attrs beside the
// wrapper's, like the 6.x zfPlugin guard let them.
class ResponsiveMenu extends Plugin {
  /**
   * Creates a new instance of a responsive menu.
   * @class
   * @name ResponsiveMenu
   * @fires ResponsiveMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element) {
    // 7.0 line A terminal form: the element (constructor contracts hand in
    // either shape during the mixed state).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.rules = this.$element.getAttribute('data-responsive-menu');
    this.currentMq = null;
    this.currentPlugin = null;
    this.className = 'ResponsiveMenu'; // ie9 back compat

    this._init();
    this._events();
  }

  /**
   * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
   * @function
   * @private
   */
  _init() {

    MediaQuery._init();
    // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
    if (typeof this.rules === 'string') {
      let rulesTree = {};

      // Parse rules from "classes" pulled from data attribute
      let rules = this.rules.split(' ');

      // Iterate through every rule found
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i].split('-');
        let ruleSize = rule.length > 1 ? rule[0] : 'small';
        let rulePlugin = rule.length > 1 ? rule[1] : rule[0];

        if (MenuPlugins$1[rulePlugin] !== null) {
          rulesTree[ruleSize] = MenuPlugins$1[rulePlugin];
        }
      }

      this.rules = rulesTree;
    }

    if (Object.keys(this.rules).length !== 0) {
      this._checkMediaQueries();
    }
    // Add data-mutate since children may need it.
    if (!this.$element.getAttribute('data-mutate')) {
      this.$element.setAttribute('data-mutate', GetYoDigits(6, 'responsive-menu'));
    }
  }

  /**
   * Initializes events for the Menu.
   * @function
   * @private
   */
  _events() {
    // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
    // bubbling window event on the native layer now, so this consumer binds
    // there (equalizer/tabs/responsiveToggle/responsiveAccordionTabs/
    // offcanvas all flipped with the producer in the same move).
    this._changedZfMediaQueryHandler = this._checkMediaQueries.bind(this);
    Events.on(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }

  /**
   * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
   * @function
   * @private
   */
  _checkMediaQueries() {
    var matchedMq = null;
    var element = this.$element;

    // Iterate through each rule and find the last matching rule
    Object.keys(this.rules).forEach(function(key) {
      if (MediaQuery.atLeast(key)) {
        matchedMq = key;
      }
    });

    // No match? No dice
    if (!matchedMq) return;

    // Plugin already initialized? We good
    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

    // Remove existing plugin-specific CSS classes
    Object.keys(MenuPlugins$1).forEach(function(key) {
      element.classList.remove(MenuPlugins$1[key].cssClass);
    });

    // Add the CSS class for the new plugin
    element.classList.add(this.rules[matchedMq].cssClass);

    // The swap is destroy + construct: the outgoing sub-plugin runs its own
    // destroy (listeners, feather, wrapper - each S9 plugin cleans its own
    // layer), then the new type is built on the same element.
    if (this.currentPlugin) this.currentPlugin.destroy();
    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
  }

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  _destroy() {
    if (this.currentPlugin) this.currentPlugin.destroy();
    Events.off(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }
}

ResponsiveMenu.defaults = {};

/**
 * ResponsiveToggle module.
 * @module foundation.responsiveToggle
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.motion
 */

class ResponsiveToggle extends Plugin {
  /**
   * Creates a new instance of Tab Bar.
   * @class
   * @name ResponsiveToggle
   * @fires ResponsiveToggle#init
   * @param {jQuery} element - jQuery object to attach tab bar functionality to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, ResponsiveToggle.defaults, datasetOptions(this.$element), options);
    this.className = 'ResponsiveToggle'; // ie9 back compat

    this._init();
    this._events();
  }

  /**
   * Initializes the tab bar by finding the target element, toggling element, and running update().
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();
    var targetID = this.options.responsiveToggle;
    if (!targetID) {
      console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
    }

    // A missing target stays a null element (the 6.x $(null) tolerance;
    // the show/hide helpers below guard for it).
    this.$targetMenu = document.getElementById(targetID);
    this.$toggler = Array.from(this.$element.querySelectorAll('[data-toggle]')).filter(function(el) {
      var target = datasetOptions(el).toggle;
      return (target === targetID || target === "");
    });
    this.options = deepMerge({}, this.options, this.$targetMenu ? datasetOptions(this.$targetMenu) : {});

    // If they were set, parse the animation classes
    if(this.options.animate) {
      let input = this.options.animate.split(' ');

      this.animationIn = input[0];
      this.animationOut = input[1] || null;
    }

    this._update();
  }

  /**
   * Adds necessary event handlers for the tab bar to work.
   * @function
   * @private
   */
  _events() {
    // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
    // bubbling window event on the native layer now, so this consumer
    // binds there (equalizer/tabs/responsiveMenu/responsiveAccordionTabs/
    // offcanvas all flipped with the producer in the same move).
    this._updateMqHandler = this._update.bind(this);
    Events.on(window, 'changed.zf.mediaquery', this._updateMqHandler);

    // The toggler clicks are real browser events: they register on the
    // native event layer, on every element of the filtered collection like
    // jQuery's collection-wide .on() did.
    this._toggleMenuHandler = this.toggleMenu.bind(this);
    this.$toggler.forEach(el => {
      Events.on(el, 'click.zf.responsiveToggle', this._toggleMenuHandler);
    });
  }

  /**
   * Native stand-in for jQuery's `.show()`: clears an inline display
   * override and, when the stylesheet still hides the element, falls back to
   * the default display of a block element - what jQuery's
   * getDefaultDisplay resolved to for everything this plugin shows (the
   * `.title-bar` markup carries its own `display: flex`, so the fallback is
   * only reached for stylesheet-hidden menus).
   * @function
   * @private
   */
  _show(element) {
    if (!element) { return; }
    element.style.display = '';
    if (window.getComputedStyle(element).display === 'none') {
      element.style.display = 'block';
    }
  }

  /**
   * Native stand-in for jQuery's `.hide()`: an inline `display: none`.
   * @function
   * @private
   */
  _hide(element) {
    if (!element) { return; }
    element.style.display = 'none';
  }

  /**
   * Checks the current media query to determine if the tab bar should be visible or hidden.
   * @function
   * @private
   */
  _update() {
    var element = this.$element;
    var targetMenu = this.$targetMenu;

    // Mobile
    if (!MediaQuery.atLeast(this.options.hideFor)) {
      this._show(element);
      this._hide(targetMenu);
    }

    // Desktop
    else {
      this._hide(element);
      this._show(targetMenu);
    }
  }

  /**
   * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
   * @function
   * @fires ResponsiveToggle#toggled
   */
  toggleMenu() {
    if (!MediaQuery.atLeast(this.options.hideFor)) {
      var targetMenu = this.$targetMenu;

      /**
       * Fires when the element attached to the tab bar toggles.
       * @event ResponsiveToggle#toggled
       */
      if(this.options.animate) {
        // `:hidden` replacement: Dom's visible() carries the narrow
        // display-based semantics decided for the 7.0 line (S3). An empty
        // target counts as shown, like jQuery's `.is(':hidden')` did.
        var menuHidden = targetMenu ? !visible(targetMenu) : false;

        if (menuHidden) {
          Motion.animateIn(this.$targetMenu, this.animationIn, () => {
            Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
            // S10 group flip: the animated half of the mutateme forwarding
            // joins the native event layer. It keeps the 6.x triggerHandler
            // form - element-local and non-bubbling, the Triggers
            // dispatchLocal ruling (a bubbling dispatch would over-deliver
            // to ancestor listeners) - and the last jQuery-side consumers
            // (Equalizer, Drilldown, Sticky) flip in the same commit.
            var mutated = targetMenu.querySelectorAll('[data-mutate]');
            for (var i = 0; i < mutated.length; i++) {
              Events.triggerHandler(mutated[i], 'mutateme.zf.trigger');
            }
          });
        }
        else {
          Motion.animateOut(this.$targetMenu, this.animationOut, () => {
            Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
          });
        }
      }
      else {
        // The 6.x `.toggle(0)` display flip, without the legacy fx tween
        // (a size/opacity "grow" that completed asynchronously; the display
        // and event contracts never depended on it - same ruling as the S6
        // Reveal showDelay tween). The synchronous order below is kept:
        // display flip, mutateme, toggled.
        if (targetMenu) {
          if (visible(targetMenu)) {
            this._hide(targetMenu);
          }
          else {
            this._show(targetMenu);
          }

          var mutated = targetMenu.querySelectorAll('[data-mutate]');
          for (var i = 0; i < mutated.length; i++) {
            // Bubbling production on the native event layer; the still-on-
            // jQuery consumers receive the real event pass-through.
            Events.trigger(mutated[i], 'mutateme.zf.trigger');
          }
        }

        Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
      }
    }
  };

  _destroy() {
    // The mq consumer (S13 flip) and the toggler click listeners, by bare
    // namespace.
    Events.off(window, 'changed.zf.mediaquery', this._updateMqHandler);
    this.$toggler.forEach(el => {
      Events.off(el, '.zf.responsiveToggle');
    });
  }
}

ResponsiveToggle.defaults = {
  /**
   * The breakpoint after which the menu is always shown, and the tab bar is hidden.
   * @option
   * @type {string}
   * @default 'medium'
   */
  hideFor: 'medium',

  /**
   * To decide if the toggle should be animated or not.
   * @option
   * @type {boolean}
   * @default false
   */
  animate: false
};

/**
 * Reveal module.
 * @module foundation.reveal
 * @requires foundation.util.keyboard
 * @requires foundation.util.touch
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.events
 * @requires foundation.util.dom
 * @requires foundation.util.motion if using animations
 */

// `$('.reveal:visible')` replacement (7.0 line A, S6): the compound
// pseudo-class has no native equivalent, so the scan runs through
// querySelectorAll and Dom's narrow visibility filter per element.
function countVisibleReveals() {
  let count = 0;
  document.querySelectorAll('.reveal').forEach(element => {
    if (visible(element)) { count++; }
  });
  return count;
}

// `$(document).height()` / `$(window).height()` equivalents. The max()
// formula is load-bearing: while `html.is-reveal-open` is applied (the
// stylesheet puts `position: fixed` on html), documentElement.scrollHeight
// collapses to the viewport, but body's scrollHeight still reflects the
// content - jQuery's formula kept seeing "page taller than viewport" and so
// kept the zf-has-scroll scrollbar class; a naive
// documentElement.scrollHeight comparison would drop it and re-introduce
// the scrollbar shift the class exists to prevent.
function documentHeight() {
  const body = document.body;
  const html = document.documentElement;
  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
}

function windowHeight() {
  return document.documentElement.clientHeight;
}

class Reveal extends Plugin {
  /**
   * Creates a new instance of Reveal.
   * @class
   * @name Reveal
   * @param {jQuery} element - jQuery object to use for the modal.
   * @param {Object} options - optional parameters.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Reveal.defaults, datasetOptions(this.$element), options);
    this.className = 'Reveal'; // ie9 back compat
    this._init();

    // Touch and Triggers init are idempotent, just need to make sure they are initialized
    Touch.init();
    Triggers.init();

    Keyboard.register('Reveal', {
      'ESCAPE': 'close',
    });
  }

  /**
   * Initializes the modal by adding the overlay and close buttons, (if selected).
   * @private
   */
  _init() {
    MediaQuery._init();
    this.id = this.$element.id;
    this.isActive = false;
    this.cached = {mq: MediaQuery.current};

    var openAnchors = Array.from(document.querySelectorAll(`[data-open="${this.id}"]`));
    this.$anchor = openAnchors.length ? openAnchors : Array.from(document.querySelectorAll(`[data-toggle="${this.id}"]`));
    this.$anchor.forEach(function(anchor) {
      anchor.setAttribute('aria-controls', this.id);
      anchor.setAttribute('aria-haspopup', 'dialog');
      anchor.setAttribute('tabindex', '0');
    }, this);

    if (this.options.fullScreen || this.$element.classList.contains('full')) {
      this.options.fullScreen = true;
      this.options.overlay = false;
    }
    if (this.options.overlay && !this.$overlay) {
      this.$overlay = this._makeOverlay(this.id);
    }

    this.$element.setAttribute('role', 'dialog');
    this.$element.setAttribute('aria-hidden', 'true');
    this.$element.setAttribute('data-yeti-box', this.id);
    this.$element.setAttribute('data-resize', this.id);

    if(this.$overlay) {
      // appendChild moves the element - the same net effect as the former
      // detach().appendTo() jQuery dance.
      this.$overlay.appendChild(this.$element);
    } else {
      document.querySelector(this.options.appendTo).appendChild(this.$element);
      this.$element.classList.add('without-overlay');
    }
    this._events();
    if (this.options.deepLink && window.location.hash === ( `#${this.id}`)) {
      this.onLoadListener = onLoad(window, () => this.open());
    }
  }

  /**
   * Creates an overlay div to display behind the modal.
   * The element is created and appended natively (7.0 line A, S6); it is
   * stored as a jQuery collection because the public `plugin.$overlay`
   * surface stays jQuery in the mixed state.
   * @private
   */
  _makeOverlay() {
    var additionalOverlayClasses = '';

    if (this.options.additionalOverlayClasses) {
      additionalOverlayClasses = ' ' + this.options.additionalOverlayClasses;
    }

    const overlay = document.createElement('div');
    overlay.className = 'reveal-overlay' + additionalOverlayClasses;
    document.querySelector(this.options.appendTo).appendChild(overlay);
    // terminal form: the element (the mixed state wrapped it)
    return overlay;
  }

  /**
   * Native stand-in for jQuery's `.show()`: clears an inline display
   * override and, when the stylesheet still hides the element (`.reveal`
   * and `.reveal-overlay` ship `display: none`), falls back to the default
   * display of a block element - what jQuery's getDefaultDisplay resolved
   * to for everything this plugin shows.
   * @private
   */
  _show(element) {
    element.style.display = '';
    if (window.getComputedStyle(element).display === 'none') {
      element.style.display = 'block';
    }
  }

  /**
   * Updates position of modal
   * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
   * @private
   */
  _updatePosition() {
    // outerWidth/Height(): the rect dimension (border-box, no margin);
    // $(window).width(): the viewport
    var width = this.$element.offsetWidth;
    var outerWidth = window.innerWidth;
    var height = this.$element.offsetHeight;
    var outerHeight = window.innerHeight;
    var left, top = null;
    if (this.options.hOffset === 'auto') {
      left = parseInt((outerWidth - width) / 2, 10);
    } else {
      left = parseInt(this.options.hOffset, 10);
    }
    if (this.options.vOffset === 'auto') {
      if (height > outerHeight) {
        top = parseInt(Math.min(100, outerHeight / 10), 10);
      } else {
        top = parseInt((outerHeight - height) / 4, 10);
      }
    } else if (this.options.vOffset !== null) {
      top = parseInt(this.options.vOffset, 10);
    }

    if (top !== null) {
      this.$element.style.top = top + 'px';
    }

    // only worry about left if we don't have an overlay or we have a horizontal offset,
    // otherwise we're perfectly in the middle
    if (!this.$overlay || (this.options.hOffset !== 'auto')) {
      this.$element.style.left = left + 'px';
      this.$element.style.margin = '0px';
    }

  }

  /**
   * Adds event handlers for the modal.
   * @private
   */
  _events() {
    var _this = this;
    const element = this.$element;

    // S4/S6: the Triggers util produces open/toggle.zf.trigger as element-
    // local dual dispatches and close.zf.trigger as a real bubbling event;
    // this consumer listens on the native side of that seam.
    Events.on(element, 'open.zf.trigger', this.open.bind(this));
    Events.on(element, 'close.zf.trigger', (event, $element) => {
      if ((event.target === _this.$element) ||
          ($(event.target).parents('[data-closable]')[0] === $element)) { // only close reveal when it's explicitly called
        return this.close.apply(this);
      }
    });
    Events.on(element, 'toggle.zf.trigger', this.toggle.bind(this));
    Events.on(element, 'resizeme.zf.trigger', function() {
      _this._updatePosition();
    });

    if (this.options.closeOnClick && this.options.overlay) {
      const closeOnOverlayEvent = function(e) {
        if (e.target === _this.$element ||
          _this.$element.contains(e.target) ||
            !document.contains(e.target)) {
              return;
        }
        _this.close();
      };
      // The M1-fixed off-then-on order is kept: one handler pair per
      // overlay, rebound cleanly on re-init. The click and tap halves both
      // live on the native event layer now (S13): 'tap' is a real, bubbling
      // event on the touched element.
      Events.off(this.$overlay, '.zf.reveal');
      Events.on(this.$overlay, 'click.zf.reveal tap.zf.reveal', closeOnOverlayEvent);
    }
    if (this.options.deepLink) {
      Events.on(window, `hashchange.zf.reveal:${this.id}`, this._handleState.bind(this));
    }
  }

  /**
   * Handles modal methods on back/forward button clicks or any other event that triggers hashchange.
   * @private
   */
  _handleState() {
    if(window.location.hash === ( '#' + this.id) && !this.isActive){ this.open(); }
    else { this.close(); }
  }

  /**
  * Disables the scroll when Reveal is shown to prevent the background from shifting
  * @param {number} scrollTop - Scroll to visually apply, window current scroll by default
  */
  _disableScroll(scrollTop) {
    scrollTop = scrollTop || window.scrollY;
    if (documentHeight() > windowHeight()) {
      // The px unit is explicit on purpose: a bare number assigned to a
      // native style property is silently dropped (jQuery appended it).
      document.documentElement.style.top = `${-scrollTop}px`;
    }
  }

  /**
  * Reenables the scroll when Reveal closes
  * @param {number} scrollTop - Scroll to restore, html "top" property by default (as set by `_disableScroll`)
  */
  _enableScroll(scrollTop) {
    scrollTop = scrollTop || parseInt(document.documentElement.style.top, 10);
    if (documentHeight() > windowHeight()) {
      document.documentElement.style.top = "";
      window.scrollTo(0, -scrollTop);
    }
  }


  /**
   * Opens the modal controlled by `this.$anchor`, and closes all others by default.
   * @function
   * @fires Reveal#closeme
   * @fires Reveal#open
   */
  open() {
    // either update or replace browser history
    const hash = `#${this.id}`;
    if (this.options.deepLink && window.location.hash !== hash) {

      if (window.history.pushState) {
        if (this.options.updateHistory) {
          window.history.pushState({}, '', hash);
        } else {
          window.history.replaceState({}, '', hash);
        }
      } else {
        window.location.hash = hash;
      }
    }

    // Remember anchor that opened it to set focus back later, have general anchors as fallback
    this.$activeAnchor = this.$anchor.indexOf(document.activeElement) > -1 ? document.activeElement : this.$anchor[0];

    this.isActive = true;

    // Make elements invisible, but remove display: none so we can get size and positioning
    this.$element.style.visibility = 'hidden';
    this._show(this.$element);
    this.$element.scrollTop = 0;
    if (this.options.overlay) {
      this.$overlay.style.visibility = 'hidden';
      this._show(this.$overlay);
    }

    this._updatePosition();

    this.$element.style.display = 'none';
    this.$element.style.visibility = '';

    if(this.$overlay) {
      this.$overlay.style.visibility = '';
      this.$overlay.style.display = 'none';
      if(this.$element.classList.contains('fast')) {
        this.$overlay.classList.add('fast');
      } else if (this.$element.classList.contains('slow')) {
        this.$overlay.classList.add('slow');
      }
    }


    if (!this.options.multipleOpened) {
      /**
       * Fires immediately before the modal opens.
       * Closes any other modals that are currently open
       * @event Reveal#closeme
       */
      // S13: the closeme production flipped with the Triggers listener -
      // a real, bubbling event whose detail carries the plugin id (the 6.x
      // second trigger parameter) and whose listener is registered per
      // plugin name.
      Events.trigger(this.$element, 'closeme.zf.reveal', [this.id]);
    }

    if (countVisibleReveals() === 0) {
      this._disableScroll();
    }

    var _this = this;

    // Motion UI method of reveal
    if (this.options.animationIn) {
      function afterAnimation(){
        _this.$element.setAttribute('aria-hidden', 'false');
        _this.$element.setAttribute('tabindex', '-1');
        _this.$element.focus();
        _this._addGlobalClasses();
        Keyboard.trapFocus(_this.$element);
      }
      if (this.options.overlay) {
        Motion.animateIn(this.$overlay, 'fade-in');
      }
      Motion.animateIn(this.$element, this.options.animationIn, () => {
        if(this.$element) { // protect against object having been removed
          this.focusableElements = Keyboard.findFocusable(this.$element);
          afterAnimation();
        }
      });
    }
    // Native method of reveal
    else {
      // S6: display is applied synchronously, exactly where jQuery's
      // `.show(duration)` restored it. The legacy fx tween (a size/opacity
      // "grow" that ran for non-zero showDelay values) is dropped - the
      // display and event contracts never depended on it, and the option
      // never delayed the display flip in the first place.
      if (this.options.overlay) {
        this._show(this.$overlay);
      }
      this._show(this.$element);
    }

    // handle accessibility
    this.$element.setAttribute('aria-hidden', 'false');
    this.$element.setAttribute('tabindex', '-1');
    this.$element.focus();
    Keyboard.trapFocus(this.$element);

    this._addGlobalClasses();

    this._addGlobalListeners();

    /**
     * Fires when the modal has successfully opened.
     * @event Reveal#open
     */
    Events.trigger(this.$element, 'open.zf.reveal');
  }

  /**
   * Adds classes and listeners on document required by open modals.
   *
   * The following classes are added and updated:
   * - `.is-reveal-open` - Prevents the scroll on document
   * - `.zf-has-scroll`  - Displays a disabled scrollbar on document if required like if the
   *                       scroll was not disabled. This prevent a "shift" of the page content due
   *                       the scrollbar disappearing when the modal opens.
   *
   * @private
   */
  _addGlobalClasses() {
    const updateScrollbarClass = () => {
      document.documentElement.classList.toggle('zf-has-scroll', documentHeight() > windowHeight());
    };

    Events.on(this.$element, 'resizeme.zf.trigger.revealScrollbarListener', () => updateScrollbarClass());
    updateScrollbarClass();
    document.documentElement.classList.add('is-reveal-open');
  }

  /**
   * Removes classes and listeners on document that were required by open modals.
   * @private
   */
  _removeGlobalClasses() {
    Events.off(this.$element, 'resizeme.zf.trigger.revealScrollbarListener');
    document.documentElement.classList.remove('is-reveal-open');
    document.documentElement.classList.remove('zf-has-scroll');
  }

  /**
   * Adds extra event handlers for the body and window if necessary.
   * @private
   */
  _addGlobalListeners() {
    var _this = this;
    if(!this.$element) { return; } // If we're in the middle of cleanup, don't freak out
    this.focusableElements = Keyboard.findFocusable(this.$element);

    if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
      const closeOnBodyEvent = function(e) {
        if (e.target === _this.$element ||
          _this.$element.contains(e.target) ||
            !document.contains(e.target)) { return; }
        _this.close();
      };
      // Both halves on the native layer (S13): click since S6, tap with the
      // Touch util's real synthesized events.
      Events.on(document.body, 'click.zf.reveal tap.zf.reveal', closeOnBodyEvent);
    }

    if (this.options.closeOnEsc) {
      // 7.0 terminal form: the ESC keydown consumer runs on the native
      // event layer (every producer that reaches it dispatches real
      // KeyboardEvents since the S16 suite migration; window has no
      // .keydown() shortcut anyway, so there was never a bridge producer).
      Events.on(window, `keydown.zf.reveal:${this.id}`, function(e) {
        Keyboard.handleKey(e, 'Reveal', {
          close: function() {
            if (_this.options.closeOnEsc) {
              _this.close();
            }
          }
        });
      });
    }
  }

  /**
   * Closes the modal.
   * @function
   * @fires Reveal#closed
   */
  close() {
    if (!this.isActive || !visible(this.$element)) {
      return false;
    }
    var _this = this;

    // Motion UI method of hiding
    if (this.options.animationOut) {
      if (this.options.overlay) {
        Motion.animateOut(this.$overlay, 'fade-out');
      }

      Motion.animateOut(this.$element, this.options.animationOut, finishUp);
    }
    // Native method of hiding
    else {
      this.$element.style.display = 'none';

      if (this.options.overlay) {
        this.$overlay.style.display = 'none';
        // finishUp keeps its after-completion timing contract: 6.x ran it
        // from `.hide(0, finishUp)`, one macrotask after the call, and it
        // now runs once the (aligned) hideDelay has elapsed.
        setTimeout(finishUp, this.options.hideDelay);
      }
      else {
        finishUp();
      }
    }

    // Conditionals to remove extra event listeners added on open
    Events.off(window, `keydown.zf.reveal:${this.id}`);

    if (!this.options.overlay && this.options.closeOnClick) {
      Events.off(document.body, 'click.zf.reveal tap.zf.reveal');
    }

    Events.off(this.$element, 'keydown.zf.reveal');

    function finishUp() {
      // destroy() can land while the out-animation is still running (it
      // nulls every own property); the completion must then bail instead of
      // dereferencing the nulled $element (same guard shape as the Orbit
      // destroy fix, S14). 6.x never threw here only because its cleanup ran
      // on emptied jQuery collections.
      if (!_this.$element) { return; }

      // Get the current top before the modal is closed and restore the scroll after.
      // TODO: use component properties instead of HTML properties
      // See https://github.com/foundation/foundation-sites/pull/10786
      var scrollTop = parseInt(document.documentElement.style.top, 10);

      if (countVisibleReveals() === 0) {
        _this._removeGlobalClasses(); // also remove .is-reveal-open from the html element when there is no opened reveal
      }

      Keyboard.releaseFocus(_this.$element);

      _this.$element.setAttribute('aria-hidden', 'true');

      if (countVisibleReveals() === 0) {
        _this._enableScroll(scrollTop);
      }

      /**
      * Fires when the modal is done closing.
      * @event Reveal#closed
      */
      Events.trigger(_this.$element, 'closed.zf.reveal');
    }

    /**
    * Resets the modal content
    * This prevents a running video to keep going in the background
    */
    if (this.options.resetOnClose) {
      this.$element.html(this.$element.html());
    }

    this.isActive = false;
    // If deepLink and we did not switched to an other modal...
    if (_this.options.deepLink && window.location.hash === `#${this.id}`) {
      // Remove the history hash
      if (window.history.replaceState) {
        const urlWithoutHash = window.location.pathname + window.location.search;
        if (this.options.updateHistory) {
          window.history.pushState({}, '', urlWithoutHash); // remove the hash
        } else {
          window.history.replaceState('', document.title, urlWithoutHash);
        }
      } else {
        window.location.hash = '';
      }
    }

    // the empty-collection .focus() was a silent no-op in 6.x; minimal
    // fixtures have no anchors at all
    if (this.$activeAnchor) { this.$activeAnchor.focus(); }
  }

  /**
   * Toggles the open/closed state of a modal.
   * @function
   */
  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  };

  /**
   * Destroys an instance of a modal.
   * @function
   */
  _destroy() {
    if (this.options.overlay) {
      // move $element outside of $overlay to prevent error unregisterPlugin()
      document.querySelector(this.options.appendTo).appendChild(this.$element);
      this.$overlay.style.display = 'none';
      Events.off(this.$overlay);
      this.$overlay.remove();
    }
    this.$element.style.display = 'none';
    Events.off(this.$element);
    this.$anchor.forEach(function(anchor) {
      Events.off(anchor, '.zf');
    });
    Events.off(window, `.zf.reveal:${this.id}`);
    if (this.onLoadListener) Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer

    if (countVisibleReveals() === 0) {
      this._removeGlobalClasses(); // also remove .is-reveal-open from the html element when there is no opened reveal
    }
  };
}

Reveal.defaults = {
  /**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @type {string}
   * @default ''
   */
  animationIn: '',
  /**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @type {string}
   * @default ''
   */
  animationOut: '',
  /**
   * Time, in ms, to delay the opening of a modal after a click if no animation used.
   * @option
   * @type {number}
   * @default 0
   */
  showDelay: 0,
  /**
   * Time, in ms, to delay the closing of a modal after a click if no animation used.
   * @option
   * @type {number}
   * @default 0
   */
  hideDelay: 0,
  /**
   * Allows a click on the body/overlay to close the modal.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Allows the modal to close if the user presses the `ESCAPE` key.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnEsc: true,
  /**
   * If true, allows multiple modals to be displayed at once.
   * @option
   * @type {boolean}
   * @default false
   */
  multipleOpened: false,
  /**
   * Distance, in pixels, the modal should push down from the top of the screen.
   * @option
   * @type {number|string}
   * @default auto
   */
  vOffset: 'auto',
  /**
   * Distance, in pixels, the modal should push in from the side of the screen.
   * @option
   * @type {number|string}
   * @default auto
   */
  hOffset: 'auto',
  /**
   * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
   * @option
   * @type {boolean}
   * @default false
   */
  fullScreen: false,
  /**
   * Allows the modal to generate an overlay div, which will cover the view when modal opens.
   * @option
   * @type {boolean}
   * @default true
   */
  overlay: true,
  /**
   * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
   * @option
   * @type {boolean}
   * @default false
   */
  resetOnClose: false,
  /**
   * Link the location hash to the modal.
   * Set the location hash when the modal is opened/closed, and open/close the modal when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,
  /**
   * If `deepLink` is enabled, update the browser history with the open modal
   * @option
   * @default false
   */
  updateHistory: false,
    /**
   * Allows the modal to append to custom div.
   * @option
   * @type {string}
   * @default "body"
   */
  appendTo: "body",
  /**
   * Allows adding additional class names to the reveal overlay.
   * @option
   * @type {string}
   * @default ''
   */
  additionalOverlayClasses: ''
};

/**
 * Slider module.
 * @module foundation.slider
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.keyboard
 * @requires foundation.util.touch
 */

class Slider extends Plugin {
  /**
   * Creates a new instance of a slider control.
   * @class
   * @name Slider
   * @param {jQuery} element - jQuery object to make into a slider control.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Slider.defaults, datasetOptions(this.$element), options);
    this.className = 'Slider'; // ie9 back compat
    this.initialized = false;

  // Touch and Triggers inits are idempotent, we just need to make sure it's initialied.
    Touch.init();
    Triggers.init();

    this._init();

    Keyboard.register('Slider', {
      'ltr': {
        'ARROW_RIGHT': 'increase',
        'ARROW_UP': 'increase',
        'ARROW_DOWN': 'decrease',
        'ARROW_LEFT': 'decrease',
        'SHIFT_ARROW_RIGHT': 'increaseFast',
        'SHIFT_ARROW_UP': 'increaseFast',
        'SHIFT_ARROW_DOWN': 'decreaseFast',
        'SHIFT_ARROW_LEFT': 'decreaseFast',
        'HOME': 'min',
        'END': 'max'
      },
      'rtl': {
        'ARROW_LEFT': 'increase',
        'ARROW_RIGHT': 'decrease',
        'SHIFT_ARROW_LEFT': 'increaseFast',
        'SHIFT_ARROW_RIGHT': 'decreaseFast'
      }
    });
  }

  /**
   * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
   * @function
   * @private
   */
  _init() {
    this.inputs = Array.from(this.$element.querySelectorAll('input'));
    this.handles = Array.from(this.$element.querySelectorAll('[data-slider-handle]'));

    this.$handle = this.handles[0];
    this.$input = this.inputs.length ? this.inputs[0] : document.getElementById(this.$handle.getAttribute('aria-controls'));
    this.$fill = this.$element.querySelector('[data-slider-fill]');
    // Sliders without a fill element are valid markup (the 6.x empty
    // collection made every fill write a no-op; null keeps that contract).
    if (this.$fill) {
      this.$fill.style[this.options.vertical ? 'height' : 'width'] = '0';
    }

    // State attributes and classes go through the native layer (7.0 line A, S10).
    if (this.options.disabled || this.$element.classList.contains(this.options.disabledClass)) {
      this.options.disabled = true;
      this.$element.classList.add(this.options.disabledClass);
    }
    if (!this.inputs.length) {
      this.inputs = [this.$input];
      this.options.binding = true;
    }

    this._setInitAttr(0);

    if (this.handles[1]) {
      this.options.doubleSided = true;
      this.$handle2 = this.handles[1];
      this.$input2 = this.inputs.length > 1 ? this.inputs[1] : document.getElementById(this.$handle2.getAttribute('aria-controls'));

      if (!this.inputs[1]) {
        this.inputs.push(this.$input2);
      }

      // this.$handle.triggerHandler('click.zf.slider');
      this._setInitAttr(1);
    }

    // Set handle positions
    this.setHandles();

    this._events();
    this.initialized = true;
  }

  setHandles() {
    if(this.handles[1]) {
      this._setHandlePos(this.$handle, this.inputs[0].value, () => {
        this._setHandlePos(this.$handle2, this.inputs[1].value);
      });
    } else {
      this._setHandlePos(this.$handle, this.inputs[0].value);
    }
  }

  _reflow() {
    this.setHandles();
  }
  /**
  * @function
  * @private
  * @param {Number} value - floating point (the value) to be transformed using to a relative position on the slider (the inverse of _value)
  */
  _pctOfBar(value) {
    var pctOfBar = percent(value - this.options.start, this.options.end - this.options.start);

    switch(this.options.positionValueFunction) {
    case "pow":
      pctOfBar = this._logTransform(pctOfBar);
      break;
    case "log":
      pctOfBar = this._powTransform(pctOfBar);
      break;
    }

    return pctOfBar.toFixed(2)
  }

  /**
  * @function
  * @private
  * @param {Number} pctOfBar - floating point, the relative position of the slider (typically between 0-1) to be transformed to a value
  */
  _value(pctOfBar) {
    switch(this.options.positionValueFunction) {
    case "pow":
      pctOfBar = this._powTransform(pctOfBar);
      break;
    case "log":
      pctOfBar = this._logTransform(pctOfBar);
      break;
    }

    var value;
    if (this.options.vertical) {
      // linear interpolation which is working with negative values for start
      // https://math.stackexchange.com/a/1019084
      value = parseFloat(this.options.end) + pctOfBar * (this.options.start - this.options.end);
    } else {
      value = (this.options.end - this.options.start) * pctOfBar + parseFloat(this.options.start);
    }

    return value
  }

  /**
  * @function
  * @private
  * @param {Number} value - floating point (typically between 0-1) to be transformed using the log function
  */
  _logTransform(value) {
    return baseLog(this.options.nonLinearBase, ((value*(this.options.nonLinearBase-1))+1))
  }

  /**
  * @function
  * @private
  * @param {Number} value - floating point (typically between 0-1) to be transformed using the power function
  */
  _powTransform(value) {
    return (Math.pow(this.options.nonLinearBase, value) - 1) / (this.options.nonLinearBase - 1)
  }

  /**
   * Sets the position of the selected handle and fill bar.
   * @function
   * @private
   * @param {jQuery} $hndl - the selected handle to move.
   * @param {Number} location - floating point between the start and end values of the slider bar.
   * @param {Function} cb - callback function to fire on completion.
   * @fires Slider#moved
   * @fires Slider#changed
   */
  _setHandlePos(hndl, location, cb) {
    hndl = hndl && hndl.nodeType === 1 ? hndl : (hndl ? hndl[0] : hndl);
    // don't move if the slider has been disabled since its initialization
    if (this.$element.classList.contains(this.options.disabledClass)) {
      return;
    }
    //might need to alter that slightly for bars that will have odd number selections.
    location = parseFloat(location);//on input change events, convert string to number...grumble.

    // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
    if (location < this.options.start) { location = this.options.start; }
    else if (location > this.options.end) { location = this.options.end; }

    var isDbl = this.options.doubleSided;

    if (isDbl) { //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
      if (this.handles.indexOf(hndl) === 0) {
        var h2Val = parseFloat(this.$handle2.getAttribute('aria-valuenow'));
        location = location >= h2Val ? h2Val - this.options.step : location;
      } else {
        var h1Val = parseFloat(this.$handle.getAttribute('aria-valuenow'));
        location = location <= h1Val ? h1Val + this.options.step : location;
      }
    }

    var _this = this,
        vert = this.options.vertical,
        hOrW = vert ? 'height' : 'width',
        lOrT = vert ? 'top' : 'left',
        handleDim = hndl.getBoundingClientRect()[hOrW],
        elemDim = this.$element.getBoundingClientRect()[hOrW],
        //percentage of bar min/max value based on click or drag point
        pctOfBar = this._pctOfBar(location),
        //number of actual pixels to shift the handle, based on the percentage obtained above
        pxToMove = (elemDim - handleDim) * pctOfBar,
        //percentage of bar to shift the handle
        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
        //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
        location = parseFloat(location.toFixed(this.options.decimal));
        // declare empty object for css adjustments, only used with 2 handled-sliders
    var css = {};

    this._setValues(hndl, location);

    // TODO update to calculate based on values set to respective inputs??
    if (isDbl) {
      var isLeftHndl = this.handles.indexOf(hndl) === 0,
          //empty variable, will be used for min-height/width for fill bar
          dim,
          //percentage w/h of the handle compared to the slider bar
          handlePct =  Math.floor(percent(handleDim, elemDim) * 100);
      //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
      if (isLeftHndl) {
        //left or top percentage value to apply to the fill bar.
        css[lOrT] = `${movement}%`;
        //calculate the new min-height/width for the fill bar.
        dim = parseFloat(this.$handle2.style[lOrT]) - movement + handlePct;
        //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
        //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
        if (cb && typeof cb === 'function') { cb(); }//this is only needed for the initialization of 2 handled sliders
      } else {
        //just caching the value of the left/bottom handle's left/top property
        var handlePos = parseFloat(this.$handle.style[lOrT]);
        //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
        //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
        dim = movement - (isNaN(handlePos) ? (this.options.initialStart - this.options.start)/((this.options.end-this.options.start)/100) : handlePos) + handlePct;
      }
      // assign the min-height/width to our css object
      css[`min-${hOrW}`] = `${dim}%`;
    }

    //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
    // the dragging flag rode jQuery's data cache (DOM-invisible); the
    // expando property keeps it invisible
    var moveTime = this.$element.zfSliderDragging ? 1000/60 : this.options.moveTime;

    Move(moveTime, hndl, function() {
      // A Move chain can complete after the slider was destroyed (the
      // completion runs off a requestAnimationFrame) and options are gone.
      if (!_this.options) { return; }
      // adjusting the left/top property of the handle, based on the percentage calculated above
      // if movement isNaN, that is because the slider is hidden and we cannot determine handle width,
      // fall back to next best guess.
      if (isNaN(movement)) {
        hndl.style[lOrT] = `${pctOfBar * 100}%`;
      }
      else {
        hndl.style[lOrT] = `${movement}%`;
      }

      if (!_this.options.doubleSided) {
        //if single-handled, a simple method to expand the fill bar
        if (_this.$fill) { _this.$fill.style[hOrW] = `${pctOfBar * 100}%`; }
      } else {
        //otherwise, use the css object we created above
        if (_this.$fill) {
          Object.keys(css).forEach(function(prop) {
            _this.$fill.style[prop] = css[prop];
          });
        }
      }
    });

    if (this.initialized) {
      // S10: the finished.zf.animate consumer flips to the native event
      // layer; the producer (Motion) has dispatched one real bubbling event
      // per Move since S5, so this seam closes on the consumer half alone.
      Events.one(this.$element, 'finished.zf.animate', function() {
        // the chain can fire after destroy() (see the Move callback above)
        if (!_this.$element) { return; }
        /**
         * Fires when the handle is done moving.
         * @event Slider#moved
         */
        // Terminal form: real bubbling event, the plain handle element.
        Events.trigger(_this.$element, 'moved.zf.slider', [hndl]);
      });
      /**
       * Fires when the value has not been change for a given time.
       * @event Slider#changed
       */
      clearTimeout(_this.timeout);
      _this.timeout = setTimeout(function(){
        Events.trigger(_this.$element, 'changed.zf.slider', [hndl]);
      }, _this.options.changedDelay);
    }
  }

  /**
   * Sets the initial attribute for the slider element.
   * @function
   * @private
   * @param {Number} idx - index of the current handle/input to use.
   */
  _setInitAttr(idx) {
    var initVal = (idx === 0 ? this.options.initialStart : this.options.initialEnd);
    var id = this.inputs[idx].getAttribute('id') || GetYoDigits(6, 'slider');
    // State attributes go through the native layer (7.0 line A, S10).
    var input = this.inputs[idx];
    input.setAttribute('id', id);
    input.setAttribute('max', this.options.end);
    input.setAttribute('min', this.options.start);
    input.setAttribute('step', this.options.step);
    input.value = initVal;
    var handle = this.handles[idx];
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-controls', id);
    handle.setAttribute('aria-valuemax', this.options.end);
    handle.setAttribute('aria-valuemin', this.options.start);
    handle.setAttribute('aria-valuenow', initVal);
    handle.setAttribute('aria-orientation', this.options.vertical ? 'vertical' : 'horizontal');
    handle.setAttribute('tabindex', 0);
  }

  /**
   * Sets the input and `aria-valuenow` values for the slider element.
   * @function
   * @private
   * @param {jQuery} $handle - the currently selected handle.
   * @param {Number} val - floating point of the new value.
   */
  _setValues(handle, val) {
    handle = handle.nodeType === 1 ? handle : handle[0];
    var idx = this.options.doubleSided ? this.handles.indexOf(handle) : 0;
    this.inputs[idx].value = val;
    // State attributes go through the native layer (7.0 line A, S10).
    handle.setAttribute('aria-valuenow', val);
  }

  /**
   * Handles events on the slider element.
   * Calculates the new location of the current handle.
   * If there are two handles and the bar was clicked, it determines which handle to move.
   * @function
   * @private
   * @param {Object} e - the `event` object passed from the listener.
   * @param {jQuery} $handle - the current handle to calculate for, if selected.
   * @param {Number} val - floating point number for the new value of the slider.
   * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
   */
  _handleEvent(e, handle, val) {
    var value;
    if (!val) {//click or drag events
      e.preventDefault();
      var _this = this,
          vertical = this.options.vertical,
          param = vertical ? 'height' : 'width',
          direction = vertical ? 'top' : 'left',
          eventOffset = vertical ? e.pageY : e.pageX,
          barDim = this.$element.getBoundingClientRect()[param],
          windowScroll = vertical ? window.pageYOffset : window.pageXOffset;

      // jQuery offset(): the document-coordinates edge
      var elemOffset = this.$element.getBoundingClientRect()[direction] + (vertical ? window.pageYOffset : window.pageXOffset);

      // touch events emulated by the touch util give position relative to screen, add window.scroll to event coordinates...
      // best way to guess this is simulated is if clientY == pageY
      if (e.clientY === e.pageY) { eventOffset = eventOffset + windowScroll; }
      var eventFromBar = eventOffset - elemOffset;
      var barXY;
      if (eventFromBar < 0) {
        barXY = 0;
      } else if (eventFromBar > barDim) {
        barXY = barDim;
      } else {
        barXY = eventFromBar;
      }
      var offsetPct = percent(barXY, barDim);

      value = this._value(offsetPct);

      // turn everything around for RTL, yay math!
      if (rtl() && !this.options.vertical) {value = this.options.end - value;}

      value = _this._adjustValue(null, value);

      if (!handle) {//figure out which handle it is, pass it to the next function.
        var firstHndlPos = absPosition(this.$handle, direction, barXY),
            secndHndlPos = absPosition(this.$handle2, direction, barXY);
            handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
      }

    } else {//change event on input
      value = this._adjustValue(null, val);
    }

    this._setHandlePos(handle, value);
  }

  /**
   * Adjustes value for handle in regard to step value. returns adjusted value
   * @function
   * @private
   * @param {jQuery} $handle - the selected handle.
   * @param {Number} value - value to adjust. used if $handle is falsy
   */
  _adjustValue($handle, value) {
    var val,
      step = this.options.step,
      div = parseFloat(step/2),
      left, previousVal, nextVal;
    if (!!$handle) {
      val = parseFloat($handle.getAttribute('aria-valuenow'));
    }
    else {
      val = value;
    }
    if (val >= 0) {
      left = val % step;
    } else {
      left = step + (val % step);
    }
    previousVal = val - left;
    nextVal = previousVal + step;
    if (left === 0) {
      return val;
    }
    val = val >= previousVal + div ? nextVal : previousVal;
    return val;
  }

  /**
   * Adds event listeners to the slider elements.
   * @function
   * @private
   */
  _events() {
    this._eventsForHandle(this.$handle);
    if(this.handles[1]) {
      this._eventsForHandle(this.$handle2);
    }
  }


  /**
   * Adds event listeners a particular handle
   * @function
   * @private
   * @param {jQuery} $handle - the current handle to apply listeners to.
   */
  _eventsForHandle(handle) {
    var _this = this,
        curHandle;

      const handleChangeEvent = function(e) {
        const idx = _this.inputs.indexOf(this);
        _this._handleEvent(e, _this.handles[idx], this.value);
      };

      // IE only triggers the change event when the input loses focus which strictly follows the HTML specification
      // listen for the enter key and trigger a change
      // @see https://html.spec.whatwg.org/multipage/input.html#common-input-element-events
      // S10: the input keyup/change consumers flip to the native event
      // layer - their producers are real browser events, which reach native
      // listeners directly. `this` is the input element, and the listeners
      // are re-registered on every element of the collection like jQuery's
      // collection-wide .on() did.
      this.inputs.forEach(input => {
        Events.off(input, 'keyup.zf.slider change.zf.slider');
        Events.on(input, 'keyup.zf.slider', function (e) {
          if(e.keyCode === 13) handleChangeEvent.call(this, e);
        });
        Events.on(input, 'change.zf.slider', handleChangeEvent);
      });

      if (this.options.clickSelect) {
        // S10: the bar-click consumer flips to the native event layer -
        // real clicks arrive directly and jQuery-synthesized clicks on the
        // container ride the `.click()` shortcut bridge (reveal-native
        // precedent).
        Events.off(this.$element, 'click.zf.slider');
        Events.on(this.$element, 'click.zf.slider', function(e) {
          if (_this.$element.zfSliderDragging) { return false; }

          if (!e.target.matches('[data-slider-handle]')) {
            if (_this.options.doubleSided) {
              _this._handleEvent(e);
            } else {
              _this._handleEvent(e, _this.$handle);
            }
          }
        });
      }

    if (this.options.draggable) {
      // S13: the drag chain flips with the Touch util - addTouch feeds real
      // synthesized mouse events now, so the mousedown/mousemove/mouseup
      // listeners live on the native event layer and serve the mouse and
      // the touch feed alike.
      this.handles.forEach(handleEl => Touch.addTouch(handleEl));

      var handleEl = handle.nodeType === 1 ? handle : handle[0];
      Events.off(handleEl, 'mousedown.zf.slider selectstart.zf.slider touchmove.zf.slider');
      Events.on(handleEl, 'mousedown.zf.slider', function(e) {
        handleEl.classList.add('is-dragging');
        if (_this.$fill) { _this.$fill.classList.add('is-dragging'); }
        _this.$element.zfSliderDragging = true;

        curHandle = e.currentTarget;

        Events.on(document.body, 'mousemove.zf.slider', function(ev) {
          ev.preventDefault();
          _this._handleEvent(ev, curHandle);
        });
        Events.on(document.body, 'mouseup.zf.slider', function(ev) {
          _this._handleEvent(ev, curHandle);

          handleEl.classList.remove('is-dragging');
          if (_this.$fill) { _this.$fill.classList.remove('is-dragging'); }
          _this.$element.zfSliderDragging = false;

          Events.off(document.body, 'mousemove.zf.slider mouseup.zf.slider');
        });
      });
      // prevent events triggered by touch
      Events.on(handleEl, 'selectstart.zf.slider touchmove.zf.slider', function(e) {
        e.preventDefault();
      });
    }

    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    var keydownEl = handle.nodeType === 1 ? handle : handle[0];
    Events.off(keydownEl, 'keydown.zf.slider');
    Events.on(keydownEl, 'keydown.zf.slider', function(e) {
      var _$handle = this,
          oldValue = parseFloat(keydownEl.getAttribute('aria-valuenow')),
          newValue;

      // handle keyboard event with keyboard util
      Keyboard.handleKey(e, 'Slider', {
        decrease: function() {
          newValue = oldValue - _this.options.step;
        },
        increase: function() {
          newValue = oldValue + _this.options.step;
        },
        decreaseFast: function() {
          newValue = oldValue - _this.options.step * 10;
        },
        increaseFast: function() {
          newValue = oldValue + _this.options.step * 10;
        },
        min: function() {
          newValue = _this.options.start;
        },
        max: function() {
          newValue = _this.options.end;
        },
        handled: function() { // only set handle pos when event was handled specially
          e.preventDefault();
          _this._setHandlePos(_$handle, newValue);
        }
      });
      /*if (newValue) { // if pressed key has special function, update value
        e.preventDefault();
        _this._setHandlePos(_$handle, newValue);
      }*/
    });
  }

  /**
   * Destroys the slider plugin.
   */
  _destroy() {
    // Every plugin-namespaced listener drops in one pass each (the input,
    // click, drag and keydown listeners all live on the native layer now),
    // plus any body-wide drag pair left mid-drag.
    this.inputs.forEach(input => Events.off(input, '.zf.slider'));
    this.handles.forEach(handle => Events.off(handle, '.zf.slider'));
    Events.off(document.body, 'mousemove.zf.slider mouseup.zf.slider');
    Events.off(this.$element, '.zf.slider');

    clearTimeout(this.timeout);
  }
}

Slider.defaults = {
  /**
   * Minimum value for the slider scale.
   * @option
   * @type {number}
   * @default 0
   */
  start: 0,
  /**
   * Maximum value for the slider scale.
   * @option
   * @type {number}
   * @default 100
   */
  end: 100,
  /**
   * Minimum value change per change event.
   * @option
   * @type {number}
   * @default 1
   */
  step: 1,
  /**
   * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
   * @option
   * @type {number}
   * @default 0
   */
  initialStart: 0,
  /**
   * Value at which the right handle/second input should be set to on initialization.
   * @option
   * @type {number}
   * @default 100
   */
  initialEnd: 100,
  /**
   * Allows the input to be located outside the container and visible. Set to by the JS
   * @option
   * @type {boolean}
   * @default false
   */
  binding: false,
  /**
   * Allows the user to click/tap on the slider bar to select a value.
   * @option
   * @type {boolean}
   * @default true
   */
  clickSelect: true,
  /**
   * Set to true and use the `vertical` class to change alignment to vertical.
   * @option
   * @type {boolean}
   * @default false
   */
  vertical: false,
  /**
   * Allows the user to drag the slider handle(s) to select a value.
   * @option
   * @type {boolean}
   * @default true
   */
  draggable: true,
  /**
   * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
   * @option
   * @type {boolean}
   * @default false
   */
  disabled: false,
  /**
   * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
   * @option
   * @type {boolean}
   * @default false
   */
  doubleSided: false,
  /**
   * Potential future feature.
   */
  // steps: 100,
  /**
   * Number of decimal places the plugin should go to for floating point precision.
   * @option
   * @type {number}
   * @default 2
   */
  decimal: 2,
  /**
   * Time delay for dragged elements.
   */
  // dragDelay: 0,
  /**
   * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
   * @option
   * @type {number}
   * @default 200
   */
  moveTime: 200,//update this if changing the transition time in the sass
  /**
   * Class applied to disabled sliders.
   * @option
   * @type {string}
   * @default 'disabled'
   */
  disabledClass: 'disabled',
  /**
   * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
   * @option
   * @type {boolean}
   * @default false
   */
  invertVertical: false,
  /**
   * Milliseconds before the `changed.zf-slider` event is triggered after value change.
   * @option
   * @type {number}
   * @default 500
   */
  changedDelay: 500,
  /**
  * Basevalue for non-linear sliders
  * @option
  * @type {number}
  * @default 5
  */
  nonLinearBase: 5,
  /**
  * Basevalue for non-linear sliders, possible values are: `'linear'`, `'pow'` & `'log'`. Pow and Log use the nonLinearBase setting.
  * @option
  * @type {string}
  * @default 'linear'
  */
  positionValueFunction: 'linear',
};

function percent(frac, num) {
  return (frac / num);
}
function absPosition(handle, dir, clickPos, param) {
  // jQuery position(): the offsetParent-relative position; the sliders are
  // absolutely positioned inside the (relative) slider element, so the
  // offsetParent chain bottoms out there - rect-difference form.
  var parentRect = handle.offsetParent ? handle.offsetParent.getBoundingClientRect() : {top: 0, left: 0};
  var handleRect = handle.getBoundingClientRect();
  var pos = dir === 'top' ? handleRect.top - parentRect.top : handleRect.left - parentRect.left;
  // $handle[param](): the outer height/width (rect dimension, border-box)
  var dim = dir === 'top' ? handleRect.height : handleRect.width;
  return Math.abs((pos + (dim / 2)) - clickPos);
}
function baseLog(base, value) {
  return Math.log(value)/Math.log(base)
}

/**
 * Sticky module.
 * @module foundation.sticky
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

class Sticky extends Plugin {
  /**
   * Creates a new instance of a sticky thing.
   * @class
   * @name Sticky
   * @param {jQuery} element - jQuery object to make sticky.
   * @param {Object} options - options object passed when creating the element programmatically.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Sticky.defaults, datasetOptions(this.$element), options);
    this.className = 'Sticky'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
  }

  /**
   * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();

    var parentContainer = (this.$element.parentElement && this.$element.parentElement.matches('[data-sticky-container]')) ? this.$element.parentElement : null,
        id = this.$element.id || GetYoDigits(6, 'sticky'),
        _this = this;

    if(parentContainer){
      this.$container = parentContainer;
    } else {
      this.wasWrapped = true;
      // .wrap(htmlString): a container built from the option markup
      var probe = document.createElement('template');
      probe.innerHTML = this.options.container.trim();
      var wrapper = probe.content.firstElementChild;
      this.$element.parentElement.insertBefore(wrapper, this.$element);
      wrapper.appendChild(this.$element);
      this.$container = this.$element.parentElement;
    }
    this.$container.classList.add(this.options.containerClass);

    // State attributes go through the native layer (7.0 line A, S10).
    this.$element.classList.add(this.options.stickyClass);
    this.$element.setAttribute('data-resize', id);
    this.$element.setAttribute('data-mutate', id);
    if (this.options.anchor !== '') {
        var anchorInit = document.getElementById(_this.options.anchor);
        if (anchorInit) { anchorInit.setAttribute('data-mutate', id); }
    }

    this.scrollCount = this.options.checkEvery;
    this.isStuck = false;
    this.onLoadListener = onLoad(window, function () {
      // A load callback can land after destroy() nulled the instance state
      // (Magellan S7 precedent).
      if (!_this.$element) { return; }

      //We calculate the container height to have correct values for anchor points offset calculation.
      _this.containerHeight = window.getComputedStyle(_this.$element).display === "none" ? 0 : _this.$element.getBoundingClientRect().height;
      _this.$container.style.height = _this.containerHeight + 'px';
      _this.elemHeight = _this.containerHeight;
      if (_this.options.anchor !== '') {
        _this.$anchor = document.getElementById(_this.options.anchor);
      } else {
        _this._parsePoints();
      }

      _this._setSizes(function () {
        var scroll = window.pageYOffset;
        _this._calc(false, scroll);
        //Unstick the element will ensure that proper classes are set.
        if (!_this.isStuck) {
          _this._removeSticky((scroll >= _this.topPoint) ? false : true);
        }
      });
      _this._events(id.split('-').reverse().join('-'));
    });
  }

  /**
   * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
   * @function
   * @private
   */
  _parsePoints() {
    var top = this.options.topAnchor === "" ? 1 : this.options.topAnchor,
        btm = this.options.btmAnchor === "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
        pts = [top, btm],
        breaks = {};
    for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
      var pt;
      if (typeof pts[i] === 'number') {
        pt = pts[i];
      } else {
        var place = pts[i].split(':'),
            anchor = document.getElementById(place[0]);

        // offset().top equivalent (7.0 line A, S10): viewport-relative rect
        // plus the current scroll, the S7 SmoothScroll precedent.
        pt = anchor.getBoundingClientRect().top + window.pageYOffset;
        if (place[1] && place[1].toLowerCase() === 'bottom') {
          pt += anchor.getBoundingClientRect().height;
        }
      }
      breaks[i] = pt;
    }


    this.points = breaks;
    return;
  }

  /**
   * Adds event handlers for the scrolling element.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _events(id) {
    var _this = this,
        scrollListener = this.scrollListener = `scroll.zf.${id}`;
    if (this.isOn) { return; }
    if (this.canStick) {
      this.isOn = true;
      // S10: the window scroll consumer flips to the native event layer -
      // real scroll events reach it directly, under the per-instance
      // namespace so the destroy path can drop it precisely.
      Events.off(window, scrollListener);
      Events.on(window, scrollListener, function() {
        if (_this.scrollCount === 0) {
          _this.scrollCount = _this.options.checkEvery;
          _this._setSizes(function() {
            _this._calc(false, window.pageYOffset);
          });
        } else {
          _this.scrollCount--;
          _this._calc(false, window.pageYOffset);
        }
      });
    }

    // S10: the resizeme consumer flips to the native event layer (S4
    // producer), like Equalizer S8.
    Events.off(this.$element, 'resizeme.zf.trigger');
    Events.on(this.$element, 'resizeme.zf.trigger', function() {
        _this._eventsHandler(id);
    });

    // S10 group flip: the mutateme consumers (element and anchor) join the
    // native event layer together with the last jQuery-synthesized
    // producers (Tabs forward, ResponsiveToggle animated half), so every
    // listener receives each dispatch exactly once.
    Events.on(this.$element, 'mutateme.zf.trigger', function () {
        _this._eventsHandler(id);
    });

    if(this.$anchor) {
      Events.on(this.$anchor, 'mutateme.zf.trigger', function () {
          _this._eventsHandler(id);
      });
    }
  }

  /**
   * Handler for events.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _eventsHandler(id) {
       var _this = this,
        scrollListener = this.scrollListener = `scroll.zf.${id}`;

       _this._setSizes(function() {
       _this._calc(false);
       if (_this.canStick) {
         if (!_this.isOn) {
           _this._events(id);
         }
       } else if (_this.isOn) {
         _this._pauseListeners(scrollListener);
       }
     });
  }

  /**
   * Removes event handlers for scroll and change events on anchor.
   * @fires Sticky#pause
   * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
   */
  _pauseListeners(scrollListener) {
    this.isOn = false;
    Events.off(window, scrollListener);

    /**
     * Fires when the plugin is paused due to resize event shrinking the view.
     * @event Sticky#pause
     * @private
     */
     // S10: real, bubbling CustomEvent - native listeners receive it
     // directly, still-on-jQuery listeners through the real-event pass-
     // through (white absorption).
     Events.trigger(this.$element, 'pause.zf.sticky');
  }

  /**
   * Called on every `scroll` event and on `_init`
   * fires functions based on booleans and cached values
   * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
   * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
   */
  _calc(checkSizes, scroll) {
    if (checkSizes) { this._setSizes(); }

    if (!this.canStick) {
      if (this.isStuck) {
        this._removeSticky(true);
      }
      return false;
    }

    if (!scroll) { scroll = window.pageYOffset; }

    if (scroll >= this.topPoint) {
      if (scroll <= this.bottomPoint) {
        if (!this.isStuck) {
          this._setSticky();
        }
      } else {
        if (this.isStuck) {
          this._removeSticky(false);
        }
      }
    } else {
      if (this.isStuck) {
        this._removeSticky(true);
      }
    }
  }

  /**
   * Causes the $element to become stuck.
   * Adds `position: fixed;`, and helper classes.
   * @fires Sticky#stuckto
   * @function
   * @private
   */
  _setSticky() {
    var _this = this,
        stickTo = this.options.stickTo,
        mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
        notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
        css = {};

    css[mrgn] = `${this.options[mrgn]}em`;
    css[stickTo] = 0;
    css[notStuckTo] = 'auto';
    this.isStuck = true;
    // State classes go through the native layer (7.0 line A, S10); the css
    // writes stay on jQuery (css seam).
    this.$element.classList.remove('is-anchored', `is-at-${notStuckTo}`);
    this.$element.classList.add('is-stuck', `is-at-${stickTo}`);
    Object.keys(css).forEach(function(prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become `position: fixed;`
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
     * @event Sticky#stuckto
     */
    Events.trigger(this.$element, `sticky.zf.stuckto:${stickTo}`);
    // S10: the transitionend-family consumer flips to the native event
    // layer - real browser events reach it directly. M1's off-then-on wipe
    // carries over as the Events.off form.
    Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky');
    Events.on(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky', function() {
      _this._setSizes();
    });
  }

  /**
   * Causes the $element to become unstuck.
   * Removes `position: fixed;`, and helper classes.
   * Adds other helper classes.
   * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
   * @fires Sticky#unstuckfrom
   * @private
   */
  _removeSticky(isTop) {
    var stickTo = this.options.stickTo,
        stickToTop = stickTo === 'top',
        css = {},
        anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
        mrgn = stickToTop ? 'marginTop' : 'marginBottom',
        topOrBottom = isTop ? 'top' : 'bottom';

    css[mrgn] = 0;

    css.bottom = 'auto';
    if(isTop) {
      css.top = 0;
    } else {
      css.top = anchorPt;
    }

    this.isStuck = false;
    // State classes go through the native layer (7.0 line A, S10).
    this.$element.classList.remove('is-stuck', `is-at-${stickTo}`);
    this.$element.classList.add('is-anchored', `is-at-${topOrBottom}`);
    Object.keys(css).forEach(function(prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become anchored.
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
     * @event Sticky#unstuckfrom
     */
    Events.trigger(this.$element, `sticky.zf.unstuckfrom:${topOrBottom}`);
  }

  /**
   * Sets the $element and $container sizes for plugin.
   * Calls `_setBreakPoints`.
   * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
   * @private
   */
  _setSizes(cb) {
    this.canStick = MediaQuery.is(this.options.stickyOn);
    if (!this.canStick) {
      if (cb && typeof cb === 'function') { cb(); }
      return;
    }

    var newElemWidth = this.$container.getBoundingClientRect().width,
      comp = window.getComputedStyle(this.$container),
      pdngl = parseInt(comp['padding-left'], 10),
      pdngr = parseInt(comp['padding-right'], 10);

    if (this.$anchor) {
      this.anchorHeight = this.$anchor.getBoundingClientRect().height;
    } else {
      this._parsePoints();
    }

    this.$element.style.maxWidth = `${newElemWidth - pdngl - pdngr}px`;

    // Recalculate the height only if it is "dynamic"
    if (this.options.dynamicHeight || !this.containerHeight) {
      // Get the sticked element height and apply it to the container to "hold the place"
      var newContainerHeight = this.$element.getBoundingClientRect().height || this.containerHeight;
      newContainerHeight = window.getComputedStyle(this.$element).display === "none" ? 0 : newContainerHeight;
      this.$container.style.height = newContainerHeight + 'px';
      this.containerHeight = newContainerHeight;
    }
    this.elemHeight = this.containerHeight;

    if (!this.isStuck) {
      if (this.$element.classList.contains('is-at-bottom')) {
        var anchorPt = (this.points ? this.points[1] - (this.$container.getBoundingClientRect().top + window.pageYOffset) : this.anchorHeight) - this.elemHeight;
        this.$element.style.top = anchorPt + 'px';
      }
    }

    this._setBreakPoints(this.containerHeight, function() {
      if (cb && typeof cb === 'function') { cb(); }
    });
  }

  /**
   * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
   * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
   * @param {Function} cb - optional callback function to be called on completion.
   * @private
   */
  _setBreakPoints(elemHeight, cb) {
    if (!this.canStick) {
      if (cb && typeof cb === 'function') { cb(); }
      return false;
    }
    var mTop = emCalc(this.options.marginTop),
        mBtm = emCalc(this.options.marginBottom),
        // offset().top equivalent (7.0 line A, S10, S7 SmoothScroll
        // precedent).
        topPoint = this.points ? this.points[0] : this.$anchor.getBoundingClientRect().top + window.pageYOffset,
        bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,
        winHeight = window.innerHeight;

    if (this.options.stickTo === 'top') {
      topPoint -= mTop;
      bottomPoint -= (elemHeight + mTop);
    } else if (this.options.stickTo === 'bottom') {
      topPoint -= (winHeight - (elemHeight + mBtm));
      bottomPoint -= (winHeight - mBtm);
    } else ;

    this.topPoint = topPoint;
    this.bottomPoint = bottomPoint;

    if (cb && typeof cb === 'function') { cb(); }
  }

  /**
   * Destroys the current sticky element.
   * Resets the element to the top position first.
   * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
   * @function
   */
  _destroy() {
    this._removeSticky(true);

    // The css resets and the state classes.
    this.$element.classList.remove(`${this.options.stickyClass}`, 'is-anchored', 'is-at-top');
    this.$element.style.height = '';
    this.$element.style.top = '';
    this.$element.style.bottom = '';
    this.$element.style.maxWidth = '';
    // Native side: the flipped resizeme/mutateme/transitionend listeners and
    // the per-instance window scroll listener drop precisely. The mutateme
    // listeners live on the native layer since the S10 group flip.
    Events.off(this.$element, 'resizeme.zf.trigger mutateme.zf.trigger');
    Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky');
    if (this.$anchor) {
      // The 'change.zf.sticky' off below is removed (S14): 6.x never bound a
      // change listener on the anchor (grep master confirms - only this off
      // existed), so the wipe always matched nothing, and on the native
      // layer it could never unregister anything either. Dead code.
      Events.off(this.$anchor, 'mutateme.zf.trigger');
    }
    if (this.scrollListener) Events.off(window, this.scrollListener);
    if (this.onLoadListener) Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer

    if (this.wasWrapped) {
      // .unwrap(): the wrapper is replaced by its children
      const wrapper = this.$element.parentElement;
      while (wrapper.firstChild) {
        wrapper.parentElement.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    } else {
      this.$container.classList.remove(this.options.containerClass);
      this.$container.style.height = '';
    }
  }
}

Sticky.defaults = {
  /**
   * Customizable container template. Add your own classes for styling and sizing.
   * @option
   * @type {string}
   * @default '&lt;div data-sticky-container&gt;&lt;/div&gt;'
   */
  container: '<div data-sticky-container></div>',
  /**
   * Location in the view the element sticks to. Can be `'top'` or `'bottom'`.
   * @option
   * @type {string}
   * @default 'top'
   */
  stickTo: 'top',
  /**
   * If anchored to a single element, the id of that element.
   * @option
   * @type {string}
   * @default ''
   */
  anchor: '',
  /**
   * If using more than one element as anchor points, the id of the top anchor.
   * @option
   * @type {string}
   * @default ''
   */
  topAnchor: '',
  /**
   * If using more than one element as anchor points, the id of the bottom anchor.
   * @option
   * @type {string}
   * @default ''
   */
  btmAnchor: '',
  /**
   * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginTop: 1,
  /**
   * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginBottom: 1,
  /**
   * Breakpoint string that is the minimum screen size an element should become sticky.
   * @option
   * @type {string}
   * @default 'medium'
   */
  stickyOn: 'medium',
  /**
   * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
   * @option
   * @type {string}
   * @default 'sticky'
   */
  stickyClass: 'sticky',
  /**
   * Class applied to sticky container. Foundation defaults to `sticky-container`.
   * @option
   * @type {string}
   * @default 'sticky-container'
   */
  containerClass: 'sticky-container',
  /**
   * If true (by default), keep the sticky container the same height as the element. Otherwise, the container height is set once and does not change.
   * @option
   * @type {boolean}
   * @default true
   */
  dynamicHeight: true,
  /**
   * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
   * @option
   * @type {number}
   * @default -1
   */
  checkEvery: -1
};

/**
 * Helper function to calculate em values
 * @param Number {em} - number of em's to calculate into pixels
 */
function emCalc(em) {
  return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
}

/**
 * Tabs module.
 * @module foundation.tabs
 * @requires foundation.util.keyboard
 * @requires foundation.util.imageLoader if tabs contain images
 */

class Tabs extends Plugin {
  /**
   * Creates a new instance of tabs.
   * @class
   * @name Tabs
   * @fires Tabs#init
   * @param {jQuery} element - jQuery object to make into tabs.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Tabs.defaults, datasetOptions(this.$element), options);
    this.className = 'Tabs'; // ie9 back compat

    this._init();
    Keyboard.register('Tabs', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'previous',
      'ARROW_DOWN': 'next',
      'ARROW_LEFT': 'previous'
      // 'TAB': 'next',
      // 'SHIFT_TAB': 'previous'
    });
  }

  /**
   * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
   * @private
   */
  _init() {
    var _this = this;
    this._isInitializing = true;
    // Per-instance id for the native deep-link hashchange namespace (7.0 line
    // A, S8) - the same shape Reveal/Magellan/Accordion use.
    this.id = this.$element.id || GetYoDigits(6, 'tabs');

    this.$element.setAttribute('role', 'tablist');
    this.$tabTitles = Array.from(this.$element.querySelectorAll(`.${this.options.linkClass}`));
    this.$tabContent = document.querySelector(`[data-tabs-content="${this.$element.id}"]`);

    this.$tabTitles.forEach(function(elem){
      var link = elem.querySelector('a'),
          isActive = elem.classList.contains(`${_this.options.linkActiveClass}`),
          hash = link.getAttribute('data-tabs-target') || link.hash.slice(1),
          linkId = link.id ? link.id : `${hash}-label`,
          tabContent = document.getElementById(hash);

      // State/ARIA go through the native layer (7.0 line A, S8).
      elem.setAttribute('role', 'presentation');

      link.setAttribute('role', 'tab');
      link.setAttribute('aria-controls', hash);
      link.setAttribute('aria-selected', `${isActive}`);
      link.setAttribute('id', linkId);
      link.setAttribute('tabindex', isActive ? '0' : '-1');

      tabContent.setAttribute('role', 'tabpanel');
      tabContent.setAttribute('aria-labelledby', linkId);

      // Save up the initial hash to return to it later when going back in history
      if (isActive) {
        _this._initialAnchor = `#${hash}`;
      }

      if(!isActive) {
        tabContent.setAttribute('aria-hidden', 'true');
      }

      if(isActive && _this.options.autoFocus){
        _this.onLoadListener = onLoad(window, function() {
          // A load callback can land after destroy() nulled the instance
          // state (the S6 slider guard pattern).
          if (!_this.$element) { return; }
          // fx 方案 A: the native page-scroll tween (SmoothScroll S7
          // equivalence - one viewport tween, the callback once, ledger ②)
          Motion.animate(document.documentElement, { scrollTop: elem.getBoundingClientRect().top + window.pageYOffset }, _this.options.deepLinkSmudgeDelay, null, () => {
            link.focus();
          });
        });
      }
    });

    if(this.options.matchHeight) {
      var images = this.$tabContent ? this.$tabContent.querySelectorAll('img') : [];

      if (images.length) {
        onImagesLoaded(images, this._setHeight.bind(this));
      } else {
        this._setHeight();
      }
    }

     // Current context-bound function to open tabs on page load or history hashchange
    this._checkDeepLink = () => {
      var anchor = window.location.hash;

      if (!anchor.length) {
        // If we are still initializing and there is no anchor, then there is nothing to do
        if (this._isInitializing) return;
        // Otherwise, move to the initial anchor
        if (this._initialAnchor) anchor = this._initialAnchor;
      }

      var anchorNoHash = anchor.indexOf('#') >= 0 ? anchor.slice(1) : anchor;
      var anchorEl = anchorNoHash ? document.getElementById(anchorNoHash) : null;
      var link = anchor ? this.$element.querySelector(`[href$="${anchor}"],[data-tabs-target="${anchorNoHash}"]`) : null;
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!(anchorEl && link);

      if (isOwnAnchor) {
        // If there is an anchor for the hash, select it
        if (anchorEl && link) {
          this.selectTab(anchorEl, true);
        }
        // Otherwise, collapse everything
        else {
          this._collapse();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          var offsetTop = this.$element.getBoundingClientRect().top + window.pageYOffset;
          Motion.animate(document.documentElement, { scrollTop: offsetTop - this.options.deepLinkSmudgeOffset}, this.options.deepLinkSmudgeDelay);
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Tabs#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        Events.trigger(this.$element, 'deeplink.zf.tabs', [link, anchorEl]);
      }
    };

    //use browser to open a tab, if it exists in this tabset
    if (this.options.deepLink) {
      this._checkDeepLink();
    }

    this._events();

    this._isInitializing = false;
  }

  /**
   * Adds event handlers for items within the tabs.
   * @private
   */
  _events() {
    this._addKeyHandler();
    this._addClickHandler();
    this._setHeightMqHandler = null;

    if (this.options.matchHeight) {
      this._setHeightMqHandler = this._setHeight.bind(this);

      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs/offcanvas all flipped with the producer in
      // the same move).
      Events.on(window, 'changed.zf.mediaquery', this._setHeightMqHandler);
    }

    if(this.options.deepLink) {
      // S8: the deep-link hashchange moves to the native event layer under
      // the per-instance namespace shape introduced for Reveal's hashchange,
      // so the destroy path can drop it precisely. Real hashchange events are
      // unaffected by the namespace.
      Events.on(window, `hashchange.zf.tabs:${this.id}`, this._checkDeepLink);
    }
  }

  /**
   * Adds click handlers for items within the tabs.
   * @private
   */
  _addClickHandler() {
    var _this = this;

    // S8: the delegated click consumer flips to the native event layer. Its
    // producers are real user clicks only (the keyboard flow calls
    // _handleTabChange directly), so this half can move alone; inside the
    // handler `this` is the matched title element, like jQuery's delegation.
    Events.off(this.$element, 'click.zf.tabs');
    Events.delegate(this.$element, 'click.zf.tabs', `.${this.options.linkClass}`, function(e){
      e.preventDefault();
      _this._handleTabChange(this);
    });
  }

  /**
   * Adds keyboard event handlers for items within the tabs.
   * @private
   */
  _addKeyHandler() {
    var _this = this;

    // 7.0 line A terminal form: the keydown listener runs on the native
    // event layer (the coarse suite's mocks dispatch real KeyboardEvents
    // since the S16 migration, so the old jQuery-pass-through reason is
    // gone). The listener binds on every title, like the collection-wide
    // .on() did.
    this.$tabTitles.forEach(function(title) {
      Events.off(title, 'keydown.zf.tabs');
      Events.on(title, 'keydown.zf.tabs', function(e){
        if (e.which === 9) return;

        var elements = Array.from(this.parentElement.children),
          prevElement,
          nextElement,
          i = elements.indexOf(this);

        if (_this.options.wrapOnKeys) {
          prevElement = i === 0 ? elements[elements.length - 1] : elements[i-1];
          nextElement = i === elements.length - 1 ? elements[0] : elements[i+1];
        } else {
          prevElement = elements[Math.max(0, i-1)];
          nextElement = elements[Math.min(i+1, elements.length-1)];
        }

        var element = this;
        // handle keyboard event with keyboard util
        Keyboard.handleKey(e, 'Tabs', {
          open: function() {
            element.querySelector('[role="tab"]').focus();
            _this._handleTabChange(element);
          },
          previous: function() {
            prevElement.querySelector('[role="tab"]').focus();
            _this._handleTabChange(prevElement);
          },
          next: function() {
            nextElement.querySelector('[role="tab"]').focus();
            _this._handleTabChange(nextElement);
          },
          handled: function() {
            e.preventDefault();
          }
        });
      });
    }, this.$tabTitles);
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`. Collapses active tab.
   * @param {jQuery} $target - Tab to open.
   * @param {boolean} historyHandled - browser has already handled a history update
   * @fires Tabs#change
   * @function
   */
  _handleTabChange(target, historyHandled) {
    target = target.nodeType === 1 ? target : target[0];

    // With `activeCollapse`, if the target is the active Tab, collapse it.
    if (target.classList.contains(`${this.options.linkActiveClass}`)) {
        if(this.options.activeCollapse) {
            this._collapse();
        }
        return;
    }

    var oldTab = this.$element.
          querySelector(`.${this.options.linkClass}.${this.options.linkActiveClass}`),
          tabLink = target.querySelector('[role="tab"]'),
          targetName = tabLink.getAttribute('data-tabs-target'),
          anchor = targetName && targetName.length ? `#${targetName}` : tabLink.hash,
          targetContent = this.$tabContent.querySelector(anchor);

    //close old tab
    this._collapseTab(oldTab);

    //open new tab
    this._openTab(target);

    //either replace or update browser history
    if (this.options.deepLink && !historyHandled) {
      if (this.options.updateHistory) {
        history.pushState({}, '', location.pathname + location.search + anchor);
      } else {
        history.replaceState({}, '', location.pathname + location.search + anchor);
      }
    }

    /**
     * Fires when the plugin has successfully changed tabs.
     * @event Tabs#change
     */
    // 7.0 terminal form (the ruled detail sweep): the change production is
    // a real, bubbling CustomEvent with the plain elements as parameters -
    // the 6.x jQuery trigger delivered collections as trailing handler
    // arguments; jQuery listeners on this real event read them from
    // event.originalEvent.detail.
    Events.trigger(this.$element, 'change.zf.tabs', [target, targetContent]);

    // S10 group flip: the mutateme forward is a real bubbling event.
    var mutated = targetContent ? targetContent.querySelectorAll('[data-mutate]') : [];
    for (var i = 0; i < mutated.length; i++) {
      Events.trigger(mutated[i], 'mutateme.zf.trigger');
    }
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to open.
   * @function
   */
  _openTab(target) {
      var tabLink = target.querySelector('[role="tab"]'),
          hash = tabLink.getAttribute('data-tabs-target') || tabLink.hash.slice(1),
          targetContent = this.$tabContent.querySelector(`#${hash}`);

      // State/ARIA go through the native layer (7.0 line A, S8).
      target.classList.add(`${this.options.linkActiveClass}`);

      tabLink.setAttribute('aria-selected', 'true');
      tabLink.setAttribute('tabindex', '0');

      targetContent.classList.add(`${this.options.panelActiveClass}`);
      targetContent.removeAttribute('aria-hidden');
  }

  /**
   * Collapses `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to collapse.
   * @function
   */
  _collapseTab(target) {
    target = target.nodeType === 1 ? target : target[0];
    // State/ARIA go through the native layer (7.0 line A, S8).
    var tabLink = target.querySelector('[role="tab"]');
    target.classList.remove(`${this.options.linkActiveClass}`);
    tabLink.setAttribute('aria-selected', 'false');
    tabLink.setAttribute('tabindex', '-1');

    var panel = document.getElementById(tabLink.getAttribute('aria-controls'));
    if (panel) {
      panel.classList.remove(`${this.options.panelActiveClass}`);
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Collapses the active Tab.
   * @fires Tabs#collapse
   * @function
   */
  _collapse() {
    var activeTab = this.$element.querySelector(`.${this.options.linkClass}.${this.options.linkActiveClass}`);

    if (activeTab) {
      this._collapseTab(activeTab);

      /**
      * Fires when the plugin has successfully collapsed tabs.
      * @event Tabs#collapse
      */
      // S8: real, bubbling CustomEvent; the terminal form forwards the
      // plain element.
      Events.trigger(this.$element, 'collapse.zf.tabs', [activeTab]);
    }
  }

  /**
   * Public method for selecting a content pane to display.
   * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
   * @param {boolean} historyHandled - browser has already handled a history update
   * @function
   */
  selectTab(elem, historyHandled) {
    var idStr, hashIdStr;

    if (typeof elem === 'object') {
      // nodeType marks a real node: a native element arrives unwrapped
      // (the 7.0 contract), a jQuery collection still needs the [0] head
      idStr = elem.nodeType === 1 ? elem.id : elem[0].id;
    } else {
      idStr = elem;
    }

    if (idStr.indexOf('#') < 0) {
      hashIdStr = `#${idStr}`;
    } else {
      hashIdStr = idStr;
      idStr = idStr.slice(1);
    }

    // jQuery's .has(): the titles CONTAINING a descendant matching
    var target = this.$tabTitles.filter(function(title) {
      return title.querySelector(`[href$="${hashIdStr}"],[data-tabs-target="${idStr}"]`);
    })[0];

    this._handleTabChange(target, historyHandled);
  };

  /**
   * Sets the height of each panel to the height of the tallest panel.
   * If enabled in options, gets called on media query change.
   * If loading content via external source, can be called directly or with _reflow.
   * If enabled with `data-match-height="true"`, tabs sets to equal height
   * @function
   * @private
   */
  _setHeight() {
    var max = 0,
        _this = this; // Lock down the `this` value for the root tabs object

    if (!this.$tabContent) {
      return;
    }

    var panels = Array.from(this.$tabContent.querySelectorAll(`.${this.options.panelClass}`));

    panels.forEach(function(panel) {
      panel.style.minHeight = '';

      var isActive = panel.classList.contains(`${_this.options.panelActiveClass}`); // get the options from the parent instead of trying to get them from the child

      if (!isActive) {
        panel.style.visibility = 'hidden';
        panel.style.display = 'block';
      }

      var temp = panel.getBoundingClientRect().height;

      if (!isActive) {
        panel.style.visibility = '';
        panel.style.display = '';
      }

      max = temp > max ? temp : max;
    });

    panels.forEach(function(panel) {
      panel.style.minHeight = `${max}px`;
    });
  }

  /**
   * Destroys an instance of tabs.
   * @fires Tabs#destroyed
   */
  _destroy() {
    // the 6.x destroy cleanup: hide the titles and panels
    this.$element.querySelectorAll(`.${this.options.linkClass}`).forEach(function(el) {
      el.style.display = 'none';
    });
    this.$element.querySelectorAll(`.${this.options.panelClass}`).forEach(function(el) {
      el.style.display = 'none';
    });

    // the delegated click listener, the title keydown listeners and the
    // deep-link hashchange go with their namespaces.
    Events.off(this.$element, 'click.zf.tabs');
    this.$tabTitles.forEach(function(title) {
      Events.off(title, '.zf.tabs');
    });

    if (this.options.matchHeight) {
      if (this._setHeightMqHandler != null) {
         Events.off(window, 'changed.zf.mediaquery', this._setHeightMqHandler); // S13 flip, see _events
      }
    }

    if (this.options.deepLink) {
      Events.off(window, `hashchange.zf.tabs:${this.id}`);
    }

    if (this.onLoadListener) {
      Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
    }
  }
}

Tabs.defaults = {
  /**
   * Link the location hash to the active pane.
   * Set the location hash when the active pane changes, and open the corresponding pane when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,

  /**
   * If `deepLink` is enabled, adjust the deep link scroll to make sure the top of the tab panel is visible
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinkSmudge: false,

  /**
   * If `deepLink` is enabled, animation time (ms) for the deep link adjustment
   * @option
   * @type {number}
   * @default 300
   */
  deepLinkSmudgeDelay: 300,

  /**
   * If `deepLink` is enabled, animation offset from the top for the deep link adjustment
   * @option
   * @type {number}
   * @default 0
   */
  deepLinkSmudgeOffset: 0,

  /**
   * If `deepLink` is enabled, update the browser history with the open tab
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false,

  /**
   * Allows the window to scroll to content of active pane on load.
   * Not recommended if more than one tab panel per page.
   * @option
   * @type {boolean}
   * @default false
   */
  autoFocus: false,

  /**
   * Allows keyboard input to 'wrap' around the tab links.
   * @option
   * @type {boolean}
   * @default true
   */
  wrapOnKeys: true,

  /**
   * Allows the tab content panes to match heights if set to true.
   * @option
   * @type {boolean}
   * @default false
   */
  matchHeight: false,

  /**
   * Allows active tabs to collapse when clicked.
   * @option
   * @type {boolean}
   * @default false
   */
  activeCollapse: false,

  /**
   * Class applied to `li`'s in tab link list.
   * @option
   * @type {string}
   * @default 'tabs-title'
   */
  linkClass: 'tabs-title',

  /**
   * Class applied to the active `li` in tab link list.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  linkActiveClass: 'is-active',

  /**
   * Class applied to the content containers.
   * @option
   * @type {string}
   * @default 'tabs-panel'
   */
  panelClass: 'tabs-panel',

  /**
   * Class applied to the active content container.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  panelActiveClass: 'is-active'
};

/**
 * Toggler module.
 * @module foundation.toggler
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.events
 * @requires foundation.util.dom
 */

class Toggler extends Plugin {
  /**
   * Creates a new instance of Toggler.
   * @class
   * @name Toggler
   * @fires Toggler#init
   * @param {Object} element - Element (7.0) or, in the mixed state, a jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A, slice S15: the plugin works on the native element; the
    // jQuery collection the mixed-state reflow still feeds in is unwrapped.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = Object.assign({}, Toggler.defaults, datasetOptions(this.$element), options);
    this.className = '';
    this.className = 'Toggler'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
    this._events();
  }

  /**
   * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
   * @function
   * @private
   */
  _init() {
    // Collect triggers to set ARIA attributes to
    var id = this.$element.id,
      triggers = document.querySelectorAll(`[data-open~="${id}"], [data-close~="${id}"], [data-toggle~="${id}"]`);

    var input;
    // Parse animation classes if they were set
    if (this.options.animate) {
      input = this.options.animate.split(' ');

      this.animationIn = input[0];
      this.animationOut = input[1] || null;

      // - aria-expanded: according to the element visibility.
      //   (was `!this.$element.is(':hidden')`; Dom's visible() carries the
      //   narrow display-based semantics decided for the 7.0 line, slice S1)
      this._setTriggersExpanded(triggers, visible(this.$element));
    }
    // Otherwise, parse toggle class
    else {
      input = this.options.toggler;
      if (typeof input !== 'string' || !input.length) {
        throw new Error(`The 'toggler' option containing the target class is required, got "${input}"`);
      }
      // Allow for a . at the beginning of the string
      this.className = input[0] === '.' ? input.slice(1) : input;

      // - aria-expanded: according to the elements class set.
      this._setTriggersExpanded(triggers, this.$element.classList.contains(this.className));
    }

    // - aria-controls: adding the element id to it if not already in it.
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      var controls = trigger.getAttribute('aria-controls') || '';

      const containsId = new RegExp(`\\b${RegExpEscape(id)}\\b`).test(controls);
      if (!containsId) trigger.setAttribute('aria-controls', controls ? `${controls} ${id}` : id);
    }
  }

  /**
   * Writes aria-expanded on every trigger element.
   * @function
   * @private
   * @param {NodeList} triggers - the trigger elements to update.
   * @param {Boolean} isOn - whether the toggler element is in the "on" state.
   */
  _setTriggersExpanded(triggers, isOn) {
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].setAttribute('aria-expanded', isOn ? 'true' : 'false');
    }
  }

  /**
   * Initializes events for the toggle trigger.
   * @function
   * @private
   */
  _events() {
    // S4: both sides of the 'toggle.zf.trigger' seam are native now - the
    // Triggers util dispatches through the Events layer, so this consumer
    // listens there too. (jQuery-synthesized triggers no longer reach it:
    // a jQuery trigger() never produces a real DOM event.)
    Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));
  }

  /**
   * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
   * @function
   * @fires Toggler#on
   * @fires Toggler#off
   */
  toggle() {
    this[ this.options.animate ? '_toggleAnimate' : '_toggleClass']();
  }

  _toggleClass() {
    var element = this.$element;
    element.classList.toggle(this.className);

    var isOn = element.classList.contains(this.className);
    if (isOn) {
      /**
       * Fires if the target element has the class after a toggle.
       * @event Toggler#on
       */
      Events.trigger(element, 'on.zf.toggler');
    }
    else {
      /**
       * Fires if the target element does not have the class after a toggle.
       * @event Toggler#off
       */
      Events.trigger(element, 'off.zf.toggler');
    }

    this._updateARIA(isOn);
    this._triggerMutate();
  }

  _toggleAnimate() {
    var _this = this,
      element = this.$element;

    // Mixed-state seam (7.0 line A, S3): Motion still runs on jQuery, so it
    // is fed the jQuery object and its callback still arrives with jQuery
    // conventions; only the events fired from the callback already go
    // through the native Events layer.
    if (!visible(element)) {
      Motion.animateIn(this.$element, this.animationIn, function() {
        _this._updateARIA(true);
        Events.trigger(element, 'on.zf.toggler');
        _this._triggerMutate();
      });
    }
    else {
      Motion.animateOut(this.$element, this.animationOut, function() {
        _this._updateARIA(false);
        Events.trigger(element, 'off.zf.toggler');
        _this._triggerMutate();
      });
    }
  }

  _updateARIA(isOn) {
    var id = this.$element.id;
    var triggers = document.querySelectorAll(`[data-open="${id}"], [data-close="${id}"], [data-toggle="${id}"]`);

    this._setTriggersExpanded(triggers, isOn);
  }

  /**
   * Fires mutateme.zf.trigger on every [data-mutate] descendant, so other
   * plugins can react to the toggled element changing.
   * @function
   * @private
   */
  _triggerMutate() {
    var mutated = this.$element.querySelectorAll('[data-mutate]');

    for (var i = 0; i < mutated.length; i++) {
      Events.trigger(mutated[i], 'mutateme.zf.trigger');
    }
  }

  /**
   * Destroys the instance of Toggler on the element.
   * @function
   */
  _destroy() {
    // Native side: the toggle.zf.trigger seam listener and every other
    // listener this plugin registered through the Events layer are dropped
    // by the bare-namespace form in one call. (The 6.x jQuery-side
    // `off('.zf.toggler')` line died with this file's jQuery import: the
    // plugin registers nothing on the jQuery side anymore.)
    Events.off(this.$element, '.zf.toggler');
  }
}

Toggler.defaults = {
  /**
   * Class of the element to toggle. It can be provided with or without "."
   * @option
   * @type {string}
   */
  toggler: undefined,
  /**
   * Tells the plugin if the element should animated when toggled.
   * @option
   * @type {boolean}
   * @default false
   */
  animate: false
};

// jQuery's $(htmlString): parsed to the single root element.
function parseTemplate(html) {
  var probe = document.createElement('template');
  probe.innerHTML = html.trim();
  return probe.content.firstElementChild;
}

/**
 * Tooltip module.
 * @module foundation.tooltip
 * @requires foundation.util.box
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

class Tooltip extends Positionable {
  /**
   * Creates a new instance of a Tooltip.
   * @class
   * @name Tooltip
   * @fires Tooltip#init
   * @param {jQuery} element - jQuery object to attach a tooltip to.
   * @param {Object} options - object to extend the default configuration.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Tooltip.defaults, datasetOptions(this.$element), options);
    this.className = 'Tooltip'; // ie9 back compat

    this.isActive = false;
    this.isClick = false;

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
  }

  /**
   * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
   * @private
   */
  _init() {
    MediaQuery._init();
    var elemId = this.$element.getAttribute('aria-describedby') || GetYoDigits(6, 'tooltip');

    this.options.tipText = this.options.tipText || this.$element.getAttribute('title');
    this.template = this.options.template ? parseTemplate(this.options.template) : this._buildTemplate(elemId);

    // The element-local hide before positioning (the 6.x appendTo/hide).
    document.body.appendChild(this.template);
    if (this.options.allowHtml) {
      this.template.innerHTML = this.options.tipText;
    } else {
      this.template.textContent = this.options.tipText;
    }
    this.template.style.display = 'none';

    this.$element.setAttribute('title', '');
    this.$element.setAttribute('aria-describedby', elemId);
    this.$element.setAttribute('data-yeti-box', elemId);
    this.$element.setAttribute('data-toggle', elemId);
    this.$element.setAttribute('data-resize', elemId);
    this.$element.classList.add(this.options.triggerClass);

    super._init();
    this._events();
  }

  _getDefaultPosition() {
    // handle legacy classnames
    var elementClassName = this.$element.className;
    if (this.$element instanceof SVGElement) {
        elementClassName = elementClassName.baseVal;
    }
    var position = elementClassName.match(/\b(top|left|right|bottom)\b/g);
    return position ? position[0] : 'top';
  }

  _getDefaultAlignment() {
    return 'center';
  }

  _getHOffset() {
    if(this.position === 'left' || this.position === 'right') {
      return this.options.hOffset + this.options.tooltipWidth;
    } else {
      return this.options.hOffset
    }
  }

  _getVOffset() {
    if(this.position === 'top' || this.position === 'bottom') {
      return this.options.vOffset + this.options.tooltipHeight;
    } else {
      return this.options.vOffset
    }
  }

  /**
   * builds the tooltip element, adds attributes, and returns the template.
   * The element is created natively (7.0 line A, S8); the terminal form
   * returns the element (the mixed state returned a jQuery collection).
   * @private
   */
  _buildTemplate(id) {
    var templateClasses = (`${this.options.tooltipClass} ${this.options.templateClasses}`).trim();
    var template = document.createElement('div');
    template.className = templateClasses;
    template.setAttribute('role', 'tooltip');
    template.setAttribute('aria-hidden', 'true');
    template.setAttribute('data-is-active', 'false');
    template.setAttribute('data-is-focus', 'false');
    template.setAttribute('id', id);
    return template;
  }

  /**
   * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
   * if the tooltip is larger than the screen width, default to full width - any user selected margin
   * @private
   */
  _setPosition() {
    // Seam (S8): the whole positioning block (Positionable + the Box util)
    // still runs on jQuery objects - Box consumes and produces jQuery
    // collections and is self-consistent, so the anchor/template pair is
    // handed in as such and nothing here changes until the Box slice.
    super._setPosition(this.$element, this.template);
  }

  /**
   * reveals the tooltip, and fires an event to close any other open tooltips on the page
   * @fires Tooltip#closeme
   * @fires Tooltip#show
   * @function
   */
  show() {
    if (this.options.showOn !== 'all' && !MediaQuery.is(this.options.showOn)) {
      // console.error('The screen is too small to display this tooltip');
      return false;
    }

    var _this = this;
    this.template.style.visibility = 'hidden';
    // .show() native form: clear the inline none, fall back to block
    this.template.style.display = '';
    if (window.getComputedStyle(this.template).display === 'none') {
      this.template.style.display = 'block';
    }
    this._setPosition();
    this.template.classList.remove('top', 'bottom', 'left', 'right');
    this.template.classList.add(this.position);
    this.template.classList.remove('align-top', 'align-bottom', 'align-left', 'align-right', 'align-center');
    this.template.classList.add('align-' + this.alignment);

    /**
     * Fires to close all other open tooltips on the page
     * @event Closeme#tooltip
     */
    // S13: the closeme production flipped with the Triggers listener -
    // a real, bubbling event whose detail carries the plugin id.
    Events.trigger(this.$element, 'closeme.zf.tooltip', [this.template.id]);


    // State/ARIA go through the native layer (7.0 line A, S8).
    this.template.setAttribute('data-is-active', 'true');
    this.template.setAttribute('aria-hidden', 'false');
    _this.isActive = true;
    // fx 方案 A: the fade tween runs on Motion's native primitive (the
    // stop-in-place, the hide reset and the visibility clear keep the 6.x
    // ordering).
    const templateEl = this.template;
    Motion.stop(templateEl);
    templateEl.style.display = 'none';
    templateEl.style.visibility = '';
    Motion.fadeIn(templateEl, this.options.fadeInDuration, function() {
      //maybe do stuff?
    });
    /**
     * Fires when the tooltip is shown
     * @event Tooltip#show
     */
    Events.trigger(this.$element, 'show.zf.tooltip');
  }

  /**
   * Hides the current tooltip, and resets the positioning class if it was changed due to collision
   * @fires Tooltip#hide
   * @function
   */
  hide() {
    var _this = this;
    // State/ARIA native; fx 方案 A, see show().
    this.template.setAttribute('aria-hidden', 'true');
    this.template.setAttribute('data-is-active', 'false');
    Motion.stop(this.template);
    Motion.fadeOut(this.template, this.options.fadeOutDuration, function() {
      _this.isActive = false;
      _this.isClick = false;
    });
    /**
     * fires when the tooltip is hidden
     * @event Tooltip#hide
     */
    Events.trigger(this.$element, 'hide.zf.tooltip');
  }

  /**
   * adds event listeners for the tooltip and its anchor
   * TODO combine some of the listeners like focus and mouseenter, etc.
   * @private
   */
  _events() {
    const _this = this;
    const element = this.$element;
    const hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined');
    var isFocus = false;

    // `disableForTouch: Fully disable the tooltip on touch devices
    if (hasTouch && this.options.disableForTouch) return;

    if (!this.options.disableHover) {
      // S8: hover/focus/click consumers flip to the native event layer -
      // mouseenter/mouseleave/mousedown/focus/focusout are real DOM events
      // and reach these listeners directly (still-on-jQuery synthetic
      // producers like `$(el).trigger('mouseenter')` do not, by design).
      Events.on(element, 'mouseenter.zf.tooltip', function() {
        if (!_this.isActive) {
          _this.timeout = setTimeout(function() {
            _this.show();
          }, _this.options.hoverDelay);
        }
      });
      Events.on(element, 'mouseleave.zf.tooltip', ignoreMousedisappear(function() {
        clearTimeout(_this.timeout);
        if (!isFocus || (_this.isClick && !_this.options.clickOpen)) {
          _this.hide();
        }
      }));
    }

    if (hasTouch) {
      // S13: the tap/touchend consumer flips with the Touch util - 'tap' is
      // a real, bubbling event on the touched element now. The anchor itself
      // has no tap listener outside this binding, so arming the document
      // touch chain (Touch.init, idempotent) covers it.
      Touch.init();
      Events.on(element, 'tap.zf.tooltip touchend.zf.tooltip', function () {
        _this.isActive ? _this.hide() : _this.show();
      });
    }

    if (this.options.clickOpen) {
      Events.on(element, 'mousedown.zf.tooltip', function() {
        if (_this.isClick) ; else {
          _this.isClick = true;
          if ((_this.options.disableHover || !_this.$element.getAttribute('tabindex')) && !_this.isActive) {
            _this.show();
          }
        }
      });
    } else {
      Events.on(element, 'mousedown.zf.tooltip', function() {
        _this.isClick = true;
      });
    }

    // S8: the close consumer flips to the native event layer - both
    // producers there (the [data-close] delegation and the closeme
    // broadcast) have dispatched real bubbling events since S4.
    Events.on(element, 'close.zf.trigger', this.hide.bind(this));

    Events.on(element, 'focus.zf.tooltip', function() {
      isFocus = true;
      if (_this.isClick) {
        // If we're not showing open on clicks, we need to pretend a click-launched focus isn't
        // a real focus, otherwise on hover and come back we get bad behavior
        if(!_this.options.clickOpen) { isFocus = false; }
        return false;
      } else {
        _this.show();
      }
    });

    Events.on(element, 'focusout.zf.tooltip', function() {
      isFocus = false;
      _this.isClick = false;
      _this.hide();
    });

    // S8: the resizeme consumer flips to the native event layer (S4
    // producer).
    Events.on(element, 'resizeme.zf.trigger', function() {
      if (_this.isActive) {
        _this._setPosition();
      }
    });
  }

  /**
   * adds a toggle method, in addition to the static show() & hide() functions
   * @function
   */
  toggle() {
    if (this.isActive) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Destroys an instance of tooltip, removes template element from the view.
   * @function
   */
  _destroy() {
    this.$element.setAttribute('title', this.template.textContent);
    this.$element.classList.remove(this.options.triggerClass, 'top', 'right', 'left', 'bottom');
    ['aria-describedby', 'data-disable-hover', 'data-resize', 'data-toggle', 'data-tooltip', 'data-yeti-box'].forEach(function(name) {
      this.$element.removeAttribute(name);
    }, this);

    // The flipped hover/focus/click/close/resizeme listeners.
    Events.off(this.$element, '.zf.trigger .zf.tooltip');

    this.template.remove();
  }
}

Tooltip.defaults = {
  /**
   * Time, in ms, before a tooltip should open on hover.
   * @option
   * @type {number}
   * @default 200
   */
  hoverDelay: 200,
  /**
   * Time, in ms, a tooltip should take to fade into view.
   * @option
   * @type {number}
   * @default 150
   */
  fadeInDuration: 150,
  /**
   * Time, in ms, a tooltip should take to fade out of view.
   * @option
   * @type {number}
   * @default 150
   */
  fadeOutDuration: 150,
  /**
   * Disables hover events from opening the tooltip if set to true
   * @option
   * @type {boolean}
   * @default false
   */
  disableHover: false,
  /**
   * Disable the tooltip for touch devices.
   * This can be useful to make elements with a tooltip on it trigger their
   * action on the first tap instead of displaying the tooltip.
   * @option
   * @type {booelan}
   * @default false
   */
  disableForTouch: false,
  /**
   * Optional addtional classes to apply to the tooltip template on init.
   * @option
   * @type {string}
   * @default ''
   */
  templateClasses: '',
  /**
   * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
   * @option
   * @type {string}
   * @default 'tooltip'
   */
  tooltipClass: 'tooltip',
  /**
   * Class applied to the tooltip anchor element.
   * @option
   * @type {string}
   * @default 'has-tip'
   */
  triggerClass: 'has-tip',
  /**
   * Minimum breakpoint size at which to open the tooltip.
   * @option
   * @type {string}
   * @default 'small'
   */
  showOn: 'small',
  /**
   * Custom template to be used to generate markup for tooltip.
   * @option
   * @type {string}
   * @default ''
   */
  template: '',
  /**
   * Text displayed in the tooltip template on open.
   * @option
   * @type {string}
   * @default ''
   */
  tipText: '',
  touchCloseText: 'Tap to close.',
  /**
   * Allows the tooltip to remain open if triggered with a click or touch event.
   * @option
   * @type {boolean}
   * @default true
   */
  clickOpen: true,
  /**
   * Position of tooltip. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of tooltip relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, tooltip will first try to
   * position as defined by data-position and data-alignment, but reposition if
   * it would cause an overflow.  @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * Less common for tooltips.
   * @option
   * @type {boolean}
   * @default false
   */
  allowBottomOverlap: false,
  /**
   * Distance, in pixels, the template should push away from the anchor on the Y axis.
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Distance, in pixels, the template should push away from the anchor on the X axis
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
  /**
   * Distance, in pixels, the template spacing auto-adjust for a vertical tooltip
   * @option
   * @type {number}
   * @default 14
   */
  tooltipHeight: 14,
  /**
   * Distance, in pixels, the template spacing auto-adjust for a horizontal tooltip
   * @option
   * @type {number}
   * @default 12
   */
  tooltipWidth: 12,
    /**
   * Allow HTML in tooltip. Warning: If you are loading user-generated content into tooltips,
   * allowing HTML may open yourself up to XSS attacks.
   * @option
   * @type {boolean}
   * @default false
   */
  allowHtml: false
};

// The plugin matches the plugin classes with these plugin instances.
var MenuPlugins = {
  tabs: {
    cssClass: 'tabs',
    plugin:   Tabs,
    open:     (plugin, target) => plugin.selectTab(target),
    close:    null /* not supported */,
    toggle:   null /* not supported */,
  },
  accordion: {
    cssClass: 'accordion',
    plugin:   Accordion,
    open:     (plugin, target) => plugin.down(target),
    close:    (plugin, target) => plugin.up(target),
    toggle:   (plugin, target) => plugin.toggle(target),
  }
};


/**
 * ResponsiveAccordionTabs module.
 * @module foundation.responsiveAccordionTabs
 * @requires foundation.util.motion
 * @requires foundation.accordion
 * @requires foundation.tabs
 */

// 7.0 line A, slice S11: the wrapper runs on the native layer, and the mq
// switch is an explicit destroy+rebuild of the inner Accordion/Tabs. The 6.x
// code kept a storezfData/zfPluginBase "store/restore" illusion around the
// swap - archaeology (confirmed against the 6.x base class): the restore
// line wrote the PREVIOUS inner instance into the `zfPlugin` jQuery data
// slot and the inner destroy() on the next line removed it again, so the
// restore never survived and every switch was in fact rebuild-only. The
// phantom keys are no longer written; the wrapper registers itself in the
// Registry like every plugin (S2), and the inner ctor/destroy dance around
// the registry slot mirrors the old zfPlugin guard/reoccupy machine.
class ResponsiveAccordionTabs extends Plugin {
  /**
   * Creates a new instance of a responsive accordion tabs.
   * @class
   * @name ResponsiveAccordionTabs
   * @fires ResponsiveAccordionTabs#init
   * @param {jQuery} element - jQuery object to make into Responsive Accordion Tabs.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, ResponsiveAccordionTabs.defaults, datasetOptions(this.$element), options);

    this.rules = this.$element.getAttribute('data-responsive-accordion-tabs');
    this.currentMq = null;
    this.currentRule = null;
    this.currentPlugin = null;
    this.className = 'ResponsiveAccordionTabs'; // ie9 back compat
    if (!this.$element.getAttribute('id')) {
      this.$element.setAttribute('id', GetYoDigits(6, 'responsiveaccordiontabs'));
    }

    this._init();
    this._events();
  }

  /**
   * Initializes the Menu by parsing the classes from the 'data-responsive-accordion-tabs' attribute on the element.
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();

    // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
    if (typeof this.rules === 'string') {
      let rulesTree = {};

      // Parse rules from "classes" pulled from data attribute
      let rules = this.rules.split(' ');

      // Iterate through every rule found
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i].split('-');
        let ruleSize = rule.length > 1 ? rule[0] : 'small';
        let rulePlugin = rule.length > 1 ? rule[1] : rule[0];

        if (MenuPlugins[rulePlugin] !== null) {
          rulesTree[ruleSize] = MenuPlugins[rulePlugin];
        }
      }

      this.rules = rulesTree;
    }

    this._getAllOptions();

    if (Object.keys(this.rules).length !== 0) {
      this._checkMediaQueries();
    }
  }

  _getAllOptions() {
    //get all defaults and options
    var _this = this;
    _this.allOptions = {};
    for (var key in MenuPlugins) {
      if (MenuPlugins.hasOwnProperty(key)) {
        var obj = MenuPlugins[key];
        try {
          // a detached probe element (the 6.x $('<ul></ul>') was detached
          // too - the inner plugins tolerate it through their guards)
          var dummyPlugin = document.createElement('ul');
          var tmpPlugin = new obj.plugin(dummyPlugin,_this.options);
          for (var keyKey in tmpPlugin.options) {
            if (tmpPlugin.options.hasOwnProperty(keyKey) && keyKey !== 'zfPlugin') {
              var objObj = tmpPlugin.options[keyKey];
              _this.allOptions[keyKey] = objObj;
            }
          }
          tmpPlugin.destroy();
        }
        catch(e) {
          console.warn(`Warning: Problems getting Accordion/Tab options: ${e}`);
        }
      }
    }
  }

  /**
   * Initializes events for the Menu.
   * @function
   * @private
   */
  _events() {
    // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
    // bubbling window event on the native layer now, so this consumer binds
    // there (equalizer/tabs/responsiveToggle/responsiveMenu/offcanvas all
    // flipped with the producer in the same move).
    this._changedZfMediaQueryHandler = this._checkMediaQueries.bind(this);
    Events.on(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }

  /**
   * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
   * @function
   * @private
   */
  _checkMediaQueries() {
    var matchedMq = null;
    var element = this.$element;

    // Iterate through each rule and find the last matching rule
    Object.keys(this.rules).forEach(function(key) {
      if (MediaQuery.atLeast(key)) {
        matchedMq = key;
      }
    });

    // No match? No dice
    if (!matchedMq) return;

    // Plugin already initialized? We good
    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

    // Remove existing plugin-specific CSS classes
    Object.keys(MenuPlugins).forEach(function(key) {
      element.classList.remove(MenuPlugins[key].cssClass);
    });

    // Add the CSS class for the new plugin
    element.classList.add(this.rules[matchedMq].cssClass);

    // mq switch = explicit rebuild (see the class comment): tear the current
    // inner instance down, convert the markup for the new type, construct
    // the new inner. The rebuilt inner writes its own uuid attr and takes
    // over the registry slot the base destroy just freed - the same state
    // machine the 6.x zfPlugin key ran.
    if (this.currentPlugin) this.currentPlugin.destroy();
    this._handleMarkup(this.rules[matchedMq].cssClass);
    this.currentRule = this.rules[matchedMq];
    this.currentPlugin = new this.currentRule.plugin(this.$element, this.options);
  }

  // 7.0 terminal form: the 6.x markup conversion moved nodes through
  // jQuery collection ops; each step is the same move on plain elements.
  _handleMarkup(toSet){
    var _this = this, fromString = 'accordion';
    var elementId = this.$element.getAttribute('id');
    var panelsContainer = document.querySelector(`[data-tabs-content=${elementId}]`);
    if (panelsContainer) fromString = 'tabs';
    if (fromString === toSet) {
      return;
    }

    var tabsTitle = _this.allOptions.linkClass?_this.allOptions.linkClass:'tabs-title';
    var tabsPanel = _this.allOptions.panelClass?_this.allOptions.panelClass:'tabs-panel';

    this.$element.removeAttribute('role');
    var liHeads = Array.from(this.$element.children).filter(el => el.matches(`.${tabsTitle},[data-accordion-item]`));
    liHeads.forEach(li => {
      li.classList.remove(tabsTitle, 'accordion-item');
      li.removeAttribute('data-accordion-item');
    });
    var liHeadsA = liHeads.map(li => li.querySelector(':scope > a'));
    liHeadsA.forEach(a => a && a.classList.remove('accordion-title'));

    var panels;
    if (fromString === 'tabs') {
      panels = Array.from(panelsContainer.querySelectorAll(`:scope > .${tabsPanel}`));
      panels.forEach(panel => {
        panel.classList.remove(tabsPanel);
        panel.removeAttribute('role');
        panel.removeAttribute('aria-hidden');
        panel.removeAttribute('aria-labelledby');
        var link = panel.querySelector(':scope > a');
        if (link) {
          link.removeAttribute('role');
          link.removeAttribute('aria-controls');
          link.removeAttribute('aria-selected');
        }
      });
    } else {
      panels = liHeads.map(li => li.querySelector(':scope > [data-tab-content]')).filter(Boolean);
      panels.forEach(panel => panel.classList.remove('accordion-content'));
    }

    panels.forEach(panel => {
      panel.style.display = '';
      panel.style.visibility = '';
    });
    liHeads.forEach(li => {
      li.style.display = '';
      li.style.visibility = '';
    });
    if (toSet === 'accordion') {
      panels.forEach(function(panel, key){
        var head = liHeads[key];
        head.appendChild(panel);
        panel.classList.add('accordion-content');
        panel.setAttribute('data-tab-content', '');
        panel.classList.remove('is-active');
        panel.style.height = '';
        head.classList.add('accordion-item');
        head.setAttribute('data-accordion-item', '');
        var link = liHeadsA[key];
        if (link) { link.classList.add('accordion-title'); }
      });
      // .after(placeholder).detach(): a marker div takes the tabs-content
      // container's place for the trip back to tabs. The 6.x form ran this
      // inside the loop, but the first detach left the later .after() calls
      // silent no-ops - one placeholder, once.
      var placeholder = document.createElement('div');
      placeholder.id = 'tabs-placeholder-' + elementId;
      panelsContainer.parentElement.insertBefore(placeholder, panelsContainer.nextSibling);
      panelsContainer.remove();
    } else if (toSet === 'tabs') {
      var tabsContent = document.querySelector(`[data-tabs-content=${elementId}]`);
      // A distinct name from the accordion branch's `placeholder`: two
      // function-scoped vars of the same name confused the binding context
      // (block-scoped-var).
      var tabsPlaceholder = document.getElementById('tabs-placeholder-' + elementId);
      if (tabsPlaceholder) {
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        tabsPlaceholder.parentElement.insertBefore(tabsContent, tabsPlaceholder.nextSibling);
        tabsContent.setAttribute('data-tabs-content', elementId);
        tabsPlaceholder.remove();
      } else {
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        this.$element.parentElement.insertBefore(tabsContent, this.$element.nextSibling);
        tabsContent.setAttribute('data-tabs-content', elementId);
      }
      panels.forEach(function(panel, key){
        var link = liHeadsA[key];
        tabsContent.appendChild(panel);
        panel.classList.add(tabsPanel);
        var hash = link.hash.slice(1);
        var id = panel.getAttribute('id') || GetYoDigits(6, 'accordion');
        if (hash !== id) {
          if (hash !== '') {
            panel.setAttribute('id', hash);
          } else {
            hash = id;
            panel.setAttribute('id', hash);
            link.setAttribute('href', link.getAttribute('href').replace('#','') + '#' + hash);
          }
        }
        var isActive = liHeads[key].classList.contains('is-active');
        if (isActive) {
          panel.classList.add('is-active');
        }
      });
      liHeads.forEach(li => li.classList.add(tabsTitle));
    }  }

  /**
   * Opens the plugin pane defined by `target`.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to open.
   * @see Accordion.down
   * @see Tabs.selectTab
   * @function
   */
  open() {
    if (this.currentRule && typeof this.currentRule.open === 'function') {
      return this.currentRule.open(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Closes the plugin pane defined by `target`. Not availaible for Tabs.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to close.
   * @see Accordion.up
   * @function
   */
  close() {
    if (this.currentRule && typeof this.currentRule.close === 'function') {
      return this.currentRule.close(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Toggles the plugin pane defined by `target`. Not availaible for Tabs.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to toggle.
   * @see Accordion.toggle
   * @function
   */
  toggle() {
    if (this.currentRule && typeof this.currentRule.toggle === 'function') {
      return this.currentRule.toggle(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  _destroy() {
    // The inner plugin cleans its own listeners/state (S8/S9 double-off
    // discipline); the wrapper only owns the mq seam listener (S13 flip).
    if (this.currentPlugin) this.currentPlugin.destroy();
    Events.off(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }
}

ResponsiveAccordionTabs.defaults = {};

// Add Foundation Utils to Foundation global namespace for backwards
// compatibility.
Foundation.rtl = rtl;
Foundation.GetYoDigits = GetYoDigits;
Foundation.transitionend = transitionend;
Foundation.RegExpEscape = RegExpEscape;
Foundation.onLoad = onLoad;

Foundation.Box = Box;
// 7.0 plan B: the Registry is the public instance-lookup surface (the
// $.fn.foundation dispatch is gone).
Foundation.Registry = Registry;
Foundation.onImagesLoaded = onImagesLoaded;
Foundation.Keyboard = Keyboard;
Foundation.MediaQuery = MediaQuery;
Foundation.Motion = Motion;
Foundation.Move = Move;
Foundation.Nest = Nest;
Foundation.Timer = Timer;
// S13: Touch gained an explicit native surface (addTouch, init), so it is
// exported on Foundation like the other utils.
Foundation.Touch = Touch;

// Touch and Triggers init are side-effect driven, just idempotent setup.
Touch.init();
Triggers.init(Foundation);
MediaQuery._init();

Foundation.plugin(Abide, 'Abide');
Foundation.plugin(Accordion, 'Accordion');
Foundation.plugin(AccordionMenu, 'AccordionMenu');
Foundation.plugin(Drilldown, 'Drilldown');
Foundation.plugin(Dropdown, 'Dropdown');
Foundation.plugin(DropdownMenu, 'DropdownMenu');
Foundation.plugin(Equalizer, 'Equalizer');
Foundation.plugin(Interchange, 'Interchange');
Foundation.plugin(Magellan, 'Magellan');
Foundation.plugin(OffCanvas, 'OffCanvas');
Foundation.plugin(Orbit, 'Orbit');
Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
Foundation.plugin(Reveal, 'Reveal');
Foundation.plugin(Slider, 'Slider');
Foundation.plugin(SmoothScroll, 'SmoothScroll');
Foundation.plugin(Sticky, 'Sticky');
Foundation.plugin(Tabs, 'Tabs');
Foundation.plugin(Toggler, 'Toggler');
Foundation.plugin(Tooltip, 'Tooltip');
Foundation.plugin(ResponsiveAccordionTabs, 'ResponsiveAccordionTabs');

export { Abide, Accordion, AccordionMenu, Box, Foundation as Core, foundation_core_utils as CoreUtils, Drilldown, Dropdown, DropdownMenu, Equalizer, Foundation, Interchange, Keyboard, Magellan, MediaQuery, Motion, Move, Nest, OffCanvas, Orbit, ResponsiveAccordionTabs, ResponsiveMenu, ResponsiveToggle, Reveal, Slider, SmoothScroll, Sticky, Tabs, Timer, Toggler, Tooltip, Touch, Triggers, Foundation as default, onImagesLoaded };
//# sourceMappingURL=foundation.es6.js.map
