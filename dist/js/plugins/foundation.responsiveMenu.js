(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.events"), require("./foundation.dropdownMenu"), require("./foundation.drilldown"), require("./foundation.accordionMenu"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.mediaQuery", "./foundation.util.events", "./foundation.dropdownMenu", "./foundation.drilldown", "./foundation.accordionMenu"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.events"), require("./foundation.dropdownMenu"), require("./foundation.drilldown"), require("./foundation.accordionMenu"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.responsiveMenu"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.dropdownMenu"], root["__FOUNDATION_EXTERNAL__"]["foundation.drilldown"], root["__FOUNDATION_EXTERNAL__"]["foundation.accordionMenu"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_dropdownMenu__, __WEBPACK_EXTERNAL_MODULE__foundation_drilldown__, __WEBPACK_EXTERNAL_MODULE__foundation_accordionMenu__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.responsiveMenu.js":
/*!*****************************************!*\
  !*** ./js/foundation.responsiveMenu.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ResponsiveMenu: () => (/* binding */ ResponsiveMenu)
/* harmony export */ });
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.dropdownMenu */ "./foundation.dropdownMenu");
/* harmony import */ var _foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_drilldown__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.drilldown */ "./foundation.drilldown");
/* harmony import */ var _foundation_drilldown__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_drilldown__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.accordionMenu */ "./foundation.accordionMenu");
/* harmony import */ var _foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_5__);







let MenuPlugins = {
  dropdown: {
    cssClass: 'dropdown',
    plugin: _foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_3__.DropdownMenu
  },
  drilldown: {
    cssClass: 'drilldown',
    plugin: _foundation_drilldown__WEBPACK_IMPORTED_MODULE_4__.Drilldown
  },
  accordion: {
    cssClass: 'accordion-menu',
    plugin: _foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_5__.AccordionMenu
  }
};

// import "foundation.util.triggers.js";

/**
 * ResponsiveMenu module.
 * @module foundation.responsiveMenu
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

// 7.0 line A, slice S11: the wrapper itself runs on the native layer. The
// mq switch is an explicit destroy+rebuild of the sub-plugin on the same
// element - all three sub-plugins (DropdownMenu, AccordionMenu, Drilldown)
// are native since S9 and register their own instance/attrs beside the
// wrapper's, like the 6.x zfPlugin guard let them.
class ResponsiveMenu extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.Plugin {
  /**
   * Creates a new instance of a responsive menu.
   * @class
   * @name ResponsiveMenu
   * @fires ResponsiveMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element) {
    // 7.0 line A terminal form: the element (constructor contracts hand in
    // either shape during the mixed state).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.rules = this.$element.getAttribute('data-responsive-menu');
    this.currentMq = null;
    this.currentPlugin = null;
    this.className = 'ResponsiveMenu'; // ie9 back compat

    this._init();
    this._events();
  }

  /**
   * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
   * @function
   * @private
   */
  _init() {
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery._init();
    // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
    if (typeof this.rules === 'string') {
      let rulesTree = {};

      // Parse rules from "classes" pulled from data attribute
      let rules = this.rules.split(' ');

      // Iterate through every rule found
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i].split('-');
        let ruleSize = rule.length > 1 ? rule[0] : 'small';
        let rulePlugin = rule.length > 1 ? rule[1] : rule[0];
        if (MenuPlugins[rulePlugin] !== null) {
          rulesTree[ruleSize] = MenuPlugins[rulePlugin];
        }
      }
      this.rules = rulesTree;
    }
    if (Object.keys(this.rules).length !== 0) {
      this._checkMediaQueries();
    }
    // Add data-mutate since children may need it.
    if (!this.$element.getAttribute('data-mutate')) {
      this.$element.setAttribute('data-mutate', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'responsive-menu'));
    }
  }

  /**
   * Initializes events for the Menu.
   * @function
   * @private
   */
  _events() {
    // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
    // bubbling window event on the native layer now, so this consumer binds
    // there (equalizer/tabs/responsiveToggle/responsiveAccordionTabs/
    // offcanvas all flipped with the producer in the same move).
    this._changedZfMediaQueryHandler = this._checkMediaQueries.bind(this);
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }

  /**
   * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
   * @function
   * @private
   */
  _checkMediaQueries() {
    var matchedMq = null;
    var element = this.$element;

    // Iterate through each rule and find the last matching rule
    Object.keys(this.rules).forEach(function (key) {
      if (_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__.MediaQuery.atLeast(key)) {
        matchedMq = key;
      }
    });

    // No match? No dice
    if (!matchedMq) return;

    // Plugin already initialized? We good
    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

    // Remove existing plugin-specific CSS classes
    Object.keys(MenuPlugins).forEach(function (key) {
      element.classList.remove(MenuPlugins[key].cssClass);
    });

    // Add the CSS class for the new plugin
    element.classList.add(this.rules[matchedMq].cssClass);

    // The swap is destroy + construct: the outgoing sub-plugin runs its own
    // destroy (listeners, feather, wrapper - each S9 plugin cleans its own
    // layer), then the new type is built on the same element.
    if (this.currentPlugin) this.currentPlugin.destroy();
    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
  }

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  _destroy() {
    if (this.currentPlugin) this.currentPlugin.destroy();
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }
}
ResponsiveMenu.defaults = {};


/***/ }),

/***/ "./foundation.accordionMenu":
/*!****************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.accordionMenu"],"amd":"./foundation.accordionMenu","commonjs":"./foundation.accordionMenu","commonjs2":"./foundation.accordionMenu"} ***!
  \****************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_accordionMenu__;

/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.drilldown":
/*!************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.drilldown"],"amd":"./foundation.drilldown","commonjs":"./foundation.drilldown","commonjs2":"./foundation.drilldown"} ***!
  \************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_drilldown__;

/***/ }),

/***/ "./foundation.dropdownMenu":
/*!************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.dropdownMenu"],"amd":"./foundation.dropdownMenu","commonjs":"./foundation.dropdownMenu","commonjs2":"./foundation.dropdownMenu"} ***!
  \************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_dropdownMenu__;

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
/*!*********************************************************!*\
  !*** ./js/entries/plugins/foundation.responsiveMenu.js ***!
  \*********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   ResponsiveMenu: () => (/* reexport safe */ _foundation_responsiveMenu__WEBPACK_IMPORTED_MODULE_1__.ResponsiveMenu)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_responsiveMenu__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.responsiveMenu */ "./js/foundation.responsiveMenu.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_responsiveMenu__WEBPACK_IMPORTED_MODULE_1__.ResponsiveMenu, 'ResponsiveMenu');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.responsiveMenu.js.map