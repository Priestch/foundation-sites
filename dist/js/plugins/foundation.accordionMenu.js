(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.nest"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.motion"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.keyboard", "./foundation.util.nest", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.motion"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.nest"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.motion"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.accordionMenu"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.nest"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_nest__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.accordionMenu.js":
/*!****************************************!*\
  !*** ./js/foundation.accordionMenu.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AccordionMenu: () => (/* binding */ AccordionMenu)
/* harmony export */ });
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.nest */ "./foundation.util.nest");
/* harmony import */ var _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__);








/**
 * AccordionMenu module.
 * @module foundation.accordionMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.nest
 */

// Element | collection | NodeList | array -> element array (the 6.x
// multi-target collection form keeps working).
function normalizeTargets(target) {
  if (target.nodeType === 1) {
    return [target];
  }
  if (!target) {
    return [];
  }
  return Array.from(target);
}
class AccordionMenu extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.Plugin {
  /**
   * Creates a new instance of an accordion menu.
   * @class
   * @name AccordionMenu
   * @fires AccordionMenu#init
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.deepMerge)({}, AccordionMenu.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.datasetOptions)(this.$element), options);
    this.className = 'AccordionMenu'; // ie9 back compat

    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.register('AccordionMenu', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_RIGHT': 'open',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'close',
      'ESCAPE': 'closeAll'
    });
  }

  /**
   * Initializes the accordion menu by hiding all nested menus.
   * @private
   */
  _init() {
    _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__.Nest.Feather(this.$element, 'accordion');
    var _this = this;

    // fx 方案 A: the instant-collapse init hide on the native primitive
    this.$element.querySelectorAll('[data-submenu]').forEach(function (sub) {
      if (!sub.classList.contains('is-active')) {
        _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.slideUp(sub, 0);
      }
    });
    this.$element.setAttribute('aria-multiselectable', this.options.multiOpen);
    this.$menuLinks = Array.from(this.$element.querySelectorAll('.is-accordion-submenu-parent'));
    this.$menuLinks.forEach(function (elem) {
      var linkId = elem.id || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'acc-menu-link'),
        sub = elem.querySelector(':scope > [data-submenu]'),
        subId = sub.id || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'acc-menu'),
        isActive = sub.classList.contains('is-active');
      if (_this.options.parentLink) {
        // $anchor.clone().prependTo($sub).wrap('<li .../>')
        const anchor = elem.querySelector(':scope > a');
        const wrapper = document.createElement('li');
        wrapper.setAttribute('data-is-parent-link', '');
        wrapper.className = 'is-submenu-parent-item is-submenu-item is-accordion-submenu-item';
        const cloned = anchor.cloneNode(true);
        wrapper.appendChild(cloned);
        sub.insertBefore(wrapper, sub.firstChild);
      }
      if (_this.options.submenuToggle) {
        elem.classList.add('has-submenu-toggle');
        elem.querySelector(':scope > a').insertAdjacentHTML('afterend', '<button id="' + linkId + '" class="submenu-toggle" aria-controls="' + subId + '" aria-expanded="' + isActive + '" title="' + _this.options.submenuToggleText + '"><span class="submenu-toggle-text">' + _this.options.submenuToggleText + '</span></button>');
      } else {
        elem.setAttribute('aria-controls', subId);
        elem.setAttribute('aria-expanded', isActive);
        elem.setAttribute('id', linkId);
      }
      sub.setAttribute('aria-labelledby', linkId);
      sub.setAttribute('aria-hidden', !isActive);
      sub.setAttribute('role', 'group');
      sub.setAttribute('id', subId);
    });
    var initPanes = Array.from(this.$element.querySelectorAll('.is-active'));
    initPanes.forEach(function (pane) {
      _this.down(pane);
    });
    this._events();
  }

  /**
   * Adds event handlers for items within the menu.
   * @private
   */
  _events() {
    var _this = this;
    this.$element.querySelectorAll('li').forEach(function (item) {
      var submenu = item.querySelector(':scope > [data-submenu]');
      if (submenu) {
        // S9: the submenu click consumers run on the native event layer -
        // real clicks reach them directly, jQuery-synthesized clicks ride
        // the `.click()` shortcut bridge (reveal-native precedent; jQuery
        // suppresses that shortcut for link anchors).
        if (_this.options.submenuToggle) {
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(item.querySelector(':scope > .submenu-toggle'), 'click.zf.accordionMenu');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(item.querySelector(':scope > .submenu-toggle'), 'click.zf.accordionMenu', function () {
            _this.toggle(submenu);
          });
        } else {
          item.querySelectorAll(':scope > a').forEach(anchor => {
            _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(anchor, 'click.zf.accordionMenu');
            _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(anchor, 'click.zf.accordionMenu', function (e) {
              e.preventDefault();
              _this.toggle(submenu);
            });
          });
        }
      }

      // 7.0 line A terminal form: the keydown listener runs on the native
      // event layer (the coarse suite's mocks dispatch real KeyboardEvents
      // since the S16 migration). The traversal below reproduces the jQuery
      // shape: visible submenus (Dom.visible, the narrow display semantics),
      // first/last-child positions, closest('li') for the parents walk.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(item, 'keydown.zf.accordionMenu');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(item, 'keydown.zf.accordionMenu', function (e) {
        var element = this,
          parentUl = element.parentElement && element.parentElement.matches('ul') ? element.parentElement : null,
          elements = parentUl ? Array.from(parentUl.children).filter(el => el.matches('li')) : [],
          prevElement,
          nextElement,
          target = element.querySelector(':scope > [data-submenu]');
        var i = elements.indexOf(element);
        if (i !== -1) {
          prevElement = elements[Math.max(0, i - 1)].querySelector('a');
          nextElement = elements[Math.min(i + 1, elements.length - 1)].querySelector('a');
          var openSub = element.querySelector(':scope > [data-submenu]');
          if (openSub && (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.visible)(openSub)) {
            // has open sub menu
            nextElement = element.querySelector('li a');
          }
          if (element === element.parentElement.firstElementChild) {
            // is first element of sub menu
            prevElement = element.closest('li') && element.closest('li') !== element ? element.closest('li').querySelector('a') : prevElement;
          } else if (prevElement && prevElement.closest('li') && prevElement.closest('li').querySelector(':scope > [data-submenu]') && (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.visible)(prevElement.closest('li').querySelector(':scope > [data-submenu]'))) {
            // if previous element has open sub menu
            prevElement = prevElement.closest('li').querySelector('li:last-child a');
          }
          if (element === element.parentElement.lastElementChild) {
            // is last element of sub menu
            var parentLi = element.closest('li');
            if (parentLi && parentLi !== element && parentLi.nextElementSibling && parentLi.nextElementSibling.matches('li')) {
              nextElement = parentLi.nextElementSibling.querySelector('a');
            }
          }
        }
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.handleKey(e, 'AccordionMenu', {
          open: function () {
            if (!(0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.visible)(target)) {
              _this.down(target);
              target.querySelector('li a').focus();
            }
          },
          close: function () {
            if (target && (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.visible)(target)) {
              // close active sub of this item
              _this.up(target);
            } else if (element.parentElement && element.parentElement.matches('[data-submenu]')) {
              // close currently open sub
              _this.up(element.parentElement);
              element.closest('li').querySelector('a').focus();
            }
          },
          up: function () {
            if (prevElement) prevElement.focus();
            return true;
          },
          down: function () {
            if (nextElement) nextElement.focus();
            return true;
          },
          toggle: function () {
            if (_this.options.submenuToggle) {
              return false;
            }
            if (target) {
              _this.toggle(target);
              return true;
            }
          },
          closeAll: function () {
            _this.hideAll();
          },
          handled: function (preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
          }
        });
      });
    });
  }

  /**
   * Closes all panes of the menu.
   * @function
   */
  hideAll() {
    this.up(Array.from(this.$element.querySelectorAll('[data-submenu]')));
  }

  /**
   * Opens all panes of the menu.
   * @function
   */
  showAll() {
    this.down(Array.from(this.$element.querySelectorAll('[data-submenu]')));
  }

  /**
   * Toggles the open/close state of a submenu.
   * @function
   * @param {jQuery} $target - the submenu to toggle
   */
  toggle(target) {
    // Accepts an element, a collection, a NodeList or an array.
    target = normalizeTargets(target);
    if (!target.some(el => _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.isAnimating(el))) {
      if (target.some(el => (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.visible)(el))) {
        this.up(target);
      } else {
        this.down(target);
      }
    }
  }

  /**
   * Opens the sub-menu defined by `$target`.
   * @param {jQuery} $target - Sub-menu to open.
   * @fires AccordionMenu#down
   */
  down(target) {
    target = normalizeTargets(target);
    // If having multiple submenus active is disabled, close all the submenus
    // that are not parents or children of the targeted submenu.
    if (!this.options.multiOpen) {
      // The "branch" of the targeted submenu, from the component root to
      // the active submenus nested in it (the union over a multi-target,
      // like the collection .parentsUntil/.add union did).
      const branch = [];
      const addUnique = el => {
        if (el && branch.indexOf(el) === -1) {
          branch.push(el);
        }
      };
      target.forEach(el => {
        let ancestor = el.parentElement;
        while (ancestor && ancestor !== this.$element) {
          if (ancestor.matches('[data-submenu]')) {
            addUnique(ancestor);
          }
          ancestor = ancestor.parentElement;
        }
        addUnique(el);
        el.querySelectorAll('.is-active').forEach(addUnique);
      });
      // All the active submenus that are not in the branch.
      const othersActiveSubmenus = Array.from(this.$element.querySelectorAll('.is-active')).filter(el => branch.indexOf(el) === -1);
      this.up(othersActiveSubmenus);
    }

    // S9: class/ARIA state flips natively.
    target.forEach(el => {
      el.classList.add('is-active');
      el.setAttribute('aria-hidden', 'false');
    });
    if (this.options.submenuToggle) {
      target.forEach(el => {
        const toggle = el.previousElementSibling;
        if (toggle && toggle.matches('.submenu-toggle')) {
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    } else {
      target.forEach(el => {
        const parentLink = el.parentElement;
        if (parentLink && parentLink.matches('.is-accordion-submenu-parent')) {
          parentLink.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // fx 方案 A: the fold tween runs on Motion's native slide primitive -
    // the down event keeps its after-the-tween timing and fires once per
    // pane; the terminal form forwards the element array.
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.slideDown(target, this.options.slideSpeed, () => {
      /**
       * Fires when the menu is done opening.
       * @event AccordionMenu#down
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'down.zf.accordionMenu', [target]);
    });
  }

  /**
   * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
   * @param {jQuery} $target - Sub-menu to close.
   * @fires AccordionMenu#up
   */
  up(target) {
    target = normalizeTargets(target);
    const submenus = [];
    target.forEach(el => {
      el.querySelectorAll('[data-submenu]').forEach(sub => {
        if (submenus.indexOf(sub) === -1) {
          submenus.push(sub);
        }
      });
    });
    const allmenus = target.concat(submenus);
    submenus.forEach(el => _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.slideUp(el, 0));
    // S9: class/ARIA state flips natively.
    allmenus.forEach(el => {
      el.classList.remove('is-active');
      el.setAttribute('aria-hidden', 'true');
    });
    if (this.options.submenuToggle) {
      allmenus.forEach(el => {
        const toggle = el.previousElementSibling;
        if (toggle && toggle.matches('.submenu-toggle')) {
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    } else {
      allmenus.forEach(el => {
        const parentLink = el.parentElement;
        if (parentLink && parentLink.matches('.is-accordion-submenu-parent')) {
          parentLink.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // fx 方案 A, see down(): the fold tween on the native primitive; the
    // terminal form forwards the element array.
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.slideUp(target, this.options.slideSpeed, () => {
      /**
       * Fires when the menu is done collapsing up.
       * @event AccordionMenu#up
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(this.$element, 'up.zf.accordionMenu', [target]);
    });
  }

  /**
   * Destroys an instance of accordion menu.
   * @fires AccordionMenu#destroyed
   */
  _destroy() {
    // fx 方案 A: the instant-show destroy cleanup (inline display cleared
    // so the stylesheet rules own the resting state again)
    this.$element.querySelectorAll('[data-submenu]').forEach(function (el) {
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.slideDown(el, 0);
      el.style.display = '';
    });
    // The click and keydown listeners, by plugin namespace.
    this.$element.querySelectorAll('a, .submenu-toggle').forEach(el => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(el, 'click.zf.accordionMenu');
    });
    this.$element.querySelectorAll('li').forEach(el => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(el, 'keydown.zf.accordionMenu');
    });
    // .detach(): removed without keeping data/events (plain remove here -
    // the elements carry no other state)
    this.$element.querySelectorAll('[data-is-parent-link]').forEach(el => {
      el.remove();
    });
    if (this.options.submenuToggle) {
      this.$element.querySelectorAll('.has-submenu-toggle').forEach(el => {
        el.classList.remove('has-submenu-toggle');
      });
      this.$element.querySelectorAll('.submenu-toggle').forEach(el => {
        el.remove();
      });
    }
    _foundation_util_nest__WEBPACK_IMPORTED_MODULE_1__.Nest.Burn(this.$element, 'accordion');
  }
}
AccordionMenu.defaults = {
  /**
   * Adds the parent link to the submenu.
   * @option
   * @type {boolean}
   * @default false
   */
  parentLink: false,
  /**
   * Amount of time to animate the opening of a submenu in ms.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Adds a separate submenu toggle button. This allows the parent item to have a link.
   * @option
   * @example true
   */
  submenuToggle: false,
  /**
   * The text used for the submenu toggle if enabled. This is used for screen readers only.
   * @option
   * @example true
   */
  submenuToggleText: 'Toggle menu',
  /**
   * Allow the menu to have multiple open panes.
   * @option
   * @type {boolean}
   * @default true
   */
  multiOpen: true
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

/***/ "./foundation.util.keyboard":
/*!****************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.keyboard"],"amd":"./foundation.util.keyboard","commonjs":"./foundation.util.keyboard","commonjs2":"./foundation.util.keyboard"} ***!
  \****************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__;

/***/ }),

/***/ "./foundation.util.motion":
/*!********************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.motion"],"amd":"./foundation.util.motion","commonjs":"./foundation.util.motion","commonjs2":"./foundation.util.motion"} ***!
  \********************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__;

/***/ }),

/***/ "./foundation.util.nest":
/*!************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.nest"],"amd":"./foundation.util.nest","commonjs":"./foundation.util.nest","commonjs2":"./foundation.util.nest"} ***!
  \************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_nest__;

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
  !*** ./js/entries/plugins/foundation.accordionMenu.js ***!
  \********************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AccordionMenu: () => (/* reexport safe */ _foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_1__.AccordionMenu),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.accordionMenu */ "./js/foundation.accordionMenu.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_accordionMenu__WEBPACK_IMPORTED_MODULE_1__.AccordionMenu, 'AccordionMenu');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.accordionMenu.js.map