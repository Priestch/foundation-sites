(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.util.events"), require("./foundation.core"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.util.events", "./foundation.core"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.util.events"), require("./foundation.core"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.core"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_core__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.util.touch.js":
/*!*************************************!*\
  !*** ./js/foundation.util.touch.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Touch: () => (/* binding */ Touch)
/* harmony export */ });
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_0__);
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.trigger(touchTarget || document.body, 'tap', startEvent || e);
  }
  startEvent = null;
  isMoving = false;
  didMoved = false;
  touchTarget = null;
}
function onTouchMove(e) {
  if (true === Touch.spotSwipe.preventDefault) {
    e.preventDefault();
  }
  if (isMoving) {
    var x = e.touches[0].pageX;
    // var y = e.touches[0].pageY;
    var dx = startPosX - x;
    // var dy = startPosY - y;
    var dir;
    didMoved = true;
    elapsedTime = new Date().getTime() - startTime;
    if (Math.abs(dx) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
      dir = dx > 0 ? 'left' : 'right';
    }
    // else if(Math.abs(dy) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
    //   dir = dy > 0 ? 'down' : 'up';
    // }
    if (dir) {
      e.preventDefault();
      // the reset in onTouchEnd clears the module state; the swipe still
      // dispatches on the element the touch started on
      var swipeTarget = touchTarget;
      onTouchEnd.apply(this, arguments);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.trigger(swipeTarget, 'swipe', [e, dir]);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_0__.Events.trigger(swipeTarget, `swipe${dir}`, e);
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
    document.addEventListener('touchmove', onTouchMove, {
      passive: true === Touch.spotSwipe.preventDefault
    });
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
  if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
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

Touch.setupSpotSwipe = function () {
  Touch.spotSwipe = new SpotSwipe();
};

/****************************************************
 * Method for adding pseudo drag events to elements *
 ***************************************************/
Touch.setupTouchHandler = function () {
  // Native form of `$.fn.addTouch`: the feed replays touch input as mouse
  // events dispatched on the touch origin - real events, which reach the
  // native listeners directly and still-on-jQuery ones through the
  // real-event pass-through.
  Touch.addTouch = function (element) {
    if (!element || !element.addEventListener) {
      return;
    }
    element.addEventListener('touchstart', handleTouch, false);
    element.addEventListener('touchmove', handleTouch, false);
    element.addEventListener('touchend', handleTouch, false);
    element.addEventListener('touchcancel', handleTouch, false);
  };
};
Touch.init = function () {
  if (typeof Touch.spotSwipe === 'undefined') {
    Touch.setupSpotSwipe();
    Touch.setupTouchHandler();
    // One document-level touchstart arm, replacing the per-element
    // `$.event.special` setups: every tap/swipe below is dispatched on the
    // touched element and bubbles, so the ancestor bindings (body tap
    // handlers) hear it like the jQuery synthetic walk delivered them.
    document.addEventListener('touchstart', onTouchStart, {
      passive: true
    });
  }
};


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
/*!*****************************************************!*\
  !*** ./js/entries/plugins/foundation.util.touch.js ***!
  \*****************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_1__.Foundation),
/* harmony export */   Touch: () => (/* reexport safe */ _foundation_util_touch__WEBPACK_IMPORTED_MODULE_0__.Touch)
/* harmony export */ });
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../foundation.util.touch */ "./js/foundation.util.touch.js");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_1__);

_foundation_util_touch__WEBPACK_IMPORTED_MODULE_0__.Touch.init();
window.Foundation.Touch = _foundation_util_touch__WEBPACK_IMPORTED_MODULE_0__.Touch;


})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.touch.js.map