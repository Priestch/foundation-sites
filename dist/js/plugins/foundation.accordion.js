(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.keyboard"), require("./foundation.util.motion"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.keyboard", "./foundation.util.motion"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.keyboard"), require("./foundation.util.motion"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.accordion"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.accordion.js":
/*!************************************!*\
  !*** ./js/foundation.accordion.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Accordion: () => (/* binding */ Accordion)
/* harmony export */ });
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__);







/**
 * Accordion module.
 * @module foundation.accordion
 * @requires foundation.util.keyboard
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
class Accordion extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  /**
   * Creates a new instance of an accordion.
   * @class
   * @name Accordion
   * @fires Accordion#init
   * @param {jQuery} element - jQuery object to make into an accordion.
   * @param {Object} options - a plain object with settings to override the default options.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.deepMerge)({}, Accordion.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.datasetOptions)(this.$element), options);
    this.className = 'Accordion'; // ie9 back compat
    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.register('Accordion', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_DOWN': 'next',
      'ARROW_UP': 'previous',
      'HOME': 'first',
      'END': 'last'
    });
  }

  /**
   * Initializes the accordion by animating the preset active pane(s).
   * @private
   */
  _init() {
    this._isInitializing = true;
    // Per-instance id for the native deep-link hashchange namespace (7.0 line
    // A, S8) - the same shape Reveal/Magellan/Tabs use.
    this.id = this.$element.id || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'accordion');
    this.$tabs = Array.from(this.$element.children).filter(el => el.matches('[data-accordion-item]'));
    this.$tabs.forEach(function (el) {
      var content = el.querySelector(':scope > [data-tab-content]'),
        id = content.id || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'accordion'),
        linkId = el.id ? `${el.id}-label` : `${id}-label`;

      // State/ARIA go through the native layer (7.0 line A, S8).
      var link = el.querySelector('a:first-of-type');
      link.setAttribute('aria-controls', id);
      link.setAttribute('id', linkId);
      link.setAttribute('aria-expanded', 'false');
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', linkId);
      content.setAttribute('aria-hidden', 'true');
      content.setAttribute('id', id);
    });
    var initActive = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]'));
    if (initActive.length) {
      // Save up the initial hash to return to it later when going back in history
      this._initialAnchor = initActive[0].previousElementSibling.matches('a') ? initActive[0].previousElementSibling.getAttribute('href') : undefined;
      this._openSingleTab(initActive);
    }
    this._checkDeepLink = () => {
      var anchor = window.location.hash;
      if (!anchor.length) {
        // If we are still initializing and there is no anchor, then there is nothing to do
        if (this._isInitializing) return;
        // Otherwise, move to the initial anchor
        if (this._initialAnchor) anchor = this._initialAnchor;
      }

      // jQuery's $(weird-hash) returned an empty collection instead of
      // throwing on invalid selectors; querySelector needs the guard.
      var anchorEl = null;
      if (anchor) {
        try {
          anchorEl = document.querySelector(anchor);
        } catch (err) {
          anchorEl = null;
        }
      }
      var link = anchor ? this.$element.querySelector(`[href$="${anchor}"]`) : null;
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!(anchorEl && link);
      if (isOwnAnchor) {
        // If there is an anchor for the hash, open it (if not already active)
        if (anchorEl && link) {
          if (!link.closest('[data-accordion-item]').classList.contains('is-active')) {
            this._openSingleTab(anchorEl);
          }
        }
        // Otherwise, close everything
        else {
          this._closeAllTabs();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.onLoad)(window, () => {
            // A load callback can land after destroy() nulled the instance
            // state (the S6 slider guard pattern).
            if (!this.$element) {
              return;
            }
            var offsetTop = this.$element.getBoundingClientRect().top + window.pageYOffset;
            // fx 方案 A: the native page-scroll tween (SmoothScroll S7
            // equivalence - one viewport tween, callback once per ledger ②)
            _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.animate(document.documentElement, {
              scrollTop: offsetTop - this.options.deepLinkSmudgeOffset
            }, this.options.deepLinkSmudgeDelay);
          });
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Accordion#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'deeplink.zf.accordion', [link, anchorEl]);
      }
    };

    //use browser to open a tab, if it exists in this tabset
    if (this.options.deepLink) {
      this._checkDeepLink();
    }
    this._events();
    this._isInitializing = false;
  }

  /**
   * Adds event handlers for items within the accordion.
   * @private
   */
  _events() {
    var _this = this;
    this.$tabs.forEach(function (elem) {
      var tabContent = elem.querySelector(':scope > [data-tab-content]');
      if (!tabContent) {
        return;
      }
      Array.from(elem.children).filter(el => el.matches('a')).forEach(function (anchor) {
        // S8: the click consumer runs on the native event layer; the
        // keyboard forwarding below dispatches real clicks on the same
        // layer. Real user clicks reach it directly.
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(anchor, 'click.zf.accordion');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(anchor, 'click.zf.accordion', function (e) {
          e.preventDefault();
          _this.toggle(tabContent);
        });

        // 7.0 line A terminal form: the keydown listener runs on the native
        // event layer (the coarse suite's mocks dispatch real KeyboardEvents
        // since the S16 migration).
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(anchor, 'keydown.zf.accordion');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(anchor, 'keydown.zf.accordion', function (e) {
          _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.handleKey(e, 'Accordion', {
            toggle: function () {
              _this.toggle(tabContent);
            },
            next: function () {
              var a = (elem.nextElementSibling || {}).querySelector && elem.nextElementSibling.querySelector('a');
              if (a) a.focus();
              if (!_this.options.multiExpand) {
                _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(a, 'click.zf.accordion');
              }
            },
            previous: function () {
              var a = (elem.previousElementSibling || {}).querySelector && elem.previousElementSibling.querySelector('a');
              if (a) a.focus();
              if (!_this.options.multiExpand) {
                _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(a, 'click.zf.accordion');
              }
            },
            first: function () {
              var a = _this.$tabs[0].querySelector('.accordion-title');
              a.focus();
              if (!_this.options.multiExpand) {
                _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(a, 'click.zf.accordion');
              }
            },
            last: function () {
              var a = _this.$tabs[_this.$tabs.length - 1].querySelector('.accordion-title');
              a.focus();
              if (!_this.options.multiExpand) {
                _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(a, 'click.zf.accordion');
              }
            },
            handled: function () {
              e.preventDefault();
            }
          });
        });
      });
    });
    if (this.options.deepLink) {
      // S8: the deep-link hashchange moves to the native event layer under
      // the per-instance namespace shape introduced for Reveal's hashchange,
      // so the destroy path can drop it precisely. Real hashchange events are
      // unaffected by the namespace.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(window, `hashchange.zf.accordion:${this.id}`, this._checkDeepLink);
    }
  }

  /**
   * Toggles the selected content pane's open/close state.
   * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
   * @function
   */
  toggle(target) {
    // Accepts an element, a collection, a NodeList or an array (the 6.x
    // multi-target collection form works; state and fx iterate per element).
    target = normalizeTargets(target);
    if (target[0].closest('[data-accordion]').matches('[disabled]')) {
      console.info('Cannot toggle an accordion that is disabled.');
      return;
    }
    if (target[0].parentElement.classList.contains('is-active')) {
      this.up(target);
    } else {
      this.down(target);
    }
    //either replace or update browser history
    if (this.options.deepLink) {
      var anchor = target[0].previousElementSibling.getAttribute('href');
      if (this.options.updateHistory) {
        history.pushState({}, '', anchor);
      } else {
        history.replaceState({}, '', anchor);
      }
    }
  }

  /**
   * Opens the accordion tab defined by `$target`.
   * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   */
  down(target) {
    target = normalizeTargets(target);
    if (target[0].closest('[data-accordion]').matches('[disabled]')) {
      console.info('Cannot call down on an accordion that is disabled.');
      return;
    }
    if (this.options.multiExpand) this._openTab(target);else this._openSingleTab(target);
  }

  /**
   * Closes the tab defined by `$target`.
   * It may be ignored if the Accordion options don't allow it.
   *
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   */
  up(target) {
    target = normalizeTargets(target);
    if (this.$element.matches('[disabled]')) {
      console.info('Cannot call up on an accordion that is disabled.');
      return;
    }

    // Don't close the item if it is already closed
    const targetItem = target[0].parentElement;
    if (!targetItem.classList.contains('is-active')) return;

    // Don't close the item if there is no other active item (unless with `allowAllClosed`)
    const othersItems = Array.from(targetItem.parentElement.children).filter(el => el !== targetItem);
    if (!this.options.allowAllClosed && !othersItems.some(el => el.classList.contains('is-active'))) return;
    this._closeTab(target);
  }

  /**
   * Make the tab defined by `$target` the only opened tab, closing all others tabs.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @function
   * @private
   */
  _openSingleTab(target) {
    target = normalizeTargets(target);
    // Close all the others active tabs.
    const activeContents = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]')).filter(el => target.indexOf(el) === -1);
    if (activeContents.length) {
      this._closeTab(activeContents);
    }

    // Then open the target.
    this._openTab(target);
  }

  /**
   * Opens the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   * @private
   */
  _openTab(targets) {
    targets = normalizeTargets(targets);
    // The labelledby lookup keeps the 6.x first-element read; the class and
    // aria-hidden writes apply to every pane, like the collection calls did.
    const targetContentId = targets[0].getAttribute('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    targets.forEach(function (el) {
      el.setAttribute('aria-hidden', 'false');
      el.parentElement.classList.add('is-active');
    });
    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'true');

    // fx 方案 A: the fold tween runs on Motion's native slide primitive
    // (jQuery fx parity: finish() jumps any in-flight fold, the down event
    // stays timed by the completion callback and fires once per pane, like
    // the jQuery collection callback did; the terminal form forwards the
    // element array, 6.x forwarded the collection).
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.finish(targets);
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.slideDown(targets, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done opening.
       * @event Accordion#down
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'down.zf.accordion', [targets]);
    });
  }

  /**
   * Closes the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeTab(targets) {
    targets = normalizeTargets(targets);
    // See _openTab: first-element labelledby lookup, per-element writes.
    const targetContentId = targets[0].getAttribute('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    targets.forEach(function (el) {
      el.setAttribute('aria-hidden', 'true');
      el.parentElement.classList.remove('is-active');
    });
    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'false');

    // fx 方案 A, see _openTab.
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.finish(targets);
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.slideUp(targets, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done collapsing up.
       * @event Accordion#up
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'up.zf.accordion', [targets]);
    });
  }

  /**
   * Closes all active tabs
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeAllTabs() {
    var activeTabs = Array.from(this.$element.querySelectorAll('.is-active > [data-tab-content]'));
    if (activeTabs.length) {
      this._closeTab(activeTabs);
    }
  }

  /**
   * Destroys an instance of an accordion.
   * @fires Accordion#destroyed
   * @function
   */
  _destroy() {
    // fx 方案 A (see _openTab): the collapse-to-zero cleanup stops any
    // in-flight fold and hides instantly.
    this.$element.querySelectorAll('[data-tab-content]').forEach(function (el) {
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.stop(el, true);
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_4__.Motion.slideUp(el, 0);
      el.style.display = '';
    });
    // The click and keydown listeners, by bare plugin namespace.
    this.$element.querySelectorAll('a').forEach(function (anchor) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(anchor, '.zf.accordion');
    });
    if (this.options.deepLink) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(window, `hashchange.zf.accordion:${this.id}`);
    }
  }
}
Accordion.defaults = {
  /**
   * Amount of time to animate the opening of an accordion pane.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Allow the accordion to have multiple open panes.
   * @option
   * @type {boolean}
   * @default false
   */
  multiExpand: false,
  /**
   * Allow the accordion to close all panes.
   * @option
   * @type {boolean}
   * @default false
   */
  allowAllClosed: false,
  /**
   * Link the location hash to the open pane.
   * Set the location hash when the opened pane changes, and open and scroll to the corresponding pane when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,
  /**
   * If `deepLink` is enabled, adjust the deep link scroll to make sure the top of the accordion panel is visible
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinkSmudge: false,
  /**
   * If `deepLinkSmudge` is enabled, animation time (ms) for the deep link adjustment
   * @option
   * @type {number}
   * @default 300
   */
  deepLinkSmudgeDelay: 300,
  /**
   * If `deepLinkSmudge` is enabled, the offset for the scrollToTop to prevent overlap by a sticky element at the top of the page
   * @option
   * @type {number}
   * @default 0
   */
  deepLinkSmudgeOffset: 0,
  /**
   * If `deepLink` is enabled, update the browser history with the open accordion
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false
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
  !*** ./js/entries/plugins/foundation.accordion.js ***!
  \****************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Accordion: () => (/* reexport safe */ _foundation_accordion__WEBPACK_IMPORTED_MODULE_1__.Accordion),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_accordion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.accordion */ "./js/foundation.accordion.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_accordion__WEBPACK_IMPORTED_MODULE_1__.Accordion, 'Accordion');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.accordion.js.map