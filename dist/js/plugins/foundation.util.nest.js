(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.nest"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.util.nest.js":
/*!************************************!*\
  !*** ./js/foundation.util.nest.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Nest: () => (/* binding */ Nest)
/* harmony export */ });
// S13 (7.0 line A): the Nest util is jQuery-free - the DOM reads/writes
// inside Feather and Burn moved from jQuery traversal to the element's own
// DOM API. The `menu` parameter keeps its historical shape - the jQuery
// collections the three menu plugins pass in - and a plain element also
// works (toMenu unwraps it), because the collection reads inside the callers
// were the only jQuery-form requirement.
function toMenu(menu) {
  // nodeType marks a real node: never unwrap it, even when it is itself
  // array-like (HTMLSelectElement exposes its first option as [0]).
  return menu && menu.nodeType === undefined && menu[0] !== undefined && menu[0] !== null ? menu[0] : menu;
}
const Nest = {
  Feather(menu) {
    let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';
    menu = toMenu(menu);
    menu.setAttribute('role', 'menubar');
    menu.querySelectorAll('a').forEach(function (anchor) {
      anchor.setAttribute('role', 'menuitem');
    });
    const subMenuClass = `is-${type}-submenu`,
      subItemClass = `${subMenuClass}-item`,
      hasSubClass = `${subMenuClass}-parent`,
      applyAria = type !== 'accordion'; // Accordions handle their own ARIA attriutes.

    const items = menu.querySelectorAll('li');
    items.forEach(function (item) {
      item.setAttribute('role', 'none');
      const sub = item.querySelector(':scope > ul');
      if (sub) {
        // data-submenu is tagged in this pass; the second pass below sees it

        item.classList.add(hasSubClass);
        if (applyAria) {
          const firstItem = item.querySelector(':scope > a');
          firstItem.setAttribute('aria-haspopup', 'true');
          firstItem.setAttribute('aria-label', firstItem.getAttribute('aria-label') || firstItem.textContent);
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if (type === 'drilldown') {
            item.setAttribute('aria-expanded', 'false');
          }
        }
        sub.classList.add('submenu', subMenuClass);
        sub.setAttribute('data-submenu', '');
        sub.setAttribute('role', 'menubar');
        if (type === 'drilldown') {
          sub.setAttribute('aria-hidden', 'true');
        }
      }
    });
    // Second pass over the SAME item list: each li whose parent ended up
    // tagged with [data-submenu] during the first pass gets the submenu-item
    // classes (the 6.x check read the state after the sub was tagged).
    items.forEach(function (item) {
      if (item.parentElement && item.parentElement.closest('[data-submenu]')) {
        item.classList.add('is-submenu-item', subItemClass);
      }
    });
    return;
  },
  Burn(menu, type) {
    menu = toMenu(menu);
    const subMenuClass = `is-${type}-submenu`,
      subItemClass = `${subMenuClass}-item`,
      hasSubClass = `${subMenuClass}-parent`;

    // `>li, > li > ul, .menu, .menu > li, [data-submenu] > li` from the
    // jQuery find(): the :scope-prefixed parts stay root-relative, the
    // descendant parts search the whole menu.
    const selector = [':scope > li', ':scope > li > ul', '.menu', '.menu > li', '[data-submenu] > li'].join(',');
    menu.querySelectorAll(selector).forEach(function (node) {
      node.classList.remove(subMenuClass, subItemClass, hasSubClass, 'is-submenu-item', 'submenu', 'is-active');
      node.removeAttribute('data-submenu');
      node.style.display = '';
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
  !*** ./js/entries/plugins/foundation.util.nest.js ***!
  \****************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Nest: () => (/* reexport safe */ _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__.Nest)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.util.nest */ "./js/foundation.util.nest.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Nest = _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__.Nest;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.nest.js.map