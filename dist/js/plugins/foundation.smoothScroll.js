(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.smoothScroll"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.smoothScroll.js":
/*!***************************************!*\
  !*** ./js/foundation.smoothScroll.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SmoothScroll: () => (/* binding */ SmoothScroll)
/* harmony export */ });
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);





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
  if (typeof easing === 'function') {
    return easing;
  }
  if (easing === 'linear') {
    return p => p;
  }
  // jQuery's `_default` easing: unknown names animate as 'swing'
  return p => 0.5 - Math.cos(p * Math.PI) / 2;
}
function animateScroll(scrollPos, options, callback) {
  const start = window.pageYOffset;
  const delta = scrollPos - start;
  const duration = options.animationDuration;
  const easing = resolveEasing(options.animationEasing);
  stopActiveScroll();
  if (duration === 0) {
    window.scrollTo(0, scrollPos);
    if (typeof callback === 'function') {
      callback();
    }
    return;
  }
  let origin = null;
  function step(ts) {
    if (origin === null) {
      origin = ts;
    }
    const progress = Math.min((ts - origin) / duration, 1);
    window.scrollTo(0, Math.round(start + delta * easing(progress)));
    if (progress < 1) {
      activeScroll = window.requestAnimationFrame(step);
    } else {
      activeScroll = null;
      if (typeof callback === 'function') {
        callback();
      }
    }
  }
  activeScroll = window.requestAnimationFrame(step);
}
class SmoothScroll extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.Plugin {
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
    this.options = Object.assign({}, SmoothScroll.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.className = 'SmoothScroll'; // ie9 back compat

    this._init();
  }

  /**
   * Initialize the SmoothScroll plugin
   * @private
   */
  _init() {
    const element = this.$element;
    const id = element.id || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'smooth-scroll');
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
    this._linkClickListener = function (e) {
      _this._handleLinkClick(e, e.currentTarget);
    };
    this._delegatedClickListener = function (e) {
      _this._handleLinkClick(e, this);
    };
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(element, 'click.zf.smoothScroll', this._linkClickListener);
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.delegate(element, 'click.zf.smoothScroll', 'a[href^="#"]', this._delegatedClickListener);
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
  }
  /**
   * Function to scroll to a given location on the page.
   * @param {String} loc - A properly formatted jQuery id selector. Example: '#foo'
   * @param {Object} options - The options to use.
   * @param {Function} callback - The callback function.
   * @static
   * @function
   */
  static scrollToLoc(loc) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SmoothScroll.defaults;
    let callback = arguments.length > 2 ? arguments[2] : undefined;
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, '.zf.smoothScroll');
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


/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.util.dom":
/*!********************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.dom"],"amd":"./foundation.util.dom","commonjs":"./foundation.util.dom","commonjs2":"./foundation.util.dom"} ***!
  \********************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__;

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
/*!*******************************************************!*\
  !*** ./js/entries/plugins/foundation.smoothScroll.js ***!
  \*******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   SmoothScroll: () => (/* reexport safe */ _foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_1__.SmoothScroll)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.smoothScroll */ "./js/foundation.smoothScroll.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_1__.SmoothScroll, 'SmoothScroll');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.smoothScroll.js.map