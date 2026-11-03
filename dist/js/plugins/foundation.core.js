(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory();
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.core"] = factory();
})(globalThis, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.core.js":
/*!*******************************!*\
  !*** ./js/foundation.core.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* binding */ Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./js/foundation.core.utils.js");
/* harmony import */ var _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.registry */ "./js/foundation.util.registry.js");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.events */ "./js/foundation.util.events.js");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./js/foundation.util.mediaQuery.js");




var FOUNDATION_VERSION = '7.0.0-beta.1';

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
  plugin: function (plugin, name) {
    // Object key to use when adding to global Foundation object
    // Examples: Foundation.Reveal, Foundation.OffCanvas
    var className = name || functionName(plugin);
    // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
    // Examples: data-reveal, data-off-canvas
    var attrName = hyphenate(className);

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
  registerPlugin: function (plugin, name) {
    var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
    plugin.uuid = (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, pluginName);

    // 7.0 terminal form: the element write, the Registry entry and the
    // real, bubbling init event (the Plugin base class does the same).
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    if (!el.getAttribute(`data-${pluginName}`)) {
      el.setAttribute(`data-${pluginName}`, plugin.uuid);
    }
    if (el && !_foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.has(el)) {
      _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.setInstance(el, plugin);
    }
    /**
     * Fires when the plugin has initialized.
     * @event Plugin#init
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(el, `init.zf.${pluginName}`);
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
  unregisterPlugin: function (plugin) {
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    var pluginName = hyphenate(functionName(_foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.getInstance(el).constructor));
    this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
    el.removeAttribute(`data-${pluginName}`);
    _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.removeInstance(el);
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(el, `destroyed.zf.${pluginName}`);
    for (var prop in plugin) {
      if (typeof plugin[prop] === 'function') {
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
  reInit: function (plugins) {
    // 7.0 terminal form: an element (or a collection, legacy shape) holds
    // the instance to re-init; strings name plugin classes to sweep.
    var isElement = typeof Element !== 'undefined' && plugins instanceof Element;
    var isCollection = !isElement && plugins && plugins.nodeType === undefined && plugins.length !== undefined && typeof plugins !== 'string';
    try {
      if (isElement || isCollection) {
        var elements = isElement ? [plugins] : Array.from(plugins);
        elements.forEach(function (el) {
          var instance = _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.getInstance(el);
          if (instance) {
            instance._init();
          }
        });
      } else {
        var type = typeof plugins,
          _this = this;
        var reInitByName = function (name) {
          document.querySelectorAll('[data-' + name + ']').forEach(function (el) {
            var instance = _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.getInstance(el);
            if (instance) {
              instance._init();
            }
          });
        };
        if (type === 'object' && plugins && plugins.forEach) {
          plugins.forEach(function (p) {
            reInitByName(hyphenate(p));
          });
        } else if (type === 'string') {
          reInitByName(hyphenate(plugins));
        } else {
          Object.keys(_this._plugins).forEach(reInitByName);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      return plugins;
    }
  },
  /**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Element|Document|String|Object} elem - native element or document to scan, a selector string, or (legacy, mixed state) a jQuery object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
  reflow: function (elem, plugins) {
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
    plugins.forEach(function (name) {
      // Get the current plugin
      var plugin = _this._plugins[name];

      // Localize the search to all elements inside elem, as well as elem itself
      var candidates;
      if (rootEls === null) {
        candidates = Array.from(document.querySelectorAll('[data-' + name + ']'));
      } else {
        candidates = [];
        rootEls.forEach(function (rootEl) {
          candidates.push(...Array.from(rootEl.querySelectorAll('[data-' + name + ']')));
          if (rootEl.matches('[data-' + name + ']')) {
            candidates.push(rootEl);
          }
        });
      }
      var unregistered = candidates.filter(function (el) {
        return typeof _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.getInstance(el) === 'undefined';
      });

      // For each plugin found, initialize it
      unregistered.forEach(function (el) {
        var opts = {
          reflow: true
        };
        if (el.getAttribute('data-options')) {
          el.getAttribute('data-options').split(';').forEach(function (option) {
            var opt = option.split(':').map(function (part) {
              return part.trim();
            });
            if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
          });
        }
        try {
          _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.setInstance(el, new plugin(el, opts));
        } catch (er) {
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
  init: function (root) {
    root = root || document;
    document.querySelectorAll('.no-js').forEach(function (el) {
      el.classList.remove('no-js');
    });
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__.MediaQuery._init();
    Foundation.reflow(root);
    return root;
  }
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
      var context = this,
        args = arguments;
      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
};

// 7.0: assign the browser global only when one exists — requiring the
// package under Node (SSR prerender, tests) must not crash; Foundation
// itself is inert until Foundation.init() runs against a real DOM.
if (typeof window !== 'undefined') {
  window.Foundation = Foundation;
}

// Polyfill to get the name of a function in IE9
function functionName(fn) {
  if (typeof Function.prototype.name === 'undefined') {
    var funcNameRegex = /function\s([^(]{1,})\(/;
    var results = funcNameRegex.exec(fn.toString());
    return results && results.length > 1 ? results[1].trim() : "";
  } else if (typeof fn.prototype === 'undefined') {
    return fn.constructor.name;
  } else {
    return fn.prototype.constructor.name;
  }
}
function parseValue(str) {
  if ('true' === str) return true;else if ('false' === str) return false;else if (!isNaN(str * 1)) return parseFloat(str);
  return str;
}
// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}


/***/ }),

/***/ "./js/foundation.core.plugin.js":
/*!**************************************!*\
  !*** ./js/foundation.core.plugin.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Plugin: () => (/* binding */ Plugin)
/* harmony export */ });
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./js/foundation.core.utils.js");
/* harmony import */ var _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.registry */ "./js/foundation.util.registry.js");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.events */ "./js/foundation.util.events.js");




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
    this.uuid = (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, pluginName);
    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    if (!el.getAttribute(`data-${pluginName}`)) {
      el.setAttribute(`data-${pluginName}`, this.uuid);
    }
    if (el && !_foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.has(el)) {
      _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.setInstance(el, this);
    }
    /**
     * Fires when the plugin has initialized.
     * @event Plugin#init
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(el, `init.zf.${pluginName}`);
  }
  destroy() {
    this._destroy();
    var pluginName = getPluginName(this);
    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    el.removeAttribute(`data-${pluginName}`);
    if (el) {
      _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry.removeInstance(el);
    }
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(el, `destroyed.zf.${pluginName}`);
    for (var prop in this) {
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


/***/ }),

/***/ "./js/foundation.core.utils.js":
/*!*************************************!*\
  !*** ./js/foundation.core.utils.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetYoDigits: () => (/* binding */ GetYoDigits),
/* harmony export */   RegExpEscape: () => (/* binding */ RegExpEscape),
/* harmony export */   ignoreMousedisappear: () => (/* binding */ ignoreMousedisappear),
/* harmony export */   onLoad: () => (/* binding */ onLoad),
/* harmony export */   rtl: () => (/* binding */ rtl),
/* harmony export */   transitionend: () => (/* binding */ transitionend)
/* harmony export */ });
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.events */ "./js/foundation.util.events.js");


// Core Foundation Utilities, utilized in a number of places.

// Accepts both the jQuery objects un-migrated callers still pass and plain
// elements, so the helper survives the line-A migration unchanged.
function toElement(obj) {
  // window is array-like too - window[0] is the first frame's Window, and
  // unwrapping it hands back a (possibly cross-origin) iframe window that
  // throws on the next property read. Every onLoad(window, ...) call on a
  // page that already contains an iframe hit this.
  if (obj === window) {
    return obj;
  }
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
function GetYoDigits() {
  let length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
  let namespace = arguments.length > 1 ? arguments[1] : undefined;
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
function RegExpEscape(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
function transitionend($elem) {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = document.createElement('div'),
    end;
  for (let transition in transitions) {
    if (typeof elem.style[transition] !== 'undefined') {
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
    let el = toElement($elem);
    setTimeout(function () {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.triggerHandler(el, 'transitionend', [el]);
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
    const el = toElement($elem);
    // Local, native-only dispatch: the handler is registered right below on
    // the native layer, and a real echoed 'load' on window would re-notify
    // third-party window-load listeners.
    const cb = () => _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.triggerHandler(el, eventType);
    if (handler) _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.one(el, eventType, handler);
    if (didLoad) setTimeout(cb);else _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.one(window, 'load', cb);
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
function ignoreMousedisappear(handler) {
  let {
    ignoreLeaveWindow = false,
    ignoreReappear = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function leaveEventHandler(eLeave) {
    for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }
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
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.one(document, 'mouseenter', function reenterEventHandler(eReenter) {
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


/***/ }),

/***/ "./js/foundation.util.events.js":
/*!**************************************!*\
  !*** ./js/foundation.util.events.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Events: () => (/* binding */ Events)
/* harmony export */ });
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
  return {
    type: parts.shift(),
    ns: new Set(parts)
  };
}

// The jQuery fire/remove rule: a handler matches when its namespace set
// contains every namespace of the queried event ("contains all"). An empty
// query namespace matches everything (plain trigger fires namespaced handlers
// too), while a namespaced trigger does NOT fire unnamespaced handlers.
function nsMatch(queryNs, handlerNs) {
  if (queryNs.size === 0) {
    return true;
  }
  const names = Array.from(queryNs);
  return names.every(name => handlerNs.has(name));
}
function nsString(ns) {
  return Array.from(ns).sort().join('.');
}
function getBucket(el, type, create) {
  let byType = listenerTable.get(el);
  if (!byType) {
    if (!create) {
      return null;
    }
    byType = new Map();
    listenerTable.set(el, byType);
  }
  let bucket = byType.get(type);
  if (!bucket && create) {
    bucket = {
      recs: [],
      dispatcher: null
    };
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
  if (!bucket || !bucket.dispatcher) {
    return;
  }
  el.removeEventListener(type, bucket.dispatcher);
  const byType = listenerTable.get(el);
  if (!byType) {
    return;
  }
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
      if (typeof original === 'function') {
        original.call(event);
      }
    };
    event.zfImmediateStopped = function () {
      return stopped;
    };
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
    if (immediateStopped()) {
      break;
    }
    const rec = queue[i];
    if (!nsMatch(queryNs, rec.ns)) {
      continue;
    }
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
      if (at > -1) {
        recs.splice(at, 1);
      }
      if (recs.length === 0) {
        const bucket = getBucket(el, rec.type);
        if (bucket) {
          removeBucket(el, rec.type, bucket);
        }
      }
    }
  }
  return result;
}
function makeRec(el, type, ns, fn, options) {
  const rec = {
    type,
    ns,
    fn,
    once: !!(options && options.once),
    invoke: null
  };
  if (options && options.selector) {
    // Delegated: `this` inside the handler is the closest element matching
    // the selector, searched upward from the event target but never escaping
    // the delegation root (jQuery's delegate walk).
    rec.invoke = function (event, args) {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') {
        return undefined;
      }
      const match = target.closest(options.selector);
      if (!match || match !== el && !el.contains(match)) {
        return undefined;
      }
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
    if (!bucket.dispatcher) {
      installDispatcher(el, parsed.type, bucket);
    }
    bucket.recs.push(makeRec(el, parsed.type, parsed.ns, fn));
  });
  return el;
}
function one(el, types, fn) {
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    const bucket = getBucket(el, parsed.type, true);
    if (!bucket.dispatcher) {
      installDispatcher(el, parsed.type, bucket);
    }
    bucket.recs.push(makeRec(el, parsed.type, parsed.ns, fn, {
      once: true
    }));
  });
  return el;
}

// Delegated listener on a root (typically the document), covering the
// `[data-toggle]` document-level delegation of the Triggers util.
function delegate(root, types, selector, fn) {
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    const bucket = getBucket(root, parsed.type, true);
    if (!bucket.dispatcher) {
      installDispatcher(root, parsed.type, bucket);
    }
    bucket.recs.push(makeRec(root, parsed.type, parsed.ns, fn, {
      selector
    }));
  });
  return root;
}
function off(el, types, fn) {
  const byType = listenerTable.get(el);
  if (!byType) {
    return el;
  }
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
  if (!bucket) {
    return;
  }
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
  const args = params == null ? [] : Array.isArray(params) ? params : [params];
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    if (!parsed.type) {
      return;
    }
    const event = new CustomEvent(parsed.type, {
      bubbles: true,
      cancelable: true,
      detail: args
    });
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
        if (nativeEcho === parsed.type) {
          nativeEcho = null;
        }
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
  const args = params == null ? [] : Array.isArray(params) ? params : [params];
  let result;
  splitTypes(types).forEach(namespaced => {
    const parsed = parseType(namespaced);
    if (!parsed.type) {
      return;
    }
    // A real NON-BUBBLING event: jQuery's triggerHandler was local to its
    // single shared table; the native world carries one Events table per
    // bundle (foundation.js beside foundation-next.js), so the shared
    // transport between them is the DOM itself. Same-element listeners on
    // every table hear it, ancestors and other elements do not - the rest
    // of the jQuery semantics (no bubbling, no native-method shortcut,
    // handler `false` still prevents the default).
    const event = new CustomEvent(parsed.type, {
      bubbles: false,
      cancelable: true,
      detail: args
    });
    event.namespace = nsString(parsed.ns);
    el.dispatchEvent(event);
    result = event.zfResult;
  });
  return result;
}
const Events = {
  on,
  one,
  off,
  delegate,
  trigger,
  triggerHandler
};


/***/ }),

/***/ "./js/foundation.util.mediaQuery.js":
/*!******************************************!*\
  !*** ./js/foundation.util.mediaQuery.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MediaQuery: () => (/* binding */ MediaQuery)
/* harmony export */ });
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.events */ "./js/foundation.util.events.js");


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
      if (namedQueries.hasOwnProperty(key)) {
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
      if (this.queries.hasOwnProperty(i)) {
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
    const queryIndex = this.queries.findIndex(q => this._getQueryName(q) === size);
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
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name;
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.on(window, 'resize.zf.mediaquery', () => {
      var newSize = this._getCurrentSize(),
        currentSize = this.current;
      if (newSize !== currentSize) {
        // Change the current media query
        this.current = newSize;

        // Broadcast the media query change on the window as a real,
        // bubbling event: native consumers receive it directly and
        // still-jQuery consumers keep hearing it through the real-event
        // pass-through, with the new and former breakpoint names on the
        // event detail (jQuery hands them out as the handler arguments
        // 2/3, exactly where the 6.x synthetic trigger put them).
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.trigger(window, 'changed.zf.mediaquery', [newSize, currentSize]);
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
  styleObject = str.split('&').reduce(function (ret, param) {
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


/***/ }),

/***/ "./js/foundation.util.registry.js":
/*!****************************************!*\
  !*** ./js/foundation.util.registry.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Registry: () => (/* binding */ Registry)
/* harmony export */ });
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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************************************!*\
  !*** ./js/entries/plugins/foundation.core.js ***!
  \***********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   GetYoDigits: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.GetYoDigits),
/* harmony export */   Plugin: () => (/* reexport safe */ _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.Plugin),
/* harmony export */   RegExpEscape: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.RegExpEscape),
/* harmony export */   ignoreMousedisappear: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.ignoreMousedisappear),
/* harmony export */   onLoad: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.onLoad),
/* harmony export */   rtl: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.rtl),
/* harmony export */   transitionend: () => (/* reexport safe */ _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.transitionend)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../foundation.core */ "./js/foundation.core.js");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.core.plugin */ "./js/foundation.core.plugin.js");
/* harmony import */ var _foundation_util_registry__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../foundation.util.registry */ "./js/foundation.util.registry.js");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../foundation.core.utils */ "./js/foundation.core.utils.js");
// --- Foundation Core API ---
// Initialize Foundation and add some utilities to its public API for backward compatibility.
// Please note that every utility do not have to be added to the core API.





// Every plugin depends on plugin now, we can include that on the core for the
// script inclusion path.
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Plugin = _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.Plugin;
// 7.0 plan B: the Registry is the public instance-lookup surface (the
// $.fn.foundation dispatch is gone).
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Registry = _foundation_util_registry__WEBPACK_IMPORTED_MODULE_2__.Registry;

// These are now separated out, but historically were a part of this module,
// and since this is here for backwards compatibility we include them in
// this entry.
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.rtl = _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.rtl;
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.GetYoDigits = _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.GetYoDigits;
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.transitionend = _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.transitionend;
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.RegExpEscape = _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.RegExpEscape;
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.onLoad = _foundation_core_utils__WEBPACK_IMPORTED_MODULE_3__.onLoad;
window.Foundation = _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation;

// --- Foundation Core exports ---
// Export "Plugin" and all core utilities, since the `foundation.core` entry plays the role of
// all core source files.




})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.core.js.map