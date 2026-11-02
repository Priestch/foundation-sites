(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.imageLoader"), require("./foundation.util.dom"), require("./foundation.util.events"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.mediaQuery", "./foundation.util.imageLoader", "./foundation.util.dom", "./foundation.util.events"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.imageLoader"), require("./foundation.util.dom"), require("./foundation.util.events"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.equalizer"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.imageLoader"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_imageLoader__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.equalizer.js":
/*!************************************!*\
  !*** ./js/foundation.equalizer.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Equalizer: () => (/* binding */ Equalizer)
/* harmony export */ });
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.imageLoader */ "./foundation.util.imageLoader");
/* harmony import */ var _foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_4__);







/**
 * Equalizer module.
 * @module foundation.equalizer
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.imageLoader if equalizer contains images
 */

class Equalizer extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.Plugin {
  /**
   * Creates a new instance of Equalizer.
   * @class
   * @name Equalizer
   * @fires Equalizer#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.deepMerge)({}, Equalizer.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.datasetOptions)(this.$element), options);
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
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery._init();
    this.$watched = watched.length ? watched : Array.from(this.$element.querySelectorAll('[data-equalizer-watch]'));
    // State attributes go through the native layer (7.0 line A, S8).
    this.$element.setAttribute('data-resize', eqId || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'eq'));
    this.$element.setAttribute('data-mutate', eqId || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'eq'));
    this.hasNested = this.$element.querySelectorAll('[data-equalizer]').length > 0;
    // jQuery parentsUntil(document.body, sel): the ancestors strictly below
    // body matching the selector
    this.isNested = function () {
      var p = this.$element.parentElement;
      while (p && p !== document.body) {
        if (p.matches('[data-equalizer]')) {
          return true;
        }
        p = p.parentElement;
      }
      return false;
    }.call(this);
    this.isOn = false;
    this._bindHandler = {
      onResizeMeBound: this._onResizeMe.bind(this),
      onPostEqualizedBound: this._onPostEqualized.bind(this),
      onCheckMQBound: this._checkMQ.bind(this)
    };
    var imgs = this.$element.querySelectorAll('img');
    var tooSmall;
    if (this.options.equalizeOn) {
      tooSmall = this._checkMQ();
      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/tabs/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs/offcanvas all flipped with the producer in
      // the same move).
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    } else {
      this._events();
    }
    if (typeof tooSmall !== 'undefined' && tooSmall === false || typeof tooSmall === 'undefined') {
      if (imgs.length) {
        (0,_foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_1__.onImagesLoaded)(imgs, this._reflow.bind(this));
      } else {
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(this.$element, 'mutateme.zf.trigger resizeme.zf.trigger .zf.equalizer');
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
    if (e.target !== this.$element) {
      this._reflow();
    }
  }

  /**
   * Initializes events for Equalizer.
   * @private
   */
  _events() {
    this._pauseEvents();
    if (this.hasNested) {
      // S8: the postequalized consumer flips together with its producer
      // (applyHeight below) in the same commit - both sides of the nested
      // equalizer chain live on the native event layer now.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(this.$element, 'postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
    } else {
      // S8: the resizeme consumer flips to the native event layer; the
      // producer in the Triggers util has dispatched real element-local
      // events since S4, so this seam closes on the consumer half alone.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(this.$element, 'resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
      // S10 group flip: the mutateme consumer joins the native event layer
      // together with its last jQuery-synthesized producers - the Tabs
      // forward and the ResponsiveToggle animated half flip in the same
      // commit, so every element listens on exactly one side and nothing
      // double-fires.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(this.$element, 'mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
    }
    this.isOn = true;
  }

  /**
   * Checks the current breakpoint to the minimum required size.
   * @private
   */
  _checkMQ() {
    var tooSmall = !_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery.is(this.options.equalizeOn);
    if (tooSmall) {
      if (this.isOn) {
        this._pauseEvents();
        this.$watched.forEach(el => {
          el.style.height = 'auto';
        });
      }
    } else {
      if (!this.isOn) {
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
    if (!this.options.equalizeOnStack) {
      if (this._isStacked()) {
        this.$watched.forEach(el => {
          el.style.height = 'auto';
        });
        return false;
      }
    }
    if (this.options.equalizeByRow) {
      this.getHeightsByRow(this.applyHeightByRow.bind(this));
    } else {
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
    for (var i = 0, len = this.$watched.length; i < len; i++) {
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
    var lastElTopOffset = this.$watched.length ? this.$watched[0].getBoundingClientRect().top + window.pageYOffset : 0,
      groups = [],
      group = 0;
    //group by Row
    groups[group] = [];
    for (var i = 0, len = this.$watched.length; i < len; i++) {
      this.$watched[i].style.height = 'auto';
      //maybe could use this.$watched[i].offsetTop
      var elOffsetTop = this.$watched[i].getBoundingClientRect().top + window.pageYOffset;
      if (elOffsetTop !== lastElTopOffset) {
        group++;
        groups[group] = [];
        lastElTopOffset = elOffsetTop;
      }
      groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
    }
    for (var j = 0, ln = groups.length; j < ln; j++) {
      var heights = groups[j].map(function (item) {
        return item[1];
      });
      var max = Math.max.apply(null, heights);
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'preequalized.zf.equalizer');
    this.$watched.forEach(el => {
      el.style.height = max + 'px';
    });

    /**
     * Fires when the heights have been applied
     * @event Equalizer#postequalized
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'postequalized.zf.equalizer');
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'preequalized.zf.equalizer');
    for (var i = 0, len = groups.length; i < len; i++) {
      var groupsILength = groups[i].length,
        max = groups[i][groupsILength - 1];
      if (groupsILength <= 2) {
        groups[i][0][0].style.height = 'auto';
        continue;
      }
      /**
        * Fires before the heights per row are applied
        * @event Equalizer#preequalizedrow
        */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'preequalizedrow.zf.equalizer');
      for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
        groups[i][j][0].style.height = max + 'px';
      }
      /**
        * Fires when the heights per row have been applied
        * @event Equalizer#postequalizedrow
        */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'postequalizedrow.zf.equalizer');
    }
    /**
     * Fires when the heights have been applied
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'postequalized.zf.equalizer');
  }

  /**
   * Destroys an instance of Equalizer.
   * @function
   */
  _destroy() {
    this._pauseEvents();
    this.$watched.forEach(el => {
      el.style.height = 'auto';
    });
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

/***/ "./foundation.util.imageLoader":
/*!****************************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.imageLoader"],"amd":"./foundation.util.imageLoader","commonjs":"./foundation.util.imageLoader","commonjs2":"./foundation.util.imageLoader"} ***!
  \****************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_imageLoader__;

/***/ }),

/***/ "./foundation.util.mediaQuery":
/*!************************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.mediaQuery"],"amd":"./foundation.util.mediaQuery","commonjs":"./foundation.util.mediaQuery","commonjs2":"./foundation.util.mediaQuery"} ***!
  \************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__;

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
/*!****************************************************!*\
  !*** ./js/entries/plugins/foundation.equalizer.js ***!
  \****************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Equalizer: () => (/* reexport safe */ _foundation_equalizer__WEBPACK_IMPORTED_MODULE_1__.Equalizer),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_equalizer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.equalizer */ "./js/foundation.equalizer.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_equalizer__WEBPACK_IMPORTED_MODULE_1__.Equalizer, 'Equalizer');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.equalizer.js.map