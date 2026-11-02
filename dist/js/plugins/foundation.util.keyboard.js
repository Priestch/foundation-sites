(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.util.keyboard.js":
/*!****************************************!*\
  !*** ./js/foundation.util.keyboard.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Keyboard: () => (/* binding */ Keyboard)
/* harmony export */ });
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);
/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/




const keyCodes = {
  9: 'TAB',
  13: 'ENTER',
  27: 'ESCAPE',
  32: 'SPACE',
  35: 'END',
  36: 'HOME',
  37: 'ARROW_LEFT',
  38: 'ARROW_UP',
  39: 'ARROW_RIGHT',
  40: 'ARROW_DOWN'
};

// P3-2: real KeyboardEvents carry `key`; map it to the command names the
// keyCode table produces. The keyCode/which fallback below stays for one
// release (legacy synthetic events and the mock's non-mapped keys).
const keyNames = {
  'Tab': 'TAB',
  'Enter': 'ENTER',
  'Escape': 'ESCAPE',
  ' ': 'SPACE',
  'End': 'END',
  'Home': 'HOME',
  'ArrowLeft': 'ARROW_LEFT',
  'ArrowUp': 'ARROW_UP',
  'ArrowRight': 'ARROW_RIGHT',
  'ArrowDown': 'ARROW_DOWN'
};
var commands = {};

// Focusable candidates, in DOM order (7.0 line A, S5: the 6.x implementation
// ran the same selector through jQuery's `.find()`).
const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';

// Functions pulled out to be referenceable from internals
// 7.0 line A terminal form: the return is the sorted native element array
// (the S5 mixed-state shape was a jQuery collection for `.eq()` callers).
function findFocusable(element) {
  if (!element) {
    return false;
  }
  // Accepts an element, a NodeList, an array or a jQuery collection.
  const roots = Array.from(element.nodeType === 1 ? [element] : element);
  const candidates = [];
  roots.forEach(root => {
    if (root && root.querySelectorAll) {
      candidates.push(...root.querySelectorAll(focusableSelector));
    }
  });
  const focusable = candidates.filter(function (el) {
    //only have visible elements and those that have a tabindex greater or equal 0
    if (!(0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.visible)(el) || el.getAttribute('tabindex') < 0) {
      return false;
    }
    return true;
  });
  return focusable.sort(function (a, b) {
    if (a.getAttribute('tabindex') === b.getAttribute('tabindex')) {
      return 0;
    }
    const aTabIndex = parseInt(a.getAttribute('tabindex'), 10),
      bTabIndex = parseInt(b.getAttribute('tabindex'), 10);
    // A missing attribute is treated the same as 0
    if (a.getAttribute('tabindex') === null && bTabIndex > 0) {
      return 1;
    }
    if (b.getAttribute('tabindex') === null && aTabIndex > 0) {
      return -1;
    }
    if (aTabIndex === 0 && bTabIndex > 0) {
      return 1;
    }
    if (bTabIndex === 0 && aTabIndex > 0) {
      return -1;
    }
    if (aTabIndex < bTabIndex) {
      return -1;
    }
    if (aTabIndex > bTabIndex) {
      return 1;
    }
  });
}
function parseKey(event) {
  var key = keyNames[event.key] || keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

  // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
  key = key.replace(/\W+/, '');
  if (event.shiftKey) key = `SHIFT_${key}`;
  if (event.ctrlKey) key = `CTRL_${key}`;
  if (event.altKey) key = `ALT_${key}`;

  // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
  key = key.replace(/_$/, '');
  return key;
}
var Keyboard = {
  keys: getKeyCodes(keyCodes),
  /**
   * Parses the (keyboard) event and returns a String that represents its key
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   * @param {Event} event - the event generated by the event handler
   * @return String key - String that represents the key pressed
   */
  parseKey: parseKey,
  /**
   * Handles the given (keyboard) event
   * @param {Event} event - the event generated by the event handler
   * @param {String} component - Foundation component's name, e.g. Slider or Reveal
   * @param {Objects} functions - collection of functions that are to be executed
   */
  handleKey(event, component, functions) {
    var commandList = commands[component],
      keyCode = this.parseKey(event),
      cmds,
      command,
      fn;
    if (!commandList) return console.warn('Component not defined!');

    // Ignore the event if it was already handled
    if (event.zfIsKeyHandled === true) return;

    // This component does not differentiate between ltr and rtl
    if (typeof commandList.ltr === 'undefined') {
      cmds = commandList; // use plain list
    } else {
      // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
      if ((0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.rtl)()) cmds = Object.assign({}, commandList.ltr, commandList.rtl);else cmds = Object.assign({}, commandList.rtl, commandList.ltr);
    }
    command = cmds[keyCode];
    fn = functions[command];
    // Execute the handler if found
    if (fn && typeof fn === 'function') {
      var returnValue = fn.apply();

      // Mark the event as "handled" to prevent future handlings
      event.zfIsKeyHandled = true;

      // Execute function when event was handled
      if (functions.handled || typeof functions.handled === 'function') {
        functions.handled(returnValue);
      }
    } else {
      // Execute function when event was not handled
      if (functions.unhandled || typeof functions.unhandled === 'function') {
        functions.unhandled();
      }
    }
  },
  /**
   * Finds all focusable elements within the given `$element`
   * @param {jQuery} $element - jQuery object to search within
   * @return {jQuery} $focusable - all focusable elements within `$element`
   */

  findFocusable: findFocusable,
  /**
   * Returns the component name name
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @return String componentName
   */

  register(componentName, cmds) {
    commands[componentName] = cmds;
  },
  // TODO9438: These references to Keyboard need to not require global. Will 'this' work in this context?
  //
  /**
   * Traps the focus in the given element.
   * The keydown listener lives on the native event layer (7.0 line A, S5);
   * real keydowns reach it while the mixed state lasts, and callers keep
   * handing in the jQuery object.
   * @param  {jQuery} $element  jQuery object to trap the foucs into.
   */
  trapFocus(element) {
    // Accepts an element or a collection (mixed state callers); the
    // focusable list is the native array terminal form.
    const el = element.nodeType === 1 ? element : element[0];
    const focusable = findFocusable(el),
      firstFocusable = focusable[0],
      lastFocusable = focusable[focusable.length - 1];
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(el, 'keydown.zf.trapfocus', function (event) {
      if (event.target === lastFocusable && parseKey(event) === 'TAB') {
        event.preventDefault();
        firstFocusable.focus();
      } else if (event.target === firstFocusable && parseKey(event) === 'SHIFT_TAB') {
        event.preventDefault();
        lastFocusable.focus();
      }
    });
  },
  /**
   * Releases the trapped focus from the given element.
   * @param  {jQuery} $element  jQuery object to release the focus for.
   */
  releaseFocus(element) {
    const el = element.nodeType === 1 ? element : element[0];
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(el, "keydown.zf.trapfocus");
  }
};

/*
 * Constants for easier comparing.
 * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
 */
function getKeyCodes(kcs) {
  var k = {};
  for (var kc in kcs) {
    if (kcs.hasOwnProperty(kc)) k[kcs[kc]] = kcs[kc];
  }
  return k;
}


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
/*!********************************************************!*\
  !*** ./js/entries/plugins/foundation.util.keyboard.js ***!
  \********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Keyboard: () => (/* reexport safe */ _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_1__.Keyboard)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.util.keyboard */ "./js/foundation.util.keyboard.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.Keyboard = _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_1__.Keyboard;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.util.keyboard.js.map