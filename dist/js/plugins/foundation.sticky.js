(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom", "./foundation.util.mediaQuery", "./foundation.util.triggers"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.sticky"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.sticky.js":
/*!*********************************!*\
  !*** ./js/foundation.sticky.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Sticky: () => (/* binding */ Sticky)
/* harmony export */ });
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__);







/**
 * Sticky module.
 * @module foundation.sticky
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

class Sticky extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  /**
   * Creates a new instance of a sticky thing.
   * @class
   * @name Sticky
   * @param {jQuery} element - jQuery object to make sticky.
   * @param {Object} options - options object passed when creating the element programmatically.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.deepMerge)({}, Sticky.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.className = 'Sticky'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_4__.Triggers.init();
    this._init();
  }

  /**
   * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
   * @function
   * @private
   */
  _init() {
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__.MediaQuery._init();
    var parentContainer = this.$element.parentElement && this.$element.parentElement.matches('[data-sticky-container]') ? this.$element.parentElement : null,
      id = this.$element.id || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'sticky'),
      _this = this;
    if (parentContainer) {
      this.$container = parentContainer;
    } else {
      this.wasWrapped = true;
      // .wrap(htmlString): a container built from the option markup
      var probe = document.createElement('template');
      probe.innerHTML = this.options.container.trim();
      var wrapper = probe.content.firstElementChild;
      this.$element.parentElement.insertBefore(wrapper, this.$element);
      wrapper.appendChild(this.$element);
      this.$container = this.$element.parentElement;
    }
    this.$container.classList.add(this.options.containerClass);

    // State attributes go through the native layer (7.0 line A, S10).
    this.$element.classList.add(this.options.stickyClass);
    this.$element.setAttribute('data-resize', id);
    this.$element.setAttribute('data-mutate', id);
    if (this.options.anchor !== '') {
      var anchorInit = document.getElementById(_this.options.anchor);
      if (anchorInit) {
        anchorInit.setAttribute('data-mutate', id);
      }
    }
    this.scrollCount = this.options.checkEvery;
    this.isStuck = false;
    this.onLoadListener = (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.onLoad)(window, function () {
      // A load callback can land after destroy() nulled the instance state
      // (Magellan S7 precedent).
      if (!_this.$element) {
        return;
      }

      //We calculate the container height to have correct values for anchor points offset calculation.
      _this.containerHeight = window.getComputedStyle(_this.$element).display === "none" ? 0 : _this.$element.getBoundingClientRect().height;
      _this.$container.style.height = _this.containerHeight + 'px';
      _this.elemHeight = _this.containerHeight;
      if (_this.options.anchor !== '') {
        _this.$anchor = document.getElementById(_this.options.anchor);
      } else {
        _this._parsePoints();
      }
      _this._setSizes(function () {
        var scroll = window.pageYOffset;
        _this._calc(false, scroll);
        //Unstick the element will ensure that proper classes are set.
        if (!_this.isStuck) {
          _this._removeSticky(scroll >= _this.topPoint ? false : true);
        }
      });
      _this._events(id.split('-').reverse().join('-'));
    });
  }

  /**
   * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
   * @function
   * @private
   */
  _parsePoints() {
    var top = this.options.topAnchor === "" ? 1 : this.options.topAnchor,
      btm = this.options.btmAnchor === "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
      pts = [top, btm],
      breaks = {};
    for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
      var pt;
      if (typeof pts[i] === 'number') {
        pt = pts[i];
      } else {
        var place = pts[i].split(':'),
          anchor = document.getElementById(place[0]);

        // offset().top equivalent (7.0 line A, S10): viewport-relative rect
        // plus the current scroll, the S7 SmoothScroll precedent.
        pt = anchor.getBoundingClientRect().top + window.pageYOffset;
        if (place[1] && place[1].toLowerCase() === 'bottom') {
          pt += anchor.getBoundingClientRect().height;
        }
      }
      breaks[i] = pt;
    }
    this.points = breaks;
    return;
  }

  /**
   * Adds event handlers for the scrolling element.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _events(id) {
    var _this = this,
      scrollListener = this.scrollListener = `scroll.zf.${id}`;
    if (this.isOn) {
      return;
    }
    if (this.canStick) {
      this.isOn = true;
      // S10: the window scroll consumer flips to the native event layer -
      // real scroll events reach it directly, under the per-instance
      // namespace so the destroy path can drop it precisely.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, scrollListener);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, scrollListener, function () {
        if (_this.scrollCount === 0) {
          _this.scrollCount = _this.options.checkEvery;
          _this._setSizes(function () {
            _this._calc(false, window.pageYOffset);
          });
        } else {
          _this.scrollCount--;
          _this._calc(false, window.pageYOffset);
        }
      });
    }

    // S10: the resizeme consumer flips to the native event layer (S4
    // producer), like Equalizer S8.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'resizeme.zf.trigger');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'resizeme.zf.trigger', function () {
      _this._eventsHandler(id);
    });

    // S10 group flip: the mutateme consumers (element and anchor) join the
    // native event layer together with the last jQuery-synthesized
    // producers (Tabs forward, ResponsiveToggle animated half), so every
    // listener receives each dispatch exactly once.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'mutateme.zf.trigger', function () {
      _this._eventsHandler(id);
    });
    if (this.$anchor) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$anchor, 'mutateme.zf.trigger', function () {
        _this._eventsHandler(id);
      });
    }
  }

  /**
   * Handler for events.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _eventsHandler(id) {
    var _this = this,
      scrollListener = this.scrollListener = `scroll.zf.${id}`;
    _this._setSizes(function () {
      _this._calc(false);
      if (_this.canStick) {
        if (!_this.isOn) {
          _this._events(id);
        }
      } else if (_this.isOn) {
        _this._pauseListeners(scrollListener);
      }
    });
  }

  /**
   * Removes event handlers for scroll and change events on anchor.
   * @fires Sticky#pause
   * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
   */
  _pauseListeners(scrollListener) {
    this.isOn = false;
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, scrollListener);

    /**
     * Fires when the plugin is paused due to resize event shrinking the view.
     * @event Sticky#pause
     * @private
     */
    // S10: real, bubbling CustomEvent - native listeners receive it
    // directly, still-on-jQuery listeners through the real-event pass-
    // through (white absorption).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'pause.zf.sticky');
  }

  /**
   * Called on every `scroll` event and on `_init`
   * fires functions based on booleans and cached values
   * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
   * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
   */
  _calc(checkSizes, scroll) {
    if (checkSizes) {
      this._setSizes();
    }
    if (!this.canStick) {
      if (this.isStuck) {
        this._removeSticky(true);
      }
      return false;
    }
    if (!scroll) {
      scroll = window.pageYOffset;
    }
    if (scroll >= this.topPoint) {
      if (scroll <= this.bottomPoint) {
        if (!this.isStuck) {
          this._setSticky();
        }
      } else {
        if (this.isStuck) {
          this._removeSticky(false);
        }
      }
    } else {
      if (this.isStuck) {
        this._removeSticky(true);
      }
    }
  }

  /**
   * Causes the $element to become stuck.
   * Adds `position: fixed;`, and helper classes.
   * @fires Sticky#stuckto
   * @function
   * @private
   */
  _setSticky() {
    var _this = this,
      stickTo = this.options.stickTo,
      mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
      notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
      css = {};
    css[mrgn] = `${this.options[mrgn]}em`;
    css[stickTo] = 0;
    css[notStuckTo] = 'auto';
    this.isStuck = true;
    // State classes go through the native layer (7.0 line A, S10); the css
    // writes stay on jQuery (css seam).
    this.$element.classList.remove('is-anchored', `is-at-${notStuckTo}`);
    this.$element.classList.add('is-stuck', `is-at-${stickTo}`);
    Object.keys(css).forEach(function (prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become `position: fixed;`
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
     * @event Sticky#stuckto
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, `sticky.zf.stuckto:${stickTo}`);
    // S10: the transitionend-family consumer flips to the native event
    // layer - real browser events reach it directly. M1's off-then-on wipe
    // carries over as the Events.off form.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky', function () {
      _this._setSizes();
    });
  }

  /**
   * Causes the $element to become unstuck.
   * Removes `position: fixed;`, and helper classes.
   * Adds other helper classes.
   * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
   * @fires Sticky#unstuckfrom
   * @private
   */
  _removeSticky(isTop) {
    var stickTo = this.options.stickTo,
      stickToTop = stickTo === 'top',
      css = {},
      anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
      mrgn = stickToTop ? 'marginTop' : 'marginBottom',
      topOrBottom = isTop ? 'top' : 'bottom';
    css[mrgn] = 0;
    css.bottom = 'auto';
    if (isTop) {
      css.top = 0;
    } else {
      css.top = anchorPt;
    }
    this.isStuck = false;
    // State classes go through the native layer (7.0 line A, S10).
    this.$element.classList.remove('is-stuck', `is-at-${stickTo}`);
    this.$element.classList.add('is-anchored', `is-at-${topOrBottom}`);
    Object.keys(css).forEach(function (prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become anchored.
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
     * @event Sticky#unstuckfrom
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, `sticky.zf.unstuckfrom:${topOrBottom}`);
  }

  /**
   * Sets the $element and $container sizes for plugin.
   * Calls `_setBreakPoints`.
   * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
   * @private
   */
  _setSizes(cb) {
    this.canStick = _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__.MediaQuery.is(this.options.stickyOn);
    if (!this.canStick) {
      if (cb && typeof cb === 'function') {
        cb();
      }
      return;
    }
    var newElemWidth = this.$container.getBoundingClientRect().width,
      comp = window.getComputedStyle(this.$container),
      pdngl = parseInt(comp['padding-left'], 10),
      pdngr = parseInt(comp['padding-right'], 10);
    if (this.$anchor) {
      this.anchorHeight = this.$anchor.getBoundingClientRect().height;
    } else {
      this._parsePoints();
    }
    this.$element.style.maxWidth = `${newElemWidth - pdngl - pdngr}px`;

    // Recalculate the height only if it is "dynamic"
    if (this.options.dynamicHeight || !this.containerHeight) {
      // Get the sticked element height and apply it to the container to "hold the place"
      var newContainerHeight = this.$element.getBoundingClientRect().height || this.containerHeight;
      newContainerHeight = window.getComputedStyle(this.$element).display === "none" ? 0 : newContainerHeight;
      this.$container.style.height = newContainerHeight + 'px';
      this.containerHeight = newContainerHeight;
    }
    this.elemHeight = this.containerHeight;
    if (!this.isStuck) {
      if (this.$element.classList.contains('is-at-bottom')) {
        var anchorPt = (this.points ? this.points[1] - (this.$container.getBoundingClientRect().top + window.pageYOffset) : this.anchorHeight) - this.elemHeight;
        this.$element.style.top = anchorPt + 'px';
      }
    }
    this._setBreakPoints(this.containerHeight, function () {
      if (cb && typeof cb === 'function') {
        cb();
      }
    });
  }

  /**
   * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
   * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
   * @param {Function} cb - optional callback function to be called on completion.
   * @private
   */
  _setBreakPoints(elemHeight, cb) {
    if (!this.canStick) {
      if (cb && typeof cb === 'function') {
        cb();
      }
      return false;
    }
    var mTop = emCalc(this.options.marginTop),
      mBtm = emCalc(this.options.marginBottom),
      // offset().top equivalent (7.0 line A, S10, S7 SmoothScroll
      // precedent).
      topPoint = this.points ? this.points[0] : this.$anchor.getBoundingClientRect().top + window.pageYOffset,
      bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,
      winHeight = window.innerHeight;
    if (this.options.stickTo === 'top') {
      topPoint -= mTop;
      bottomPoint -= elemHeight + mTop;
    } else if (this.options.stickTo === 'bottom') {
      topPoint -= winHeight - (elemHeight + mBtm);
      bottomPoint -= winHeight - mBtm;
    } else {
      //this would be the stickTo: both option... tricky
    }
    this.topPoint = topPoint;
    this.bottomPoint = bottomPoint;
    if (cb && typeof cb === 'function') {
      cb();
    }
  }

  /**
   * Destroys the current sticky element.
   * Resets the element to the top position first.
   * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
   * @function
   */
  _destroy() {
    this._removeSticky(true);

    // The css resets and the state classes.
    this.$element.classList.remove(`${this.options.stickyClass}`, 'is-anchored', 'is-at-top');
    this.$element.style.height = '';
    this.$element.style.top = '';
    this.$element.style.bottom = '';
    this.$element.style.maxWidth = '';
    // Native side: the flipped resizeme/mutateme/transitionend listeners and
    // the per-instance window scroll listener drop precisely. The mutateme
    // listeners live on the native layer since the S10 group flip.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'resizeme.zf.trigger mutateme.zf.trigger');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky');
    if (this.$anchor) {
      // The 'change.zf.sticky' off below is removed (S14): 6.x never bound a
      // change listener on the anchor (grep master confirms - only this off
      // existed), so the wipe always matched nothing, and on the native
      // layer it could never unregister anything either. Dead code.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$anchor, 'mutateme.zf.trigger');
    }
    if (this.scrollListener) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, this.scrollListener);
    if (this.onLoadListener) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer

    if (this.wasWrapped) {
      // .unwrap(): the wrapper is replaced by its children
      const wrapper = this.$element.parentElement;
      while (wrapper.firstChild) {
        wrapper.parentElement.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    } else {
      this.$container.classList.remove(this.options.containerClass);
      this.$container.style.height = '';
    }
  }
}
Sticky.defaults = {
  /**
   * Customizable container template. Add your own classes for styling and sizing.
   * @option
   * @type {string}
   * @default '&lt;div data-sticky-container&gt;&lt;/div&gt;'
   */
  container: '<div data-sticky-container></div>',
  /**
   * Location in the view the element sticks to. Can be `'top'` or `'bottom'`.
   * @option
   * @type {string}
   * @default 'top'
   */
  stickTo: 'top',
  /**
   * If anchored to a single element, the id of that element.
   * @option
   * @type {string}
   * @default ''
   */
  anchor: '',
  /**
   * If using more than one element as anchor points, the id of the top anchor.
   * @option
   * @type {string}
   * @default ''
   */
  topAnchor: '',
  /**
   * If using more than one element as anchor points, the id of the bottom anchor.
   * @option
   * @type {string}
   * @default ''
   */
  btmAnchor: '',
  /**
   * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginTop: 1,
  /**
   * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginBottom: 1,
  /**
   * Breakpoint string that is the minimum screen size an element should become sticky.
   * @option
   * @type {string}
   * @default 'medium'
   */
  stickyOn: 'medium',
  /**
   * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
   * @option
   * @type {string}
   * @default 'sticky'
   */
  stickyClass: 'sticky',
  /**
   * Class applied to sticky container. Foundation defaults to `sticky-container`.
   * @option
   * @type {string}
   * @default 'sticky-container'
   */
  containerClass: 'sticky-container',
  /**
   * If true (by default), keep the sticky container the same height as the element. Otherwise, the container height is set once and does not change.
   * @option
   * @type {boolean}
   * @default true
   */
  dynamicHeight: true,
  /**
   * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
   * @option
   * @type {number}
   * @default -1
   */
  checkEvery: -1
};

/**
 * Helper function to calculate em values
 * @param Number {em} - number of em's to calculate into pixels
 */
function emCalc(em) {
  return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
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
/*!*************************************************!*\
  !*** ./js/entries/plugins/foundation.sticky.js ***!
  \*************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Sticky: () => (/* reexport safe */ _foundation_sticky__WEBPACK_IMPORTED_MODULE_1__.Sticky)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_sticky__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.sticky */ "./js/foundation.sticky.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_sticky__WEBPACK_IMPORTED_MODULE_1__.Sticky, 'Sticky');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.sticky.js.map