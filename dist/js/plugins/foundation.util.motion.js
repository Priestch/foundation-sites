(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.util.motion.js":
/*!**************************************!*\
  !*** ./js/foundation.util.motion.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Motion: () => (/* binding */ Motion),
/* harmony export */   Move: () => (/* binding */ Move)
/* harmony export */ });
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Motion module.
 * @module foundation.motion
 */

const initClasses = ['mui-enter', 'mui-leave'];
const activeClasses = ['mui-enter-active', 'mui-leave-active'];

// End-event names the animation completion listens for. Upstream motion-ui
// listens for the standard 'transitionend' only, while the 6.x inlined
// variant resolved a single name through a last-match-wins feature probe
// that ends on 'webkitTransitionEnd' in Chromium. Listening to both keeps
// completion working on every engine; `finish` runs at most once.
const endEvents = ['transitionend', 'webkitTransitionEnd'];
const Motion = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },
  animateOut: function (element, animation, cb) {
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
  slideUp: function (elements, duration, complete) {
    fxEach(elements, el => fxSlide('up', el, duration, complete));
  },
  slideDown: function (elements, duration, complete) {
    fxEach(elements, el => fxSlide('down', el, duration, complete));
  },
  fadeIn: function (elements, duration, complete) {
    fxEach(elements, el => fxFade('in', el, duration, complete));
  },
  fadeOut: function (elements, duration, complete) {
    fxEach(elements, el => fxFade('out', el, duration, complete));
  },
  animate: function (elements, props, duration, easing, complete) {
    fxEach(elements, el => fxAnimate(el, props, duration, easing, complete));
  },
  stop: function (elements, clearQueue, jumpToEnd) {
    fxEach(elements, el => fxStop(el, clearQueue, jumpToEnd));
  },
  // jQuery's `:animated` check: an element with a RUNNING fx animation
  // (queued-but-not-started ones do not count, like jQuery's timers).
  isAnimating: function (element) {
    const el = toElement(element);
    if (!el) {
      return false;
    }
    const st = fxTable.get(el);
    return !!(st && st.running);
  },
  finish: function (elements) {
    fxEach(elements, el => fxFinish(el));
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
  _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.trigger(toElement(elem), 'finished.zf.animate', [toElement(elem)]);
}
function Move(duration, elem, fn) {
  var anim,
    prog,
    start = null;
  if (duration === 0) {
    fn.apply(elem);
    fireFinished(elem);
    return;
  }
  function move(ts) {
    if (!start) start = ts;
    prog = ts - start;
    fn.apply(elem);
    if (prog < duration) {
      anim = window.requestAnimationFrame(move, elem);
    } else {
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
  endEvents.forEach(endEvent => _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.one(el, endEvent, finish));

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
    if (token) {
      target.classList.add(token);
    }
  }
  function removeClass(target) {
    for (var _len = arguments.length, tokens = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      tokens[_key - 1] = arguments[_key];
    }
    tokens.forEach(token => {
      if (token) {
        target.classList.remove(token);
      }
    });
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
  if (!obj) {
    return;
  }
  const list = obj.nodeType === undefined && obj.length !== undefined ? Array.from(obj) : [obj];
  list.forEach(fn);
}
function resolveFxEasing(easing) {
  if (typeof easing === 'function') {
    return easing;
  }
  if (easing === 'linear') {
    return p => p;
  }
  return p => 0.5 - Math.cos(p * Math.PI) / 2;
}

// getDefaultDisplay, jQuery shape: a detached probe of the same tag measured
// in the document, cached. Falls back to 'block' for display:none by UA
// stylesheet (e.g. <script>), which is what jQuery's own fallback did.
const defaultDisplayCache = {};
function defaultDisplay(tag) {
  if (defaultDisplayCache[tag]) {
    return defaultDisplayCache[tag];
  }
  const probe = document.createElement(tag);
  document.body.appendChild(probe);
  let display = window.getComputedStyle(probe).display;
  document.body.removeChild(probe);
  if (!display || display === 'none') {
    display = 'block';
  }
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
    st = {
      queue: [],
      running: null
    };
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
      if (anim.prepare) {
        anim.prepare();
      }
      paint(1);
      anim.finish();
    },
    finish() {
      st.running = null;
      anim.rafId = null;
      // jQuery called the complete with the element as `this`
      if (anim.complete) {
        anim.complete.call(el);
      }
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
      const step = function (ts) {
        if (anim.origin === null) {
          anim.origin = ts;
        }
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
  if (st.running || !st.queue.length) {
    return;
  }
  st.running = st.queue.shift();
  st.running.start();
}

// jQuery .stop([clearQueue][, jumpToEnd]): the running animation stops where
// it stands (jumpToEnd paints the end first), its complete fires only when
// jumping; clearQueue drops the pending ones.
function fxStop(el, clearQueue, jumpToEnd) {
  const st = fxState(el);
  if (st.queue.length && clearQueue) {
    st.queue.length = 0;
  }
  const anim = st.running;
  if (!anim) {
    return;
  }
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
  pending.forEach(function (anim) {
    if (st.queue.indexOf(anim) === -1) {
      anim.jump();
    }
  });
}

// Page-scroll tween target: html/body scrollTop goes through the viewport.
function isScrollRoot(el) {
  return el === document.documentElement || el === document.body;
}
function fxAnimate(el, props, duration, easing, complete) {
  el = toElement(el);
  const entries = Object.keys(props).map(key => {
    const camel = key === 'scrolltop' ? 'scrollTop' : key.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    const to = Number(props[key]);
    const from = camel === 'scrollTop' ? isScrollRoot(el) ? window.pageYOffset : el.scrollTop : parseFloat(window.getComputedStyle(el)[camel]);
    return {
      camel,
      from,
      to
    };
  });
  const paint = function (p) {
    entries.forEach(entry => {
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
  SLIDE_PROPS.forEach(prop => {
    values[prop] = parseFloat(cs[prop]);
    if (isNaN(values[prop])) {
      values[prop] = prop === 'opacity' ? 1 : 0;
    }
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
  SLIDE_PROPS.forEach(prop => {
    el.style[prop] = '';
  });
  el.style.overflow = overflowInline || '';
}
function fxSlide(direction, element, duration, complete) {
  const el = toElement(element);
  if (!el || !el.isConnected) {
    // jQuery animations on detached elements measured 0 and completed; the
    // call sites never pass one, complete keeps firing for queue order.
    enqueueFx(el, 0, null, null, function () {}, complete);
    return;
  }
  const overflowInline = el.style.overflow;
  // jQuery evaluated the hidden/visible branch when the animation STARTED,
  // not when it was enqueued - a queued slideUp hides the element a later
  // slideDown was enqueued against. prepare() is that start point.
  let mode; // 'up' | 'down' | 'noop'
  let from, to;
  const prepare = function () {
    const hidden = window.getComputedStyle(el).display === 'none';
    if (direction === 'down') {
      mode = hidden ? 'down' : 'noop';
      if (mode === 'noop') {
        return true;
      }
      if (mode === 'down') {
        el.style.display = savedDisplay.get(el) || defaultDisplay(el.tagName);
        el.style.overflow = 'hidden';
        clearSlideInline(el, overflowInline);
        to = measureSlide(el);
        from = Object.assign({}, to, {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: 0,
          marginBottom: 0,
          opacity: 0
        });
      }
    } else {
      mode = hidden ? 'noop' : 'up';
      if (mode === 'noop') {
        return true;
      }
      from = measureSlide(el);
      el.style.overflow = 'hidden';
    }
  };
  const paint = function (p) {
    if (mode === 'noop') {
      return;
    }
    const values = {};
    SLIDE_PROPS.forEach(prop => {
      if (mode === 'up') {
        values[prop] = from[prop] * (1 - p);
      } else {
        values[prop] = from[prop] + (to[prop] - from[prop]) * p;
      }
    });
    paintSlide(el, values);
  };
  const done = function () {
    if (mode === 'noop') {
      // animating toward the current state: nothing touched, complete still
      // fires (jQuery ran and completed the animation).
      if (complete) {
        complete();
      }
      return;
    }
    if (mode === 'up') {
      savedDisplay.set(el, el.style.display);
      el.style.display = 'none';
    }
    clearSlideInline(el, overflowInline);
    if (complete) {
      complete();
    }
  };
  enqueueFx(el, duration, null, prepare, paint, done);
}
function fxFade(direction, element, duration, complete) {
  const el = toElement(element);
  if (!el || !el.isConnected) {
    enqueueFx(el, 0, null, null, function () {}, complete);
    return;
  }
  let mode; // 'in' | 'out' | 'noop'
  let from, to;
  const prepare = function () {
    const hidden = window.getComputedStyle(el).display === 'none';
    if (direction === 'in') {
      mode = hidden ? 'in' : 'noop';
      if (mode === 'noop') {
        return true;
      }
      if (mode === 'in') {
        el.style.display = savedDisplay.get(el) || defaultDisplay(el.tagName);
        const inlineOpacity = el.style.opacity;
        from = 0;
        to = inlineOpacity !== '' ? parseFloat(inlineOpacity) : 1;
      }
    } else {
      mode = hidden ? 'noop' : 'out';
      if (mode === 'noop') {
        return true;
      }
      from = parseFloat(window.getComputedStyle(el).opacity);
      if (isNaN(from)) {
        from = 1;
      }
      to = 0;
    }
  };
  const paint = function (p) {
    if (mode === 'noop') {
      return;
    }
    el.style.opacity = from + (to - from) * p;
  };
  const done = function () {
    if (mode === 'noop') {
      if (complete) {
        complete();
      }
      return;
    }
    if (mode === 'out') {
      savedDisplay.set(el, el.style.display);
      el.style.display = 'none';
    }
    el.style.opacity = '';
    if (complete) {
      complete();
    }
  };
  enqueueFx(el, duration, null, prepare, paint, done);
}


/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.util.events":
/*!********************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.events"],"amd":"./foundation.util.events","commonjs":"./foundation.util.events","commonjs2":"./foundation.util.events"} ***!
  \********************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_events__;

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
  !*** ./js/entries/plugins/foundation.util.motion.js ***!
  \******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Motion: () => (/* reexport safe */ _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion),
/* harmony export */   Move: () => (/* reexport safe */ _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Move)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.util.motion */ "./js/foundation.util.motion.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Motion = _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion;
_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Move = _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Move;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.motion.js.map