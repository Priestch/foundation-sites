(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.smoothScroll"), require("./foundation.util.triggers"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom", "./foundation.smoothScroll", "./foundation.util.triggers"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.smoothScroll"), require("./foundation.util.triggers"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.magellan"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.smoothScroll"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_smoothScroll__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.magellan.js":
/*!***********************************!*\
  !*** ./js/foundation.magellan.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Magellan: () => (/* binding */ Magellan)
/* harmony export */ });
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.smoothScroll */ "./foundation.smoothScroll");
/* harmony import */ var _foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__);







/**
 * Magellan module.
 * @module foundation.magellan
 * @requires foundation.smoothScroll
 * @requires foundation.util.triggers
 */

class Magellan extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
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
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.deepMerge)({}, Magellan.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.className = 'Magellan'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__.Triggers.init();
    this._init();
    this.calcPoints();
  }

  /**
   * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  _init() {
    var element = this.$element;
    var id = element.id || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'magellan');
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
  // The link list is not frozen at _setup: arm() re-reads it (late scripts
  // build nav lists), and the re-read is exposed as a method so the contract
  // itself is pinnable.
  _readLinks() {
    this.links = Array.from(this.$element.querySelectorAll('a'));
  }
  calcPoints() {
    var _this = this,
      body = document.body,
      html = document.documentElement;
    this.points = [];
    this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
    this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));
    this.targets.forEach(function (tar) {
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
      if (!_this.$element) {
        return;
      }
      if (_this.options.deepLinking) {
        if (location.hash) {
          _this.scrollToLoc(location.hash);
        }
      }
      // Re-read the links: DOMContentLoaded runs after every synchronous
      // page script, so nav lists a late script builds (the docs sidebar's
      // generated subnav) are present now but were not at _setup time.
      _this._readLinks();
      _this.calcPoints();
      _this._updateActive();
      // S7: the resizeme/scrollme consumers flip to the native event layer.
      // Both producers in the Triggers util have dispatched real element-
      // local events since S4, so this seam closes on the consumer half
      // alone; the delegated link clicks join them on the same layer.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(_this.$element, 'resizeme.zf.trigger', _this.reflow.bind(_this));
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(_this.$element, 'scrollme.zf.trigger', _this._updateActive.bind(_this));
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.delegate(_this.$element, 'click.zf.magellan', 'a[href^="#"]', function (e) {
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
    this.onLoadListener = (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.onLoad)(window, function () {
      if (!_this.$element) {
        return;
      }
      _this.calcPoints();
      _this._updateActive();
    });
    this._deepLinkScroll = function () {
      if (_this.options.deepLinking) {
        _this.scrollToLoc(window.location.hash);
      }
    };

    // S7: the deep-link hashchange moves to the native event layer under the
    // per-instance namespace shape introduced for Reveal's hashchange, so
    // the destroy path can drop it precisely. Real hashchange events are
    // unaffected by the namespace.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, `hashchange.zf.magellan:${this.id}`, this._deepLinkScroll);
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
    _foundation_smoothScroll__WEBPACK_IMPORTED_MODULE_3__.SmoothScroll.scrollToLoc(loc, options, function () {
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
  _updateActive(/*event, elem, scrollPos*/
  ) {
    if (this._inTransition) return;
    const newScrollPos = parseInt(window.pageYOffset, 10);
    const isScrollingUp = this.scrollPos > newScrollPos;
    this.scrollPos = newScrollPos;
    let activeIdx;
    // Before the first point: no link
    if (newScrollPos < this.points[0] - this.options.offset - (isScrollingUp ? this.options.threshold : 0)) {/* do nothing */}
    // At the bottom of the page: last link
    else if (newScrollPos + this.winHeight === this.docHeight) {
      activeIdx = this.points.length - 1;
    }
    // Otherwhise, use the last visible link
    else {
      const visibleLinks = this.points.filter(p => {
        return p - this.options.offset - (isScrollingUp ? this.options.threshold : 0) <= newScrollPos;
      });
      activeIdx = visibleLinks.length ? visibleLinks.length - 1 : 0;
    }

    // Get the new active link
    const oldActive = this.active;
    let activeHash = '';
    if (typeof activeIdx !== 'undefined') {
      // 6.x filtered $links by [href="#<target>"]; the data read is the raw
      // attribute (jQuery's .data would convert numbers, the attribute
      // values here are ids)
      const targetName = this.targets[activeIdx] ? this.targets[activeIdx].getAttribute('data-magellan-target') : null;
      this.active = targetName === null ? [] : this.links.filter(function (link) {
        return link.getAttribute('href') === '#' + targetName;
      });
      if (this.active.length) activeHash = this.active[0].getAttribute('href');
    } else {
      this.active = [];
    }
    // jQuery's .is() between collections: any overlap counts as same
    const overlaps = this.active.some(function (el) {
      return oldActive.indexOf(el) !== -1;
    });
    const isNewActive = !(!this.active.length && !oldActive.length) && !overlaps;
    const isNewHash = activeHash !== window.location.hash;

    // Update the active link element (native classList, 7.0 line A S7)
    if (isNewActive) {
      oldActive.forEach(function (el) {
        el.classList.remove(this.options.activeClass);
      }, this);
      this.active.forEach(function (el) {
        el.classList.add(this.options.activeClass);
      }, this);
    }

    // Update the hash (it may have changed with the same active link)
    if (this.options.deepLinking && isNewHash) {
      if (window.history.pushState) {
        // Set or remove the hash (see: https://stackoverflow.com/a/5298684/4317384
        const url = activeHash ? activeHash : window.location.pathname + window.location.search;
        if (this.options.updateHistory) {
          window.history.pushState({}, '', url);
        } else {
          window.history.replaceState({}, '', url);
        }
      } else {
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
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'update.zf.magellan', [this.active]);
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, '.zf.trigger .zf.magellan');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, `hashchange.zf.magellan:${this.id}`);
    if (this.onLoadListener) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
    // Reset the active link classes (the 6.x destroy cleanup).
    this.$element.querySelectorAll(`.${this.options.activeClass}`).forEach(function (el) {
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


/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.smoothScroll":
/*!************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.smoothScroll"],"amd":"./foundation.smoothScroll","commonjs":"./foundation.smoothScroll","commonjs2":"./foundation.smoothScroll"} ***!
  \************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_smoothScroll__;

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
/*!***************************************************!*\
  !*** ./js/entries/plugins/foundation.magellan.js ***!
  \***************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Magellan: () => (/* reexport safe */ _foundation_magellan__WEBPACK_IMPORTED_MODULE_1__.Magellan)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_magellan__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.magellan */ "./js/foundation.magellan.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_magellan__WEBPACK_IMPORTED_MODULE_1__.Magellan, 'Magellan');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.magellan.js.map