(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.keyboard"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom", "./foundation.util.keyboard", "./foundation.util.mediaQuery", "./foundation.util.triggers"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.keyboard"), require("./foundation.util.mediaQuery"), require("./foundation.util.triggers"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.offcanvas"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.offcanvas.js":
/*!************************************!*\
  !*** ./js/foundation.offcanvas.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   OffCanvas: () => (/* binding */ OffCanvas)
/* harmony export */ });
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__);








/**
 * OffCanvas module.
 * @module foundation.offCanvas
 * @requires foundation.util.keyboard
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

class OffCanvas extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  /**
   * Creates a new instance of an off-canvas wrapper.
   * @class
   * @name OffCanvas
   * @fires OffCanvas#init
   * @param {Object} element - jQuery object to initialize.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.className = 'OffCanvas'; // ie9 back compat
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.deepMerge)({}, OffCanvas.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.contentClasses = {
      base: [],
      reveal: []
    };
    this.$lastTrigger = null;
    this.$triggers = [];
    this.position = 'left';
    this.$content = null;
    this.nested = !!this.options.nested;
    this.$sticky = [];
    this.isInCanvas = false;

    // Defines the CSS transition/position classes of the off-canvas content container.
    ['push', 'overlap'].forEach(val => {
      this.contentClasses.base.push('has-transition-' + val);
    });
    ['left', 'right', 'top', 'bottom'].forEach(val => {
      this.contentClasses.base.push('has-position-' + val);
      this.contentClasses.reveal.push('has-reveal-' + val);
    });

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__.Triggers.init();
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery._init();
    this._init();
    this._events();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.register('OffCanvas', {
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
   * @function
   * @private
   */
  _init() {
    var id = this.$element.getAttribute('id');

    // State attributes and classes go through the native layer (7.0 line A, S10).
    this.$element.setAttribute('aria-hidden', 'true');

    // Find off-canvas content, either by ID (if specified), by siblings or by closest selector (fallback)
    if (this.options.contentId) {
      this.$content = document.getElementById(this.options.contentId);
    } else {
      var siblingContent = Array.from(this.$element.parentElement.children).filter(el => el !== this.$element && el.matches('[data-off-canvas-content]'));
      this.$content = siblingContent[0] || this.$element.closest('[data-off-canvas-content]');
    }
    if (!this.options.contentId) {
      // Assume that the off-canvas element is nested if it isn't a sibling of the content
      this.nested = !(this.$content && this.$content.parentElement === this.$element.parentElement);
    } else if (this.options.contentId && this.options.nested === null) {
      // Warning if using content ID without setting the nested option
      // Once the element is nested it is required to work properly in this case
      console.warn('Remember to use the nested option if using the content ID option!');
    }
    if (this.nested === true) {
      // Force transition overlap if nested
      this.options.transition = 'overlap';
      // Remove appropriate classes if already assigned in markup
      this.$element.classList.remove('is-transition-push');
    }
    this.$element.classList.add(`is-transition-${this.options.transition}`, 'is-closed');

    // Find triggers that affect this element and add aria-expanded to them
    this.$triggers = Array.from(document.querySelectorAll(`[data-open="${id}"], [data-close="${id}"], [data-toggle="${id}"]`));
    this.$triggers.forEach(function (el) {
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-controls', id);
    });

    // Get position by checking for related CSS class
    this.position = this.$element.matches('.position-left, .position-top, .position-right, .position-bottom') ? this.$element.className.match(/position\-(left|top|right|bottom)/)[1] : this.position;

    // Add an overlay over the content if necessary
    if (this.options.contentOverlay === true) {
      var overlay = document.createElement('div');
      var overlayPosition = window.getComputedStyle(this.$element).position === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
      overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
      this.$overlay = overlay;
      if (overlayPosition === 'is-overlay-fixed') {
        this.$element.after(overlay);
      } else {
        this.$content.appendChild(overlay);
      }
    }

    // Get the revealOn option from the class.
    var revealOnRegExp = new RegExp((0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.RegExpEscape)(this.options.revealClass) + '([^\\s]+)', 'g');
    var revealOnClass = revealOnRegExp.exec(this.$element.className);
    if (revealOnClass) {
      this.options.isRevealed = true;
      this.options.revealOn = this.options.revealOn || revealOnClass[1];
    }

    // Ensure the `reveal-on-*` class is set.
    if (this.options.isRevealed === true && this.options.revealOn) {
      this.$element.classList.add(`${this.options.revealClass}${this.options.revealOn}`);
      this._setMQChecker();
    }
    if (this.options.transitionTime) {
      this.$element.style.transitionDuration = this.options.transitionTime;
    }

    // Find fixed elements that should stay fixed while off-canvas is opened
    this.$sticky = this.$content ? Array.from(this.$content.querySelectorAll('[data-off-canvas-sticky]')) : [];
    if (this.$sticky.length > 0 && this.options.transition === 'push') {
      // If there's at least one match force contentScroll:false because the absolute top value doesn't get recalculated on scroll
      // Limit to push transition since there's no transform scope for overlap
      this.options.contentScroll = false;
    }
    let inCanvasFor = this.$element.className.match(/\bin-canvas-for-(\w+)/);
    if (inCanvasFor && inCanvasFor.length === 2) {
      // Set `inCanvasOn` option if found in-canvas-for-[BREAKPONT] CSS class
      this.options.inCanvasOn = inCanvasFor[1];
    } else if (this.options.inCanvasOn) {
      // Ensure the CSS class is set
      this.$element.classList.add(`in-canvas-for-${this.options.inCanvasOn}`);
    }
    if (this.options.inCanvasOn) {
      this._checkInCanvas();
    }

    // Initally remove all transition/position CSS classes from off-canvas content container.
    this._removeContentClasses();
  }

  /**
   * Adds event handlers to the off-canvas wrapper and the exit overlay.
   * @function
   * @private
   */
  _events() {
    // S10: the open/close/toggle consumers run on the native event layer;
    // the Triggers producers dispatch element-local on both transports
    // since S4 (dispatchLocal), so exactly one layer holds the listener and
    // nothing double-fires.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'open.zf.trigger close.zf.trigger toggle.zf.trigger');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'open.zf.trigger', this.open.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'close.zf.trigger', this.close.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));

    // 7.0 terminal form: the keydown consumer runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'keydown.zf.offCanvas');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'keydown.zf.offCanvas', this._handleKeyboard.bind(this));
    if (this.options.closeOnClick === true) {
      var target = this.options.contentOverlay ? this.$overlay : this.$content;
      // S10: the close-on-click consumer runs on the native event layer -
      // real clicks arrive directly and jQuery-synthesized clicks on the
      // overlay/content ride the `.click()` shortcut bridge (reveal-native
      // precedent).
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(target, 'click.zf.offCanvas');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(target, 'click.zf.offCanvas', this.close.bind(this));
    }
    if (this.options.inCanvasOn) {
      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/tabs/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs all flipped with the producer in the same
      // move).
      if (this._inCanvasMqHandler) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
      this._inCanvasMqHandler = () => {
        this._checkInCanvas();
      };
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
    }
  }

  /**
   * Applies event listener for elements that will reveal at certain breakpoints.
   * @private
   */
  _setMQChecker() {
    var _this = this;
    this.onLoadListener = (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.onLoad)(window, function () {
      if (_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery.atLeast(_this.options.revealOn)) {
        _this.reveal(true);
      }
    });

    // S13 flip: the reveal-on-breakpoint watcher binds to the real
    // changed.zf.mediaquery broadcast on the native layer (see _events).
    if (this._revealMqHandler) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._revealMqHandler);
    this._revealMqHandler = function () {
      if (_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery.atLeast(_this.options.revealOn)) {
        _this.reveal(true);
      } else {
        _this.reveal(false);
      }
    };
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, 'changed.zf.mediaquery', this._revealMqHandler);
  }

  /**
   * Checks if InCanvas on current breakpoint and adjust off-canvas accordingly
   * @private
   */
  _checkInCanvas() {
    this.isInCanvas = _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery.atLeast(this.options.inCanvasOn);
    if (this.isInCanvas === true) {
      this.close();
    }
  }

  /**
   * Removes the CSS transition/position classes of the off-canvas content container.
   * Removing the classes is important when another off-canvas gets opened that uses the same content container.
   * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
   * @private
   */
  _removeContentClasses(hasReveal) {
    // State classes go through the native layer (7.0 line A, S10).
    if (typeof hasReveal !== 'boolean') {
      this.contentClasses.base.forEach(token => this.$content.classList.remove(token));
    } else if (hasReveal === false) {
      this.$content.classList.remove(`has-reveal-${this.position}`);
    }
  }

  /**
   * Adds the CSS transition/position classes of the off-canvas content container, based on the opening off-canvas element.
   * Beforehand any transition/position class gets removed.
   * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
   * @private
   */
  _addContentClasses(hasReveal) {
    this._removeContentClasses(hasReveal);
    if (typeof hasReveal !== 'boolean') {
      this.$content.classList.add(`has-transition-${this.options.transition}`, `has-position-${this.position}`);
    } else if (hasReveal === true) {
      this.$content.classList.add(`has-reveal-${this.position}`);
    }
  }

  /**
   * Preserves the fixed behavior of sticky elements on opening an off-canvas with push transition.
   * Since the off-canvas container has got a transform scope in such a case, it is done by calculating position absolute values.
   * @private
   */
  _fixStickyElements() {
    this.$sticky.forEach(el => {
      // If sticky element is currently fixed, adjust its top value to match absolute position due to transform scope
      // Limit to push transition because postion:fixed works without problems for overlap (no transform scope)
      if (window.getComputedStyle(el).position === 'fixed') {
        // Save current inline styling to restore it if undoing the absolute fixing
        // (the 6.x save rode jQuery's data cache; the expando keeps it invisible)
        let topVal = parseInt(window.getComputedStyle(el).top, 10);
        el.zfOffCanvasSticky = {
          top: topVal
        };
        let absoluteTopVal = window.pageYOffset + topVal;
        el.style.top = `${absoluteTopVal}px`;
        el.style.width = '100%';
        el.style.transition = 'none';
      }
    });
  }

  /**
   * Restores the original fixed styling of sticky elements after having closed an off-canvas that got pseudo fixed beforehand.
   * This reverts the changes of _fixStickyElements()
   * @private
   */
  _unfixStickyElements() {
    this.$sticky.forEach(el => {
      let stickyData = el.zfOffCanvasSticky;

      // If sticky element has got data object with prior values (meaning it was originally fixed) restore these values once off-canvas is closed
      if (typeof stickyData === 'object') {
        el.style.top = `${stickyData.top}px`;
        el.style.width = '';
        el.style.transition = '';
        el.zfOffCanvasSticky = '';
      }
    });
  }

  /**
   * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
   * @param {Boolean} isRevealed - true if element should be revealed.
   * @function
   */
  reveal(isRevealed) {
    if (isRevealed) {
      this.close();
      this.isRevealed = true;
      this.$element.setAttribute('aria-hidden', 'false');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'open.zf.trigger toggle.zf.trigger');
      this.$element.classList.remove('is-closed');
    } else {
      this.isRevealed = false;
      this.$element.setAttribute('aria-hidden', 'true');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'open.zf.trigger toggle.zf.trigger');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'open.zf.trigger', this.open.bind(this));
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'toggle.zf.trigger', this.toggle.bind(this));
      this.$element.classList.add('is-closed');
    }
    this._addContentClasses(isRevealed);
  }

  /**
   * Stops scrolling of the body when OffCanvas is open on mobile Safari and other troublesome browsers.
   * @function
   * @private
   */
  _stopScrolling() {
    return false;
  }

  /**
   * Save current finger y-position
   * @param event
   * @private
   */
  _recordScrollable(event) {
    const elem = this;
    elem.lastY = event.touches[0].pageY;
  }

  /**
   * Prevent further scrolling when it hits the edges
   * @param event
   * @private
   */
  _preventDefaultAtEdges(event) {
    // bound with the plugin instance as `this._edgesBound`'s target arg
    const elem = this;
    const _this = event.data || event.currentTarget.zfOffCanvas || this;
    const delta = elem.lastY - event.touches[0].pageY;
    elem.lastY = event.touches[0].pageY;
    if (!_this._canScroll(delta, elem)) {
      event.preventDefault();
    }
  }

  /**
   * Handle continuous scrolling of scrollbox
   * Don't bubble up to _preventDefaultAtEdges
   * @param event
   * @private
   */
  _scrollboxTouchMoved(event) {
    const elem = this;
    const _this = event.data;
    const parent = elem.closest('[data-off-canvas], [data-off-canvas-scrollbox-outer]');
    const delta = elem.lastY - event.touches[0].pageY;
    parent.lastY = elem.lastY = event.touches[0].pageY;
    event.stopPropagation();
    if (!_this._canScroll(delta, elem)) {
      if (!_this._canScroll(delta, parent)) {
        event.preventDefault();
      } else {
        parent.scrollTop += delta;
      }
    }
  }

  /**
   * Detect possibility of scrolling
   * @param delta
   * @param elem
   * @returns boolean
   * @private
   */
  _canScroll(delta, elem) {
    const up = delta < 0;
    const down = delta > 0;
    const allowUp = elem.scrollTop > 0;
    const allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
    return up && allowUp || down && allowDown;
  }

  /**
   * Opens the off-canvas menu.
   * @function
   * @param {Object} event - Event object passed from listener.
   * @param {jQuery} trigger - element that triggered the off-canvas to open.
   * @fires OffCanvas#opened
   * @todo also trigger 'open' event?
   */
  open(event, trigger) {
    if (this.$element.classList.contains('is-open') || this.isRevealed || this.isInCanvas) {
      return;
    }
    if (trigger) {
      this.$lastTrigger = trigger;
    }
    if (this.options.forceTo === 'top') {
      window.scrollTo(0, 0);
    } else if (this.options.forceTo === 'bottom') {
      window.scrollTo(0, document.body.scrollHeight);
    }
    Array.from(this.$element.parentElement.children).forEach(sib => {
      if (sib !== this.$element && sib.matches('[data-off-canvas-content]')) {
        sib.style.transitionDuration = this.options.transitionTime && this.options.transition !== 'overlap' ? this.options.transitionTime : '';
      }
    });

    // State classes and ARIA go through the native layer (7.0 line A, S10).
    this.$element.classList.add('is-open');
    this.$element.classList.remove('is-closed');
    this.$triggers.forEach(function (el) {
      el.setAttribute('aria-expanded', 'true');
    });
    this.$element.setAttribute('aria-hidden', 'false');
    this.$content.classList.add('is-open-' + this.position);

    // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
    // 7.0 terminal form: the touch guards run on the native event layer;
    // jQuery's event.data binding becomes a closure binding on the element
    // (the delegated scrollbox listeners keep the delegate form).
    if (this.options.contentScroll === false) {
      document.body.classList.add('is-off-canvas-open');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(document.body, 'touchmove.zf.offCanvas', this._stopScrolling);
      this._edgesBound = event => {
        this._preventDefaultAtEdges.call(event.currentTarget, event);
      };
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'touchstart.zf.offCanvas', this._recordScrollable);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'touchmove.zf.offCanvas', this._edgesBound);
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.delegate(this.$element, 'touchstart.zf.offCanvas', '[data-off-canvas-scrollbox]', this._recordScrollable);
      this._scrollboxBound = event => {
        const box = event.target.closest('[data-off-canvas-scrollbox]');
        if (box) {
          this._scrollboxTouchMoved.call(box, event);
        }
      };
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.delegate(this.$element, 'touchmove.zf.offCanvas', '[data-off-canvas-scrollbox]', this._scrollboxBound);
    }
    if (this.options.contentOverlay === true) {
      this.$overlay.classList.add('is-visible');
    }
    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
      this.$overlay.classList.add('is-closable');
    }
    if (this.options.autoFocus === true) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.one(this.$element, (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.transitionend)(this.$element), function () {
        if (!this.classList.contains('is-open')) {
          return; // exit if prematurely closed
        }
        var canvasFocus = this.querySelector('[data-autofocus]');
        if (canvasFocus) {
          canvasFocus.focus();
        } else {
          var firstLink = this.querySelector('a, button');
          if (firstLink) {
            firstLink.focus();
          }
        }
      });
    }
    if (this.options.trapFocus === true) {
      this.$content.setAttribute('tabindex', '-1');
      _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.trapFocus(this.$element);
    }
    if (this.options.transition === 'push') {
      this._fixStickyElements();
    }
    this._addContentClasses();

    /**
     * Fires when the off-canvas menu opens.
     * @event OffCanvas#opened
     */
    // S10: real, bubbling CustomEvent.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'opened.zf.offCanvas');

    /**
     * Fires when the off-canvas menu open transition is done.
     * @event OffCanvas#openedEnd
     */
    // 7.0 terminal form: the transitionend wait is an Events.one (the
    // coarse suite drives it through the native triggerHandler).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.one(this.$element, (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.transitionend)(this.$element), () => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'openedEnd.zf.offCanvas');
    });
  }

  /**
   * Closes the off-canvas menu.
   * @function
   * @param {Function} cb - optional cb to fire after closure.
   * @fires OffCanvas#close
   * @fires OffCanvas#closed
   */
  close() {
    if (!this.$element.classList.contains('is-open') || this.isRevealed) {
      return;
    }

    /**
     * Fires when the off-canvas menu closes.
     * @event OffCanvas#close
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'close.zf.offCanvas');
    this.$element.classList.remove('is-open');
    this.$element.setAttribute('aria-hidden', 'true');
    this.$content.classList.remove('is-open-left', 'is-open-top', 'is-open-right', 'is-open-bottom');
    if (this.options.contentOverlay === true) {
      this.$overlay.classList.remove('is-visible');
    }
    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
      this.$overlay.classList.remove('is-closable');
    }
    this.$triggers.forEach(function (el) {
      el.setAttribute('aria-expanded', 'false');
    });

    // Listen to transitionEnd: add class, re-enable scrolling and release focus when done.
    // 7.0 terminal form: the transitionend wait is an Events.one (the
    // coarse suite drives it through the native triggerHandler).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.one(this.$element, (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.transitionend)(this.$element), () => {
      this.$element.classList.add('is-closed');
      this._removeContentClasses();
      if (this.options.transition === 'push') {
        this._unfixStickyElements();
      }

      // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        document.body.classList.remove('is-off-canvas-open');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(document.body, 'touchmove.zf.offCanvas', this._stopScrolling);
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'touchstart.zf.offCanvas touchmove.zf.offCanvas');
      }
      if (this.options.trapFocus === true) {
        this.$content.removeAttribute('tabindex');
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.releaseFocus(this.$element);
      }

      /**
       * Fires when the off-canvas menu close transition is done.
       * @event OffCanvas#closed
       */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'closed.zf.offCanvas');
    });
  }

  /**
   * Toggles the off-canvas menu open or closed.
   * @function
   * @param {Object} event - Event object passed from listener.
   * @param {jQuery} trigger - element that triggered the off-canvas to open.
   */
  toggle(event, trigger) {
    if (this.$element.classList.contains('is-open')) {
      this.close(event, trigger);
    } else {
      this.open(event, trigger);
    }
  }

  /**
   * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
   * @function
   * @private
   */
  _handleKeyboard(e) {
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.handleKey(e, 'OffCanvas', {
      close: () => {
        this.close();
        // the empty-collection .focus() was a silent no-op in 6.x
        if (this.$lastTrigger) {
          this.$lastTrigger.focus();
        }
        return true;
      },
      handled: () => {
        e.preventDefault();
      }
    });
  }

  /**
   * Destroys the OffCanvas plugin.
   * @function
   */
  _destroy() {
    this.close();
    // The zf-namespaced listeners on the element and overlay (the native
    // table the library owns), plus the namespaceless transitionend waits -
    // a late real transitionend would dereference the nulled instance.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, '.zf.trigger .zf.offCanvas');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.transitionend)(this.$element));
    if (this.$overlay) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$overlay, '.zf.offCanvas');
    }
    if (this._inCanvasMqHandler) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._inCanvasMqHandler);
    if (this._revealMqHandler) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, 'changed.zf.mediaquery', this._revealMqHandler);
    if (this.onLoadListener) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
  }
}
OffCanvas.defaults = {
  /**
   * Allow the user to click outside of the menu to close it.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Adds an overlay on top of `[data-off-canvas-content]`.
   * @option
   * @type {boolean}
   * @default true
   */
  contentOverlay: true,
  /**
   * Target an off-canvas content container by ID that may be placed anywhere. If null the closest content container will be taken.
   * @option
   * @type {?string}
   * @default null
   */
  contentId: null,
  /**
   * Define the off-canvas element is nested in an off-canvas content. This is required when using the contentId option for a nested element.
   * @option
   * @type {boolean}
   * @default null
   */
  nested: null,
  /**
   * Enable/disable scrolling of the main content when an off canvas panel is open.
   * @option
   * @type {boolean}
   * @default true
   */
  contentScroll: true,
  /**
   * Amount of time the open and close transition requires, including the appropriate milliseconds (`ms`) or seconds (`s`) unit (e.g. `500ms`, `.75s`) If none selected, pulls from body style.
   * @option
   * @type {string}
   * @default null
   */
  transitionTime: null,
  /**
   * Type of transition for the OffCanvas menu. Options are 'push', 'detached' or 'slide'.
   * @option
   * @type {string}
   * @default push
   */
  transition: 'push',
  /**
   * Force the page to scroll to top or bottom on open.
   * @option
   * @type {?string}
   * @default null
   */
  forceTo: null,
  /**
   * Allow the OffCanvas to remain open for certain breakpoints.
   * @option
   * @type {boolean}
   * @default false
   */
  isRevealed: false,
  /**
   * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
   * @option
   * @type {?string}
   * @default null
   */
  revealOn: null,
  /**
   * Breakpoint at which the off-canvas gets moved into canvas content and acts as regular page element.
   * @option
   * @type {?string}
   * @default null
   */
  inCanvasOn: null,
  /**
   * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
   * @option
   * @type {boolean}
   * @default true
   */
  autoFocus: true,
  /**
   * Class used to force an OffCanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
   * @option
   * @type {string}
   * @default reveal-for-
   * @todo improve the regex testing for this.
   */
  revealClass: 'reveal-for-',
  /**
   * Triggers optional focus trapping when opening an OffCanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
   * @option
   * @type {boolean}
   * @default false
   */
  trapFocus: false
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
/*!****************************************************!*\
  !*** ./js/entries/plugins/foundation.offcanvas.js ***!
  \****************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   OffCanvas: () => (/* reexport safe */ _foundation_offcanvas__WEBPACK_IMPORTED_MODULE_1__.OffCanvas)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_offcanvas__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.offcanvas */ "./js/foundation.offcanvas.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_offcanvas__WEBPACK_IMPORTED_MODULE_1__.OffCanvas, 'OffCanvas');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.offcanvas.js.map