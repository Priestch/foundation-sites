(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
/*!******************************************************!*\
  !*** ./js/entries/plugins/foundation.util.events.js ***!
  \******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Events: () => (/* reexport safe */ _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.util.events */ "./js/foundation.util.events.js");



})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.events.js.map