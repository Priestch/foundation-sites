(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"), require("./foundation.util.dom"), require("./foundation.util.events"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.mediaQuery", "./foundation.util.triggers", "./foundation.util.dom", "./foundation.util.events"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"), require("./foundation.util.dom"), require("./foundation.util.events"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.interchange"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.interchange.js":
/*!**************************************!*\
  !*** ./js/foundation.interchange.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Interchange: () => (/* binding */ Interchange)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_4__);








/**
 * Interchange module.
 * @module foundation.interchange
 * @requires foundation.util.mediaQuery
 */

class Interchange extends _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Plugin {
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
    this.options = Object.assign({}, Interchange.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.datasetOptions)(this.$element), options);
    this.rules = [];
    this.currentPath = '';
    this.className = 'Interchange'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_2__.Triggers.init();
    this._init();
    this._events();
  }

  /**
   * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
   * @function
   * @private
   */
  _init() {
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__.MediaQuery._init();
    var element = this.$element;
    var id = element.id || (0,_foundation_core__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'interchange');
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(element, 'resizeme.zf.trigger');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(element, 'resizeme.zf.trigger', () => this._reflow());
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
      if (this.rules.hasOwnProperty(i)) {
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
    if (typeof this.options.type === 'undefined') this.options.type = 'auto';else if (types.indexOf(this.options.type) === -1) {
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
    for (var i in _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__.MediaQuery.queries) {
      if (_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__.MediaQuery.queries.hasOwnProperty(i)) {
        var query = _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_1__.MediaQuery.queries[i];
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
    } else {
      // Read the attribute directly: identical to the former
      // `.data('interchange')` for every string rule list (the value is not
      // valid JSON, so jQuery's data parsing never converted it either).
      rules = this.$element.getAttribute('data-interchange');
    }
    rules = typeof rules === 'string' ? rules.match(/\[.*?, .*?\]/g) : rules;
    for (var i in rules) {
      if (rules.hasOwnProperty(i)) {
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
      if (element.nodeName === 'IMG') type = 'src';else if (path.match(/\.(gif|jpe?g|png|svg|tiff)([?#].*)?/i)) type = 'background';else type = 'html';
    }

    // Replacing images
    if (type === 'src') {
      // The M1 fix shape is kept byte-for-byte: a one-time load listener per
      // replace, so listeners stop accumulating across replaces (the S12
      // native form of the former `.one('load')`).
      element.setAttribute('src', path);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.one(element, 'load', () => {
        this.currentPath = path;
      });
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(element, trigger);
    }
    // Replacing background images
    else if (type === 'background') {
      path = path.replace(/\(/g, '%28').replace(/\)/g, '%29');
      element.style.backgroundImage = 'url(' + path + ')';
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(element, trigger);
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
        if (!res.ok) {
          return;
        }
        return res.text();
      }).then(response => {
        if (response === undefined) {
          return;
        }
        // Native html injection (7.0 line A, S12): the assignment re-parses
        // `response` in place, exactly like the former `.html()`.
        element.innerHTML = response;
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(element, trigger);
        // Initialize plugins in the inserted content (it is a re-parsed copy
        // of `response`, so initializing `$(response)` would hit detached nodes)
        _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.reflow(this.$element);
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
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(this.$element, 'resizeme.zf.trigger');
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
/*!******************************************************!*\
  !*** ./js/entries/plugins/foundation.interchange.js ***!
  \******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Interchange: () => (/* reexport safe */ _foundation_interchange__WEBPACK_IMPORTED_MODULE_1__.Interchange)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_interchange__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.interchange */ "./js/foundation.interchange.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_interchange__WEBPACK_IMPORTED_MODULE_1__.Interchange, 'Interchange');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.interchange.js.map