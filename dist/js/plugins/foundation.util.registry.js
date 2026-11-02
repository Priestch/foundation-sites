(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.registry"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
/*!********************************************************!*\
  !*** ./js/entries/plugins/foundation.util.registry.js ***!
  \********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Registry: () => (/* reexport safe */ _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__.Registry)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.util.registry */ "./js/foundation.util.registry.js");



})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.registry.js.map