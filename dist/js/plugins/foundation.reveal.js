(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.keyboard"), require("./foundation.util.mediaQuery"), require("./foundation.util.motion"), require("./foundation.util.triggers"), require("./foundation.util.touch"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.events", "./foundation.util.dom", "./foundation.util.keyboard", "./foundation.util.mediaQuery", "./foundation.util.motion", "./foundation.util.triggers", "./foundation.util.touch"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.events"), require("./foundation.util.dom"), require("./foundation.util.keyboard"), require("./foundation.util.mediaQuery"), require("./foundation.util.motion"), require("./foundation.util.triggers"), require("./foundation.util.touch"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.reveal"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.reveal.js":
/*!*********************************!*\
  !*** ./js/foundation.reveal.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Reveal: () => (/* binding */ Reveal)
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
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__);










/**
 * Reveal module.
 * @module foundation.reveal
 * @requires foundation.util.keyboard
 * @requires foundation.util.touch
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.events
 * @requires foundation.util.dom
 * @requires foundation.util.motion if using animations
 */

// `$('.reveal:visible')` replacement (7.0 line A, S6): the compound
// pseudo-class has no native equivalent, so the scan runs through
// querySelectorAll and Dom's narrow visibility filter per element.
function countVisibleReveals() {
  let count = 0;
  document.querySelectorAll('.reveal').forEach(element => {
    if ((0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.visible)(element)) {
      count++;
    }
  });
  return count;
}

// `$(document).height()` / `$(window).height()` equivalents. The max()
// formula is load-bearing: while `html.is-reveal-open` is applied (the
// stylesheet puts `position: fixed` on html), documentElement.scrollHeight
// collapses to the viewport, but body's scrollHeight still reflects the
// content - jQuery's formula kept seeing "page taller than viewport" and so
// kept the zf-has-scroll scrollbar class; a naive
// documentElement.scrollHeight comparison would drop it and re-introduce
// the scrollbar shift the class exists to prevent.
function documentHeight() {
  const body = document.body;
  const html = document.documentElement;
  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
}
function windowHeight() {
  return document.documentElement.clientHeight;
}
class Reveal extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  /**
   * Creates a new instance of Reveal.
   * @class
   * @name Reveal
   * @param {jQuery} element - jQuery object to use for the modal.
   * @param {Object} options - optional parameters.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.deepMerge)({}, Reveal.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.className = 'Reveal'; // ie9 back compat
    this._init();

    // Touch and Triggers init are idempotent, just need to make sure they are initialized
    _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__.Touch.init();
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__.Triggers.init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.register('Reveal', {
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the modal by adding the overlay and close buttons, (if selected).
   * @private
   */
  _init() {
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery._init();
    this.id = this.$element.id;
    this.isActive = false;
    this.cached = {
      mq: _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_4__.MediaQuery.current
    };
    var openAnchors = Array.from(document.querySelectorAll(`[data-open="${this.id}"]`));
    this.$anchor = openAnchors.length ? openAnchors : Array.from(document.querySelectorAll(`[data-toggle="${this.id}"]`));
    this.$anchor.forEach(function (anchor) {
      anchor.setAttribute('aria-controls', this.id);
      anchor.setAttribute('aria-haspopup', 'dialog');
      anchor.setAttribute('tabindex', '0');
    }, this);
    if (this.options.fullScreen || this.$element.classList.contains('full')) {
      this.options.fullScreen = true;
      this.options.overlay = false;
    }
    if (this.options.overlay && !this.$overlay) {
      this.$overlay = this._makeOverlay(this.id);
    }
    this.$element.setAttribute('role', 'dialog');
    this.$element.setAttribute('aria-hidden', 'true');
    this.$element.setAttribute('data-yeti-box', this.id);
    this.$element.setAttribute('data-resize', this.id);
    if (this.$overlay) {
      // appendChild moves the element - the same net effect as the former
      // detach().appendTo() jQuery dance.
      this.$overlay.appendChild(this.$element);
    } else {
      document.querySelector(this.options.appendTo).appendChild(this.$element);
      this.$element.classList.add('without-overlay');
    }
    this._events();
    if (this.options.deepLink && window.location.hash === `#${this.id}`) {
      this.onLoadListener = (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.onLoad)(window, () => this.open());
    }
  }

  /**
   * Creates an overlay div to display behind the modal.
   * The element is created and appended natively (7.0 line A, S6); it is
   * stored as a jQuery collection because the public `plugin.$overlay`
   * surface stays jQuery in the mixed state.
   * @private
   */
  _makeOverlay() {
    var additionalOverlayClasses = '';
    if (this.options.additionalOverlayClasses) {
      additionalOverlayClasses = ' ' + this.options.additionalOverlayClasses;
    }
    const overlay = document.createElement('div');
    overlay.className = 'reveal-overlay' + additionalOverlayClasses;
    document.querySelector(this.options.appendTo).appendChild(overlay);
    // terminal form: the element (the mixed state wrapped it)
    return overlay;
  }

  /**
   * Native stand-in for jQuery's `.show()`: clears an inline display
   * override and, when the stylesheet still hides the element (`.reveal`
   * and `.reveal-overlay` ship `display: none`), falls back to the default
   * display of a block element - what jQuery's getDefaultDisplay resolved
   * to for everything this plugin shows.
   * @private
   */
  _show(element) {
    element.style.display = '';
    if (window.getComputedStyle(element).display === 'none') {
      element.style.display = 'block';
    }
  }

  /**
   * Updates position of modal
   * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
   * @private
   */
  _updatePosition() {
    // outerWidth/Height(): the rect dimension (border-box, no margin);
    // $(window).width(): the viewport
    var width = this.$element.offsetWidth;
    var outerWidth = window.innerWidth;
    var height = this.$element.offsetHeight;
    var outerHeight = window.innerHeight;
    var left,
      top = null;
    if (this.options.hOffset === 'auto') {
      left = parseInt((outerWidth - width) / 2, 10);
    } else {
      left = parseInt(this.options.hOffset, 10);
    }
    if (this.options.vOffset === 'auto') {
      if (height > outerHeight) {
        top = parseInt(Math.min(100, outerHeight / 10), 10);
      } else {
        top = parseInt((outerHeight - height) / 4, 10);
      }
    } else if (this.options.vOffset !== null) {
      top = parseInt(this.options.vOffset, 10);
    }
    if (top !== null) {
      this.$element.style.top = top + 'px';
    }

    // only worry about left if we don't have an overlay or we have a horizontal offset,
    // otherwise we're perfectly in the middle
    if (!this.$overlay || this.options.hOffset !== 'auto') {
      this.$element.style.left = left + 'px';
      this.$element.style.margin = '0px';
    }
  }

  /**
   * Adds event handlers for the modal.
   * @private
   */
  _events() {
    var _this = this;
    const element = this.$element;

    // S4/S6: the Triggers util produces open/toggle.zf.trigger as element-
    // local dual dispatches and close.zf.trigger as a real bubbling event;
    // this consumer listens on the native side of that seam.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(element, 'open.zf.trigger', this.open.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(element, 'close.zf.trigger', (event, $element) => {
      if (event.target === _this.$element || $(event.target).parents('[data-closable]')[0] === $element) {
        // only close reveal when it's explicitly called
        return this.close.apply(this);
      }
    });
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(element, 'toggle.zf.trigger', this.toggle.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(element, 'resizeme.zf.trigger', function () {
      _this._updatePosition();
    });
    if (this.options.closeOnClick && this.options.overlay) {
      const closeOnOverlayEvent = function (e) {
        if (e.target === _this.$element || _this.$element.contains(e.target) || !document.contains(e.target)) {
          return;
        }
        _this.close();
      };
      // The M1-fixed off-then-on order is kept: one handler pair per
      // overlay, rebound cleanly on re-init. The click and tap halves both
      // live on the native event layer now (S13): 'tap' is a real, bubbling
      // event on the touched element.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$overlay, '.zf.reveal');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$overlay, 'click.zf.reveal tap.zf.reveal', closeOnOverlayEvent);
    }
    if (this.options.deepLink) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, `hashchange.zf.reveal:${this.id}`, this._handleState.bind(this));
    }
  }

  /**
   * Handles modal methods on back/forward button clicks or any other event that triggers hashchange.
   * @private
   */
  _handleState() {
    if (window.location.hash === '#' + this.id && !this.isActive) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
  * Disables the scroll when Reveal is shown to prevent the background from shifting
  * @param {number} scrollTop - Scroll to visually apply, window current scroll by default
  */
  _disableScroll(scrollTop) {
    scrollTop = scrollTop || window.scrollY;
    if (documentHeight() > windowHeight()) {
      // The px unit is explicit on purpose: a bare number assigned to a
      // native style property is silently dropped (jQuery appended it).
      document.documentElement.style.top = `${-scrollTop}px`;
    }
  }

  /**
  * Reenables the scroll when Reveal closes
  * @param {number} scrollTop - Scroll to restore, html "top" property by default (as set by `_disableScroll`)
  */
  _enableScroll(scrollTop) {
    scrollTop = scrollTop || parseInt(document.documentElement.style.top, 10);
    if (documentHeight() > windowHeight()) {
      document.documentElement.style.top = "";
      window.scrollTo(0, -scrollTop);
    }
  }

  /**
   * Opens the modal controlled by `this.$anchor`, and closes all others by default.
   * @function
   * @fires Reveal#closeme
   * @fires Reveal#open
   */
  open() {
    // either update or replace browser history
    const hash = `#${this.id}`;
    if (this.options.deepLink && window.location.hash !== hash) {
      if (window.history.pushState) {
        if (this.options.updateHistory) {
          window.history.pushState({}, '', hash);
        } else {
          window.history.replaceState({}, '', hash);
        }
      } else {
        window.location.hash = hash;
      }
    }

    // Remember anchor that opened it to set focus back later, have general anchors as fallback
    this.$activeAnchor = this.$anchor.indexOf(document.activeElement) > -1 ? document.activeElement : this.$anchor[0];
    this.isActive = true;

    // Make elements invisible, but remove display: none so we can get size and positioning
    this.$element.style.visibility = 'hidden';
    this._show(this.$element);
    this.$element.scrollTop = 0;
    if (this.options.overlay) {
      this.$overlay.style.visibility = 'hidden';
      this._show(this.$overlay);
    }
    this._updatePosition();
    this.$element.style.display = 'none';
    this.$element.style.visibility = '';
    if (this.$overlay) {
      this.$overlay.style.visibility = '';
      this.$overlay.style.display = 'none';
      if (this.$element.classList.contains('fast')) {
        this.$overlay.classList.add('fast');
      } else if (this.$element.classList.contains('slow')) {
        this.$overlay.classList.add('slow');
      }
    }
    if (!this.options.multipleOpened) {
      /**
       * Fires immediately before the modal opens.
       * Closes any other modals that are currently open
       * @event Reveal#closeme
       */
      // S13: the closeme production flipped with the Triggers listener -
      // a real, bubbling event whose detail carries the plugin id (the 6.x
      // second trigger parameter) and whose listener is registered per
      // plugin name.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'closeme.zf.reveal', [this.id]);
    }
    if (countVisibleReveals() === 0) {
      this._disableScroll();
    }
    var _this = this;

    // Motion UI method of reveal
    if (this.options.animationIn) {
      function afterAnimation() {
        _this.$element.setAttribute('aria-hidden', 'false');
        _this.$element.setAttribute('tabindex', '-1');
        _this.$element.focus();
        _this._addGlobalClasses();
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.trapFocus(_this.$element);
      }
      if (this.options.overlay) {
        _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.animateIn(this.$overlay, 'fade-in');
      }
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.animateIn(this.$element, this.options.animationIn, () => {
        if (this.$element) {
          // protect against object having been removed
          this.focusableElements = _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.findFocusable(this.$element);
          afterAnimation();
        }
      });
    }
    // Native method of reveal
    else {
      // S6: display is applied synchronously, exactly where jQuery's
      // `.show(duration)` restored it. The legacy fx tween (a size/opacity
      // "grow" that ran for non-zero showDelay values) is dropped - the
      // display and event contracts never depended on it, and the option
      // never delayed the display flip in the first place.
      if (this.options.overlay) {
        this._show(this.$overlay);
      }
      this._show(this.$element);
    }

    // handle accessibility
    this.$element.setAttribute('aria-hidden', 'false');
    this.$element.setAttribute('tabindex', '-1');
    this.$element.focus();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.trapFocus(this.$element);
    this._addGlobalClasses();
    this._addGlobalListeners();

    /**
     * Fires when the modal has successfully opened.
     * @event Reveal#open
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(this.$element, 'open.zf.reveal');
  }

  /**
   * Adds classes and listeners on document required by open modals.
   *
   * The following classes are added and updated:
   * - `.is-reveal-open` - Prevents the scroll on document
   * - `.zf-has-scroll`  - Displays a disabled scrollbar on document if required like if the
   *                       scroll was not disabled. This prevent a "shift" of the page content due
   *                       the scrollbar disappearing when the modal opens.
   *
   * @private
   */
  _addGlobalClasses() {
    const updateScrollbarClass = () => {
      document.documentElement.classList.toggle('zf-has-scroll', documentHeight() > windowHeight());
    };
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(this.$element, 'resizeme.zf.trigger.revealScrollbarListener', () => updateScrollbarClass());
    updateScrollbarClass();
    document.documentElement.classList.add('is-reveal-open');
  }

  /**
   * Removes classes and listeners on document that were required by open modals.
   * @private
   */
  _removeGlobalClasses() {
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'resizeme.zf.trigger.revealScrollbarListener');
    document.documentElement.classList.remove('is-reveal-open');
    document.documentElement.classList.remove('zf-has-scroll');
  }

  /**
   * Adds extra event handlers for the body and window if necessary.
   * @private
   */
  _addGlobalListeners() {
    var _this = this;
    if (!this.$element) {
      return;
    } // If we're in the middle of cleanup, don't freak out
    this.focusableElements = _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.findFocusable(this.$element);
    if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
      const closeOnBodyEvent = function (e) {
        if (e.target === _this.$element || _this.$element.contains(e.target) || !document.contains(e.target)) {
          return;
        }
        _this.close();
      };
      // Both halves on the native layer (S13): click since S6, tap with the
      // Touch util's real synthesized events.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(document.body, 'click.zf.reveal tap.zf.reveal', closeOnBodyEvent);
    }
    if (this.options.closeOnEsc) {
      // 7.0 terminal form: the ESC keydown consumer runs on the native
      // event layer (every producer that reaches it dispatches real
      // KeyboardEvents since the S16 suite migration; window has no
      // .keydown() shortcut anyway, so there was never a bridge producer).
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.on(window, `keydown.zf.reveal:${this.id}`, function (e) {
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.handleKey(e, 'Reveal', {
          close: function () {
            if (_this.options.closeOnEsc) {
              _this.close();
            }
          }
        });
      });
    }
  }

  /**
   * Closes the modal.
   * @function
   * @fires Reveal#closed
   */
  close() {
    if (!this.isActive || !(0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.visible)(this.$element)) {
      return false;
    }
    var _this = this;

    // Motion UI method of hiding
    if (this.options.animationOut) {
      if (this.options.overlay) {
        _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.animateOut(this.$overlay, 'fade-out');
      }
      _foundation_util_motion__WEBPACK_IMPORTED_MODULE_5__.Motion.animateOut(this.$element, this.options.animationOut, finishUp);
    }
    // Native method of hiding
    else {
      this.$element.style.display = 'none';
      if (this.options.overlay) {
        this.$overlay.style.display = 'none';
        // finishUp keeps its after-completion timing contract: 6.x ran it
        // from `.hide(0, finishUp)`, one macrotask after the call, and it
        // now runs once the (aligned) hideDelay has elapsed.
        setTimeout(finishUp, this.options.hideDelay);
      } else {
        finishUp();
      }
    }

    // Conditionals to remove extra event listeners added on open
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, `keydown.zf.reveal:${this.id}`);
    if (!this.options.overlay && this.options.closeOnClick) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(document.body, 'click.zf.reveal tap.zf.reveal');
    }
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element, 'keydown.zf.reveal');
    function finishUp() {
      // destroy() can land while the out-animation is still running (it
      // nulls every own property); the completion must then bail instead of
      // dereferencing the nulled $element (same guard shape as the Orbit
      // destroy fix, S14). 6.x never threw here only because its cleanup ran
      // on emptied jQuery collections.
      if (!_this.$element) {
        return;
      }

      // Get the current top before the modal is closed and restore the scroll after.
      // TODO: use component properties instead of HTML properties
      // See https://github.com/foundation/foundation-sites/pull/10786
      var scrollTop = parseInt(document.documentElement.style.top, 10);
      if (countVisibleReveals() === 0) {
        _this._removeGlobalClasses(); // also remove .is-reveal-open from the html element when there is no opened reveal
      }
      _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.releaseFocus(_this.$element);
      _this.$element.setAttribute('aria-hidden', 'true');
      if (countVisibleReveals() === 0) {
        _this._enableScroll(scrollTop);
      }

      /**
      * Fires when the modal is done closing.
      * @event Reveal#closed
      */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.trigger(_this.$element, 'closed.zf.reveal');
    }

    /**
    * Resets the modal content
    * This prevents a running video to keep going in the background
    */
    if (this.options.resetOnClose) {
      this.$element.html(this.$element.html());
    }
    this.isActive = false;
    // If deepLink and we did not switched to an other modal...
    if (_this.options.deepLink && window.location.hash === `#${this.id}`) {
      // Remove the history hash
      if (window.history.replaceState) {
        const urlWithoutHash = window.location.pathname + window.location.search;
        if (this.options.updateHistory) {
          window.history.pushState({}, '', urlWithoutHash); // remove the hash
        } else {
          window.history.replaceState('', document.title, urlWithoutHash);
        }
      } else {
        window.location.hash = '';
      }
    }

    // the empty-collection .focus() was a silent no-op in 6.x; minimal
    // fixtures have no anchors at all
    if (this.$activeAnchor) {
      this.$activeAnchor.focus();
    }
  }

  /**
   * Toggles the open/closed state of a modal.
   * @function
   */
  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  }
  /**
   * Destroys an instance of a modal.
   * @function
   */
  _destroy() {
    if (this.options.overlay) {
      // move $element outside of $overlay to prevent error unregisterPlugin()
      document.querySelector(this.options.appendTo).appendChild(this.$element);
      this.$overlay.style.display = 'none';
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$overlay);
      this.$overlay.remove();
    }
    this.$element.style.display = 'none';
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(this.$element);
    this.$anchor.forEach(function (anchor) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(anchor, '.zf');
    });
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, `.zf.reveal:${this.id}`);
    if (this.onLoadListener) _foundation_util_events__WEBPACK_IMPORTED_MODULE_1__.Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer

    if (countVisibleReveals() === 0) {
      this._removeGlobalClasses(); // also remove .is-reveal-open from the html element when there is no opened reveal
    }
  }
}
Reveal.defaults = {
  /**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @type {string}
   * @default ''
   */
  animationIn: '',
  /**
   * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
   * @option
   * @type {string}
   * @default ''
   */
  animationOut: '',
  /**
   * Time, in ms, to delay the opening of a modal after a click if no animation used.
   * @option
   * @type {number}
   * @default 0
   */
  showDelay: 0,
  /**
   * Time, in ms, to delay the closing of a modal after a click if no animation used.
   * @option
   * @type {number}
   * @default 0
   */
  hideDelay: 0,
  /**
   * Allows a click on the body/overlay to close the modal.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Allows the modal to close if the user presses the `ESCAPE` key.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnEsc: true,
  /**
   * If true, allows multiple modals to be displayed at once.
   * @option
   * @type {boolean}
   * @default false
   */
  multipleOpened: false,
  /**
   * Distance, in pixels, the modal should push down from the top of the screen.
   * @option
   * @type {number|string}
   * @default auto
   */
  vOffset: 'auto',
  /**
   * Distance, in pixels, the modal should push in from the side of the screen.
   * @option
   * @type {number|string}
   * @default auto
   */
  hOffset: 'auto',
  /**
   * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
   * @option
   * @type {boolean}
   * @default false
   */
  fullScreen: false,
  /**
   * Allows the modal to generate an overlay div, which will cover the view when modal opens.
   * @option
   * @type {boolean}
   * @default true
   */
  overlay: true,
  /**
   * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
   * @option
   * @type {boolean}
   * @default false
   */
  resetOnClose: false,
  /**
   * Link the location hash to the modal.
   * Set the location hash when the modal is opened/closed, and open/close the modal when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,
  /**
   * If `deepLink` is enabled, update the browser history with the open modal
   * @option
   * @default false
   */
  updateHistory: false,
  /**
  * Allows the modal to append to custom div.
  * @option
  * @type {string}
  * @default "body"
  */
  appendTo: "body",
  /**
   * Allows adding additional class names to the reveal overlay.
   * @option
   * @type {string}
   * @default ''
   */
  additionalOverlayClasses: ''
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

/***/ "./foundation.util.motion":
/*!********************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.motion"],"amd":"./foundation.util.motion","commonjs":"./foundation.util.motion","commonjs2":"./foundation.util.motion"} ***!
  \********************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__;

/***/ }),

/***/ "./foundation.util.touch":
/*!****************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.touch"],"amd":"./foundation.util.touch","commonjs":"./foundation.util.touch","commonjs2":"./foundation.util.touch"} ***!
  \****************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__;

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
  !*** ./js/entries/plugins/foundation.reveal.js ***!
  \*************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Reveal: () => (/* reexport safe */ _foundation_reveal__WEBPACK_IMPORTED_MODULE_1__.Reveal)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_reveal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.reveal */ "./js/foundation.reveal.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_reveal__WEBPACK_IMPORTED_MODULE_1__.Reveal, 'Reveal');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.reveal.js.map