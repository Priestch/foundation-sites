(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.accordion"), require("./foundation.tabs"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.mediaQuery", "./foundation.util.events", "./foundation.util.dom", "./foundation.accordion", "./foundation.tabs"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.mediaQuery"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.accordion"), require("./foundation.tabs"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.responsiveAccordionTabs"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.accordion"], root["__FOUNDATION_EXTERNAL__"]["foundation.tabs"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_accordion__, __WEBPACK_EXTERNAL_MODULE__foundation_tabs__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.responsiveAccordionTabs.js":
/*!**************************************************!*\
  !*** ./js/foundation.responsiveAccordionTabs.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ResponsiveAccordionTabs: () => (/* binding */ ResponsiveAccordionTabs)
/* harmony export */ });
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_accordion__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.accordion */ "./foundation.accordion");
/* harmony import */ var _foundation_accordion__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_accordion__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_tabs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.tabs */ "./foundation.tabs");
/* harmony import */ var _foundation_tabs__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_tabs__WEBPACK_IMPORTED_MODULE_5__);








// The plugin matches the plugin classes with these plugin instances.
var MenuPlugins = {
  tabs: {
    cssClass: 'tabs',
    plugin: _foundation_tabs__WEBPACK_IMPORTED_MODULE_5__.Tabs,
    open: (plugin, target) => plugin.selectTab(target),
    close: null /* not supported */,
    toggle: null /* not supported */
  },
  accordion: {
    cssClass: 'accordion',
    plugin: _foundation_accordion__WEBPACK_IMPORTED_MODULE_4__.Accordion,
    open: (plugin, target) => plugin.down(target),
    close: (plugin, target) => plugin.up(target),
    toggle: (plugin, target) => plugin.toggle(target)
  }
};

/**
 * ResponsiveAccordionTabs module.
 * @module foundation.responsiveAccordionTabs
 * @requires foundation.util.motion
 * @requires foundation.accordion
 * @requires foundation.tabs
 */

// 7.0 line A, slice S11: the wrapper runs on the native layer, and the mq
// switch is an explicit destroy+rebuild of the inner Accordion/Tabs. The 6.x
// code kept a storezfData/zfPluginBase "store/restore" illusion around the
// swap - archaeology (confirmed against the 6.x base class): the restore
// line wrote the PREVIOUS inner instance into the `zfPlugin` jQuery data
// slot and the inner destroy() on the next line removed it again, so the
// restore never survived and every switch was in fact rebuild-only. The
// phantom keys are no longer written; the wrapper registers itself in the
// Registry like every plugin (S2), and the inner ctor/destroy dance around
// the registry slot mirrors the old zfPlugin guard/reoccupy machine.
class ResponsiveAccordionTabs extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.Plugin {
  /**
   * Creates a new instance of a responsive accordion tabs.
   * @class
   * @name ResponsiveAccordionTabs
   * @fires ResponsiveAccordionTabs#init
   * @param {jQuery} element - jQuery object to make into Responsive Accordion Tabs.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.deepMerge)({}, ResponsiveAccordionTabs.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.datasetOptions)(this.$element), options);
    this.rules = this.$element.getAttribute('data-responsive-accordion-tabs');
    this.currentMq = null;
    this.currentRule = null;
    this.currentPlugin = null;
    this.className = 'ResponsiveAccordionTabs'; // ie9 back compat
    if (!this.$element.getAttribute('id')) {
      this.$element.setAttribute('id', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'responsiveaccordiontabs'));
    }
    this._init();
    this._events();
  }

  /**
   * Initializes the Menu by parsing the classes from the 'data-responsive-accordion-tabs' attribute on the element.
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
    this._getAllOptions();
    if (Object.keys(this.rules).length !== 0) {
      this._checkMediaQueries();
    }
  }
  _getAllOptions() {
    //get all defaults and options
    var _this = this;
    _this.allOptions = {};
    for (var key in MenuPlugins) {
      if (MenuPlugins.hasOwnProperty(key)) {
        var obj = MenuPlugins[key];
        try {
          // a detached probe element (the 6.x $('<ul></ul>') was detached
          // too - the inner plugins tolerate it through their guards)
          var dummyPlugin = document.createElement('ul');
          var tmpPlugin = new obj.plugin(dummyPlugin, _this.options);
          for (var keyKey in tmpPlugin.options) {
            if (tmpPlugin.options.hasOwnProperty(keyKey) && keyKey !== 'zfPlugin') {
              var objObj = tmpPlugin.options[keyKey];
              _this.allOptions[keyKey] = objObj;
            }
          }
          tmpPlugin.destroy();
        } catch (e) {
          console.warn(`Warning: Problems getting Accordion/Tab options: ${e}`);
        }
      }
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
    // there (equalizer/tabs/responsiveToggle/responsiveMenu/offcanvas all
    // flipped with the producer in the same move).
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

    // mq switch = explicit rebuild (see the class comment): tear the current
    // inner instance down, convert the markup for the new type, construct
    // the new inner. The rebuilt inner writes its own uuid attr and takes
    // over the registry slot the base destroy just freed - the same state
    // machine the 6.x zfPlugin key ran.
    if (this.currentPlugin) this.currentPlugin.destroy();
    this._handleMarkup(this.rules[matchedMq].cssClass);
    this.currentRule = this.rules[matchedMq];
    this.currentPlugin = new this.currentRule.plugin(this.$element, this.options);
  }

  // 7.0 terminal form: the 6.x markup conversion moved nodes through
  // jQuery collection ops; each step is the same move on plain elements.
  _handleMarkup(toSet) {
    var _this = this,
      fromString = 'accordion';
    var elementId = this.$element.getAttribute('id');
    var panelsContainer = document.querySelector(`[data-tabs-content=${elementId}]`);
    if (panelsContainer) fromString = 'tabs';
    if (fromString === toSet) {
      return;
    }
    var tabsTitle = _this.allOptions.linkClass ? _this.allOptions.linkClass : 'tabs-title';
    var tabsPanel = _this.allOptions.panelClass ? _this.allOptions.panelClass : 'tabs-panel';
    this.$element.removeAttribute('role');
    var liHeads = Array.from(this.$element.children).filter(el => el.matches(`.${tabsTitle},[data-accordion-item]`));
    liHeads.forEach(li => {
      li.classList.remove(tabsTitle, 'accordion-item');
      li.removeAttribute('data-accordion-item');
    });
    var liHeadsA = liHeads.map(li => li.querySelector(':scope > a'));
    liHeadsA.forEach(a => a && a.classList.remove('accordion-title'));
    var panels;
    if (fromString === 'tabs') {
      panels = Array.from(panelsContainer.querySelectorAll(`:scope > .${tabsPanel}`));
      panels.forEach(panel => {
        panel.classList.remove(tabsPanel);
        panel.removeAttribute('role');
        panel.removeAttribute('aria-hidden');
        panel.removeAttribute('aria-labelledby');
        var link = panel.querySelector(':scope > a');
        if (link) {
          link.removeAttribute('role');
          link.removeAttribute('aria-controls');
          link.removeAttribute('aria-selected');
        }
      });
    } else {
      panels = liHeads.map(li => li.querySelector(':scope > [data-tab-content]')).filter(Boolean);
      panels.forEach(panel => panel.classList.remove('accordion-content'));
    }
    panels.forEach(panel => {
      panel.style.display = '';
      panel.style.visibility = '';
    });
    liHeads.forEach(li => {
      li.style.display = '';
      li.style.visibility = '';
    });
    if (toSet === 'accordion') {
      panels.forEach(function (panel, key) {
        var head = liHeads[key];
        head.appendChild(panel);
        panel.classList.add('accordion-content');
        panel.setAttribute('data-tab-content', '');
        panel.classList.remove('is-active');
        panel.style.height = '';
        head.classList.add('accordion-item');
        head.setAttribute('data-accordion-item', '');
        var link = liHeadsA[key];
        if (link) {
          link.classList.add('accordion-title');
        }
      });
      // .after(placeholder).detach(): a marker div takes the tabs-content
      // container's place for the trip back to tabs. The 6.x form ran this
      // inside the loop, but the first detach left the later .after() calls
      // silent no-ops - one placeholder, once.
      var placeholder = document.createElement('div');
      placeholder.id = 'tabs-placeholder-' + elementId;
      panelsContainer.parentElement.insertBefore(placeholder, panelsContainer.nextSibling);
      panelsContainer.remove();
    } else if (toSet === 'tabs') {
      var tabsContent = document.querySelector(`[data-tabs-content=${elementId}]`);
      // A distinct name from the accordion branch's `placeholder`: two
      // function-scoped vars of the same name confused the binding context
      // (block-scoped-var).
      var tabsPlaceholder = document.getElementById('tabs-placeholder-' + elementId);
      if (tabsPlaceholder) {
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        tabsPlaceholder.parentElement.insertBefore(tabsContent, tabsPlaceholder.nextSibling);
        tabsContent.setAttribute('data-tabs-content', elementId);
        tabsPlaceholder.remove();
      } else {
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        this.$element.parentElement.insertBefore(tabsContent, this.$element.nextSibling);
        tabsContent.setAttribute('data-tabs-content', elementId);
      }
      panels.forEach(function (panel, key) {
        var link = liHeadsA[key];
        tabsContent.appendChild(panel);
        panel.classList.add(tabsPanel);
        var hash = link.hash.slice(1);
        var id = panel.getAttribute('id') || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'accordion');
        if (hash !== id) {
          if (hash !== '') {
            panel.setAttribute('id', hash);
          } else {
            hash = id;
            panel.setAttribute('id', hash);
            link.setAttribute('href', link.getAttribute('href').replace('#', '') + '#' + hash);
          }
        }
        var isActive = liHeads[key].classList.contains('is-active');
        if (isActive) {
          panel.classList.add('is-active');
        }
      });
      liHeads.forEach(li => li.classList.add(tabsTitle));
    }
    ;
  }

  /**
   * Opens the plugin pane defined by `target`.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to open.
   * @see Accordion.down
   * @see Tabs.selectTab
   * @function
   */
  open() {
    if (this.currentRule && typeof this.currentRule.open === 'function') {
      return this.currentRule.open(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Closes the plugin pane defined by `target`. Not availaible for Tabs.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to close.
   * @see Accordion.up
   * @function
   */
  close() {
    if (this.currentRule && typeof this.currentRule.close === 'function') {
      return this.currentRule.close(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Toggles the plugin pane defined by `target`. Not availaible for Tabs.
   * @param {jQuery | String} target - jQuery object or string of the id of the pane to toggle.
   * @see Accordion.toggle
   * @function
   */
  toggle() {
    if (this.currentRule && typeof this.currentRule.toggle === 'function') {
      return this.currentRule.toggle(this.currentPlugin, ...arguments);
    }
  }

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  _destroy() {
    // The inner plugin cleans its own listeners/state (S8/S9 double-off
    // discipline); the wrapper only owns the mq seam listener (S13 flip).
    if (this.currentPlugin) this.currentPlugin.destroy();
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }
}
ResponsiveAccordionTabs.defaults = {};


/***/ }),

/***/ "./foundation.accordion":
/*!************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.accordion"],"amd":"./foundation.accordion","commonjs":"./foundation.accordion","commonjs2":"./foundation.accordion"} ***!
  \************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_accordion__;

/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.tabs":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.tabs"],"amd":"./foundation.tabs","commonjs":"./foundation.tabs","commonjs2":"./foundation.tabs"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_tabs__;

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
/*!******************************************************************!*\
  !*** ./js/entries/plugins/foundation.responsiveAccordionTabs.js ***!
  \******************************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   ResponsiveAccordionTabs: () => (/* reexport safe */ _foundation_responsiveAccordionTabs__WEBPACK_IMPORTED_MODULE_1__.ResponsiveAccordionTabs)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_responsiveAccordionTabs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.responsiveAccordionTabs */ "./js/foundation.responsiveAccordionTabs.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_responsiveAccordionTabs__WEBPACK_IMPORTED_MODULE_1__.ResponsiveAccordionTabs, 'ResponsiveAccordionTabs');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.responsiveAccordionTabs.js.map