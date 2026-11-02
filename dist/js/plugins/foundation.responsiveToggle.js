(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.motion"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.mediaQuery", "./foundation.util.motion", "./foundation.util.events", "./foundation.util.dom"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.motion"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.responsiveToggle"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.responsiveToggle.js":
/*!*******************************************!*\
  !*** ./js/foundation.responsiveToggle.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ResponsiveToggle: () => (/* binding */ ResponsiveToggle)
/* harmony export */ });
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__);






/**
 * ResponsiveToggle module.
 * @module foundation.responsiveToggle
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.motion
 */

class ResponsiveToggle extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_2__.Plugin {
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
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.deepMerge)({}, ResponsiveToggle.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.datasetOptions)(this.$element), options);
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
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery._init();
    var targetID = this.options.responsiveToggle;
    if (!targetID) {
      console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
    }

    // A missing target stays a null element (the 6.x $(null) tolerance;
    // the show/hide helpers below guard for it).
    this.$targetMenu = document.getElementById(targetID);
    this.$toggler = Array.from(this.$element.querySelectorAll('[data-toggle]')).filter(function (el) {
      var target = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.datasetOptions)(el).toggle;
      return target === targetID || target === "";
    });
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.deepMerge)({}, this.options, this.$targetMenu ? (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.datasetOptions)(this.$targetMenu) : {});

    // If they were set, parse the animation classes
    if (this.options.animate) {
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(window, 'changed.zf.mediaquery', this._updateMqHandler);

    // The toggler clicks are real browser events: they register on the
    // native event layer, on every element of the filtered collection like
    // jQuery's collection-wide .on() did.
    this._toggleMenuHandler = this.toggleMenu.bind(this);
    this.$toggler.forEach(el => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(el, 'click.zf.responsiveToggle', this._toggleMenuHandler);
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
    if (!element) {
      return;
    }
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
    if (!element) {
      return;
    }
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
    if (!_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery.atLeast(this.options.hideFor)) {
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
    if (!_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery.atLeast(this.options.hideFor)) {
      var targetMenu = this.$targetMenu;

      /**
       * Fires when the element attached to the tab bar toggles.
       * @event ResponsiveToggle#toggled
       */
      if (this.options.animate) {
        // `:hidden` replacement: Dom's visible() carries the narrow
        // display-based semantics decided for the 7.0 line (S3). An empty
        // target counts as shown, like jQuery's `.is(':hidden')` did.
        var menuHidden = targetMenu ? !(0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.visible)(targetMenu) : false;
        if (menuHidden) {
          _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion.animateIn(this.$targetMenu, this.animationIn, () => {
            _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
            // S10 group flip: the animated half of the mutateme forwarding
            // joins the native event layer. It keeps the 6.x triggerHandler
            // form - element-local and non-bubbling, the Triggers
            // dispatchLocal ruling (a bubbling dispatch would over-deliver
            // to ancestor listeners) - and the last jQuery-side consumers
            // (Equalizer, Drilldown, Sticky) flip in the same commit.
            var mutated = targetMenu.querySelectorAll('[data-mutate]');
            for (var i = 0; i < mutated.length; i++) {
              _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.triggerHandler(mutated[i], 'mutateme.zf.trigger');
            }
          });
        } else {
          _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion.animateOut(this.$targetMenu, this.animationOut, () => {
            _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
          });
        }
      } else {
        // The 6.x `.toggle(0)` display flip, without the legacy fx tween
        // (a size/opacity "grow" that completed asynchronously; the display
        // and event contracts never depended on it - same ruling as the S6
        // Reveal showDelay tween). The synchronous order below is kept:
        // display flip, mutateme, toggled.
        if (targetMenu) {
          if ((0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_4__.visible)(targetMenu)) {
            this._hide(targetMenu);
          } else {
            this._show(targetMenu);
          }
          var mutated = targetMenu.querySelectorAll('[data-mutate]');
          for (var i = 0; i < mutated.length; i++) {
            // Bubbling production on the native event layer; the still-on-
            // jQuery consumers receive the real event pass-through.
            _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(mutated[i], 'mutateme.zf.trigger');
          }
        }
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'toggled.zf.responsiveToggle');
      }
    }
  }
  _destroy() {
    // The mq consumer (S13 flip) and the toggler click listeners, by bare
    // namespace.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(window, 'changed.zf.mediaquery', this._updateMqHandler);
    this.$toggler.forEach(el => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(el, '.zf.responsiveToggle');
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

/***/ "./foundation.util.mediaQuery":
/*!************************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.mediaQuery"],"amd":"./foundation.util.mediaQuery","commonjs":"./foundation.util.mediaQuery","commonjs2":"./foundation.util.mediaQuery"} ***!
  \************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__;

/***/ }),

/***/ "./foundation.util.motion":
/*!********************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.motion"],"amd":"./foundation.util.motion","commonjs":"./foundation.util.motion","commonjs2":"./foundation.util.motion"} ***!
  \********************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__;

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
/*!***********************************************************!*\
  !*** ./js/entries/plugins/foundation.responsiveToggle.js ***!
  \***********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   ResponsiveToggle: () => (/* reexport safe */ _foundation_responsiveToggle__WEBPACK_IMPORTED_MODULE_1__.ResponsiveToggle)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_responsiveToggle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.responsiveToggle */ "./js/foundation.responsiveToggle.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_responsiveToggle__WEBPACK_IMPORTED_MODULE_1__.ResponsiveToggle, 'ResponsiveToggle');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.responsiveToggle.js.map