(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.motion"), require("./foundation.util.triggers"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.motion", "./foundation.util.triggers", "./foundation.util.events", "./foundation.util.dom"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.motion"), require("./foundation.util.triggers"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.toggler"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.toggler.js":
/*!**********************************!*\
  !*** ./js/foundation.toggler.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Toggler: () => (/* binding */ Toggler)
/* harmony export */ });
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__);







/**
 * Toggler module.
 * @module foundation.toggler
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.events
 * @requires foundation.util.dom
 */

class Toggler extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.Plugin {
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
    this.options = Object.assign({}, Toggler.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.datasetOptions)(this.$element), options);
    this.className = '';
    this.className = 'Toggler'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__.Triggers.init();
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
      this._setTriggersExpanded(triggers, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.visible)(this.$element));
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
      const containsId = new RegExp(`\\b${(0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.RegExpEscape)(id)}\\b`).test(controls);
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));
  }

  /**
   * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
   * @function
   * @fires Toggler#on
   * @fires Toggler#off
   */
  toggle() {
    this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
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
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(element, 'on.zf.toggler');
    } else {
      /**
       * Fires if the target element does not have the class after a toggle.
       * @event Toggler#off
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(element, 'off.zf.toggler');
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
    if (!(0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.visible)(element)) {
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_0__.Motion.animateIn(this.$element, this.animationIn, function () {
        _this._updateARIA(true);
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(element, 'on.zf.toggler');
        _this._triggerMutate();
      });
    } else {
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_0__.Motion.animateOut(this.$element, this.animationOut, function () {
        _this._updateARIA(false);
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(element, 'off.zf.toggler');
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
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(mutated[i], 'mutateme.zf.trigger');
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(this.$element, '.zf.toggler');
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

/***/ }),

/***/ "./foundation.util.motion":
/*!********************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.motion"],"amd":"./foundation.util.motion","commonjs":"./foundation.util.motion","commonjs2":"./foundation.util.motion"} ***!
  \********************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__;

/***/ }),

/***/ "./foundation.util.triggers":
/*!****************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.triggers"],"amd":"./foundation.util.triggers","commonjs":"./foundation.util.triggers","commonjs2":"./foundation.util.triggers"} ***!
  \****************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__;

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
/*!**************************************************!*\
  !*** ./js/entries/plugins/foundation.toggler.js ***!
  \**************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Toggler: () => (/* reexport safe */ _foundation_toggler__WEBPACK_IMPORTED_MODULE_1__.Toggler)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_toggler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.toggler */ "./js/foundation.toggler.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_toggler__WEBPACK_IMPORTED_MODULE_1__.Toggler, 'Toggler');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.toggler.js.map