(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.mediaQuery"), require("./foundation.util.touch"), require("./foundation.util.triggers"), require("./foundation.util.box"), require("./foundation.util.motion"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.mediaQuery", "./foundation.util.touch", "./foundation.util.triggers", "./foundation.util.box", "./foundation.util.motion"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.mediaQuery"), require("./foundation.util.touch"), require("./foundation.util.triggers"), require("./foundation.util.box"), require("./foundation.util.motion"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.tooltip"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.mediaQuery"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.box"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_mediaQuery__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__, __WEBPACK_EXTERNAL_MODULE__foundation_util_box__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.positionable.js":
/*!***************************************!*\
  !*** ./js/foundation.positionable.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Positionable: () => (/* binding */ Positionable)
/* harmony export */ });
/* harmony import */ var _foundation_util_box__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.box */ "./foundation.util.box");
/* harmony import */ var _foundation_util_box__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_box__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__);



const POSITIONS = ['left', 'right', 'top', 'bottom'];
const VERTICAL_ALIGNMENTS = ['top', 'bottom', 'center'];
const HORIZONTAL_ALIGNMENTS = ['left', 'right', 'center'];
const ALIGNMENTS = {
  'left': VERTICAL_ALIGNMENTS,
  'right': VERTICAL_ALIGNMENTS,
  'top': HORIZONTAL_ALIGNMENTS,
  'bottom': HORIZONTAL_ALIGNMENTS
};
function nextItem(item, array) {
  var currentIdx = array.indexOf(item);
  if (currentIdx === array.length - 1) {
    return array[0];
  } else {
    return array[currentIdx + 1];
  }
}

// jQuery's `.offset({top,left})` setter, for absolutely positioned
// elements: top/left = target page coordinates - the element's current
// page offset + its current computed top/left (robust to any offsetParent;
// static elements get position:relative first, exactly like jQuery).
function setOffset(el, coords) {
  const cs = window.getComputedStyle(el);
  if (cs.position === 'static') {
    el.style.position = 'relative';
  }
  const curTop = parseFloat(cs.top) || 0;
  const curLeft = parseFloat(cs.left) || 0;
  const rect = el.getBoundingClientRect();
  el.style.top = coords.top - (rect.top + window.pageYOffset) + curTop + 'px';
  el.style.left = coords.left - (rect.left + window.pageXOffset) + curLeft + 'px';
}
class Positionable extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.Plugin {
  /**
   * Abstract class encapsulating the tether-like explicit positioning logic
   * including repositioning based on overlap.
   * Expects classes to define defaults for vOffset, hOffset, position,
   * alignment, allowOverlap, and allowBottomOverlap. They can do this by
   * extending the defaults, or (for now recommended due to the way docs are
   * generated) by explicitly declaring them.
   *
   **/

  _init() {
    this.triedPositions = {};
    this.position = this.options.position === 'auto' ? this._getDefaultPosition() : this.options.position;
    this.alignment = this.options.alignment === 'auto' ? this._getDefaultAlignment() : this.options.alignment;
    this.originalPosition = this.position;
    this.originalAlignment = this.alignment;
  }
  _getDefaultPosition() {
    return 'bottom';
  }
  _getDefaultAlignment() {
    switch (this.position) {
      case 'bottom':
      case 'top':
        return (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_1__.rtl)() ? 'right' : 'left';
      case 'left':
      case 'right':
        return 'bottom';
    }
  }

  /**
   * Adjusts the positionable possible positions by iterating through alignments
   * and positions.
   * @function
   * @private
   */
  _reposition() {
    if (this._alignmentsExhausted(this.position)) {
      this.position = nextItem(this.position, POSITIONS);
      this.alignment = ALIGNMENTS[this.position][0];
    } else {
      this._realign();
    }
  }

  /**
   * Adjusts the dropdown pane possible positions by iterating through alignments
   * on the current position.
   * @function
   * @private
   */
  _realign() {
    this._addTriedPosition(this.position, this.alignment);
    this.alignment = nextItem(this.alignment, ALIGNMENTS[this.position]);
  }
  _addTriedPosition(position, alignment) {
    this.triedPositions[position] = this.triedPositions[position] || [];
    this.triedPositions[position].push(alignment);
  }
  _positionsExhausted() {
    var isExhausted = true;
    for (var i = 0; i < POSITIONS.length; i++) {
      isExhausted = isExhausted && this._alignmentsExhausted(POSITIONS[i]);
    }
    return isExhausted;
  }
  _alignmentsExhausted(position) {
    return this.triedPositions[position] && this.triedPositions[position].length === ALIGNMENTS[position].length;
  }

  // When we're trying to center, we don't want to apply offset that's going to
  // take us just off center, so wrap around to return 0 for the appropriate
  // offset in those alignments.  TODO: Figure out if we want to make this
  // configurable behavior... it feels more intuitive, especially for tooltips, but
  // it's possible someone might actually want to start from center and then nudge
  // slightly off.
  _getVOffset() {
    return this.options.vOffset;
  }
  _getHOffset() {
    return this.options.hOffset;
  }

  // 7.0 line A terminal form: plain elements (un-migrated callers hand in
  // jQuery collections, unwrapped here).
  _setPosition(anchor, element, parent) {
    anchor = anchor.nodeType === 1 ? anchor : anchor[0];
    element = element.nodeType === 1 ? element : element[0];
    if (parent) {
      parent = parent.nodeType === 1 ? parent : parent[0];
    }
    if (anchor.getAttribute('aria-expanded') === 'false') {
      return false;
    }
    if (!this.options.allowOverlap) {
      // restore original position & alignment before checking overlap
      this.position = this.originalPosition;
      this.alignment = this.originalAlignment;
    }

    // S13: the Box util reads plain elements; the offset write below is
    // the native port of jQuery's `.offset({top,left})` setter.
    setOffset(element, _foundation_util_box__WEBPACK_IMPORTED_MODULE_0__.Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
    if (!this.options.allowOverlap) {
      var minOverlap = 100000000;
      // default coordinates to how we start, in case we can't figure out better
      var minCoordinates = {
        position: this.position,
        alignment: this.alignment
      };
      while (!this._positionsExhausted()) {
        let overlap = _foundation_util_box__WEBPACK_IMPORTED_MODULE_0__.Box.OverlapArea(element, parent || null, false, false, this.options.allowBottomOverlap);
        if (overlap === 0) {
          return;
        }
        if (overlap < minOverlap) {
          minOverlap = overlap;
          minCoordinates = {
            position: this.position,
            alignment: this.alignment
          };
        }
        this._reposition();
        setOffset(element, _foundation_util_box__WEBPACK_IMPORTED_MODULE_0__.Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
      }
      // If we get through the entire loop, there was no non-overlapping
      // position available. Pick the version with least overlap.
      this.position = minCoordinates.position;
      this.alignment = minCoordinates.alignment;
      setOffset(element, _foundation_util_box__WEBPACK_IMPORTED_MODULE_0__.Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
    }
  }
}
Positionable.defaults = {
  /**
   * Position of positionable relative to anchor. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of positionable relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, dropdown positionable first
   * try to position as defined by data-position and data-alignment, but
   * reposition if it would cause an overflow.
   * @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * @option
   * @type {boolean}
   * @default true
   */
  allowBottomOverlap: true,
  /**
   * Number of pixels the positionable should be separated vertically from anchor
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Number of pixels the positionable should be separated horizontally from anchor
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0
};


/***/ }),

/***/ "./js/foundation.tooltip.js":
/*!**********************************!*\
  !*** ./js/foundation.tooltip.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Tooltip: () => (/* binding */ Tooltip)
/* harmony export */ });
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.mediaQuery */ "./foundation.util.mediaQuery");
/* harmony import */ var _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_positionable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.positionable */ "./js/foundation.positionable.js");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__);








// jQuery's $(htmlString): parsed to the single root element.
function parseTemplate(html) {
  var probe = document.createElement('template');
  probe.innerHTML = html.trim();
  return probe.content.firstElementChild;
}


/**
 * Tooltip module.
 * @module foundation.tooltip
 * @requires foundation.util.box
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

class Tooltip extends _foundation_positionable__WEBPACK_IMPORTED_MODULE_6__.Positionable {
  /**
   * Creates a new instance of a Tooltip.
   * @class
   * @name Tooltip
   * @fires Tooltip#init
   * @param {jQuery} element - jQuery object to attach a tooltip to.
   * @param {Object} options - object to extend the default configuration.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.deepMerge)({}, Tooltip.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.datasetOptions)(this.$element), options);
    this.className = 'Tooltip'; // ie9 back compat

    this.isActive = false;
    this.isClick = false;

    // Triggers init is idempotent, just need to make sure it is initialized
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__.Triggers.init();
    this._init();
  }

  /**
   * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
   * @private
   */
  _init() {
    _foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__.MediaQuery._init();
    var elemId = this.$element.getAttribute('aria-describedby') || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.GetYoDigits)(6, 'tooltip');
    this.options.tipText = this.options.tipText || this.$element.getAttribute('title');
    this.template = this.options.template ? parseTemplate(this.options.template) : this._buildTemplate(elemId);

    // The element-local hide before positioning (the 6.x appendTo/hide).
    document.body.appendChild(this.template);
    if (this.options.allowHtml) {
      this.template.innerHTML = this.options.tipText;
    } else {
      this.template.textContent = this.options.tipText;
    }
    this.template.style.display = 'none';
    this.$element.setAttribute('title', '');
    this.$element.setAttribute('aria-describedby', elemId);
    this.$element.setAttribute('data-yeti-box', elemId);
    this.$element.setAttribute('data-toggle', elemId);
    this.$element.setAttribute('data-resize', elemId);
    this.$element.classList.add(this.options.triggerClass);
    super._init();
    this._events();
  }
  _getDefaultPosition() {
    // handle legacy classnames
    var elementClassName = this.$element.className;
    if (this.$element instanceof SVGElement) {
      elementClassName = elementClassName.baseVal;
    }
    var position = elementClassName.match(/\b(top|left|right|bottom)\b/g);
    return position ? position[0] : 'top';
  }
  _getDefaultAlignment() {
    return 'center';
  }
  _getHOffset() {
    if (this.position === 'left' || this.position === 'right') {
      return this.options.hOffset + this.options.tooltipWidth;
    } else {
      return this.options.hOffset;
    }
  }
  _getVOffset() {
    if (this.position === 'top' || this.position === 'bottom') {
      return this.options.vOffset + this.options.tooltipHeight;
    } else {
      return this.options.vOffset;
    }
  }

  /**
   * builds the tooltip element, adds attributes, and returns the template.
   * The element is created natively (7.0 line A, S8); the terminal form
   * returns the element (the mixed state returned a jQuery collection).
   * @private
   */
  _buildTemplate(id) {
    var templateClasses = `${this.options.tooltipClass} ${this.options.templateClasses}`.trim();
    var template = document.createElement('div');
    template.className = templateClasses;
    template.setAttribute('role', 'tooltip');
    template.setAttribute('aria-hidden', 'true');
    template.setAttribute('data-is-active', 'false');
    template.setAttribute('data-is-focus', 'false');
    template.setAttribute('id', id);
    return template;
  }

  /**
   * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
   * if the tooltip is larger than the screen width, default to full width - any user selected margin
   * @private
   */
  _setPosition() {
    // Seam (S8): the whole positioning block (Positionable + the Box util)
    // still runs on jQuery objects - Box consumes and produces jQuery
    // collections and is self-consistent, so the anchor/template pair is
    // handed in as such and nothing here changes until the Box slice.
    super._setPosition(this.$element, this.template);
  }

  /**
   * reveals the tooltip, and fires an event to close any other open tooltips on the page
   * @fires Tooltip#closeme
   * @fires Tooltip#show
   * @function
   */
  show() {
    if (this.options.showOn !== 'all' && !_foundation_util_mediaQuery__WEBPACK_IMPORTED_MODULE_3__.MediaQuery.is(this.options.showOn)) {
      // console.error('The screen is too small to display this tooltip');
      return false;
    }
    var _this = this;
    this.template.style.visibility = 'hidden';
    // .show() native form: clear the inline none, fall back to block
    this.template.style.display = '';
    if (window.getComputedStyle(this.template).display === 'none') {
      this.template.style.display = 'block';
    }
    this._setPosition();
    this.template.classList.remove('top', 'bottom', 'left', 'right');
    this.template.classList.add(this.position);
    this.template.classList.remove('align-top', 'align-bottom', 'align-left', 'align-right', 'align-center');
    this.template.classList.add('align-' + this.alignment);

    /**
     * Fires to close all other open tooltips on the page
     * @event Closeme#tooltip
     */
    // S13: the closeme production flipped with the Triggers listener -
    // a real, bubbling event whose detail carries the plugin id.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'closeme.zf.tooltip', [this.template.id]);

    // State/ARIA go through the native layer (7.0 line A, S8).
    this.template.setAttribute('data-is-active', 'true');
    this.template.setAttribute('aria-hidden', 'false');
    _this.isActive = true;
    // fx 方案 A: the fade tween runs on Motion's native primitive (the
    // stop-in-place, the hide reset and the visibility clear keep the 6.x
    // ordering).
    const templateEl = this.template;
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__.Motion.stop(templateEl);
    templateEl.style.display = 'none';
    templateEl.style.visibility = '';
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__.Motion.fadeIn(templateEl, this.options.fadeInDuration, function () {
      //maybe do stuff?
    });
    /**
     * Fires when the tooltip is shown
     * @event Tooltip#show
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'show.zf.tooltip');
  }

  /**
   * Hides the current tooltip, and resets the positioning class if it was changed due to collision
   * @fires Tooltip#hide
   * @function
   */
  hide() {
    var _this = this;
    // State/ARIA native; fx 方案 A, see show().
    this.template.setAttribute('aria-hidden', 'true');
    this.template.setAttribute('data-is-active', 'false');
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__.Motion.stop(this.template);
    _foundation_util_motion__WEBPACK_IMPORTED_MODULE_7__.Motion.fadeOut(this.template, this.options.fadeOutDuration, function () {
      _this.isActive = false;
      _this.isClick = false;
    });
    /**
     * fires when the tooltip is hidden
     * @event Tooltip#hide
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'hide.zf.tooltip');
  }

  /**
   * adds event listeners for the tooltip and its anchor
   * TODO combine some of the listeners like focus and mouseenter, etc.
   * @private
   */
  _events() {
    const _this = this;
    const element = this.$element;
    const hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined';
    var isFocus = false;

    // `disableForTouch: Fully disable the tooltip on touch devices
    if (hasTouch && this.options.disableForTouch) return;
    if (!this.options.disableHover) {
      // S8: hover/focus/click consumers flip to the native event layer -
      // mouseenter/mouseleave/mousedown/focus/focusout are real DOM events
      // and reach these listeners directly (still-on-jQuery synthetic
      // producers like `$(el).trigger('mouseenter')` do not, by design).
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'mouseenter.zf.tooltip', function () {
        if (!_this.isActive) {
          _this.timeout = setTimeout(function () {
            _this.show();
          }, _this.options.hoverDelay);
        }
      });
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'mouseleave.zf.tooltip', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_0__.ignoreMousedisappear)(function () {
        clearTimeout(_this.timeout);
        if (!isFocus || _this.isClick && !_this.options.clickOpen) {
          _this.hide();
        }
      }));
    }
    if (hasTouch) {
      // S13: the tap/touchend consumer flips with the Touch util - 'tap' is
      // a real, bubbling event on the touched element now. The anchor itself
      // has no tap listener outside this binding, so arming the document
      // touch chain (Touch.init, idempotent) covers it.
      _foundation_util_touch__WEBPACK_IMPORTED_MODULE_4__.Touch.init();
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'tap.zf.tooltip touchend.zf.tooltip', function () {
        _this.isActive ? _this.hide() : _this.show();
      });
    }
    if (this.options.clickOpen) {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'mousedown.zf.tooltip', function () {
        if (_this.isClick) {
          //_this.hide();
          // _this.isClick = false;
        } else {
          _this.isClick = true;
          if ((_this.options.disableHover || !_this.$element.getAttribute('tabindex')) && !_this.isActive) {
            _this.show();
          }
        }
      });
    } else {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'mousedown.zf.tooltip', function () {
        _this.isClick = true;
      });
    }

    // S8: the close consumer flips to the native event layer - both
    // producers there (the [data-close] delegation and the closeme
    // broadcast) have dispatched real bubbling events since S4.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'close.zf.trigger', this.hide.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'focus.zf.tooltip', function () {
      isFocus = true;
      if (_this.isClick) {
        // If we're not showing open on clicks, we need to pretend a click-launched focus isn't
        // a real focus, otherwise on hover and come back we get bad behavior
        if (!_this.options.clickOpen) {
          isFocus = false;
        }
        return false;
      } else {
        _this.show();
      }
    });
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'focusout.zf.tooltip', function () {
      isFocus = false;
      _this.isClick = false;
      _this.hide();
    });

    // S8: the resizeme consumer flips to the native event layer (S4
    // producer).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(element, 'resizeme.zf.trigger', function () {
      if (_this.isActive) {
        _this._setPosition();
      }
    });
  }

  /**
   * adds a toggle method, in addition to the static show() & hide() functions
   * @function
   */
  toggle() {
    if (this.isActive) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Destroys an instance of tooltip, removes template element from the view.
   * @function
   */
  _destroy() {
    this.$element.setAttribute('title', this.template.textContent);
    this.$element.classList.remove(this.options.triggerClass, 'top', 'right', 'left', 'bottom');
    ['aria-describedby', 'data-disable-hover', 'data-resize', 'data-toggle', 'data-tooltip', 'data-yeti-box'].forEach(function (name) {
      this.$element.removeAttribute(name);
    }, this);

    // The flipped hover/focus/click/close/resizeme listeners.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(this.$element, '.zf.trigger .zf.tooltip');
    this.template.remove();
  }
}
Tooltip.defaults = {
  /**
   * Time, in ms, before a tooltip should open on hover.
   * @option
   * @type {number}
   * @default 200
   */
  hoverDelay: 200,
  /**
   * Time, in ms, a tooltip should take to fade into view.
   * @option
   * @type {number}
   * @default 150
   */
  fadeInDuration: 150,
  /**
   * Time, in ms, a tooltip should take to fade out of view.
   * @option
   * @type {number}
   * @default 150
   */
  fadeOutDuration: 150,
  /**
   * Disables hover events from opening the tooltip if set to true
   * @option
   * @type {boolean}
   * @default false
   */
  disableHover: false,
  /**
   * Disable the tooltip for touch devices.
   * This can be useful to make elements with a tooltip on it trigger their
   * action on the first tap instead of displaying the tooltip.
   * @option
   * @type {booelan}
   * @default false
   */
  disableForTouch: false,
  /**
   * Optional addtional classes to apply to the tooltip template on init.
   * @option
   * @type {string}
   * @default ''
   */
  templateClasses: '',
  /**
   * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
   * @option
   * @type {string}
   * @default 'tooltip'
   */
  tooltipClass: 'tooltip',
  /**
   * Class applied to the tooltip anchor element.
   * @option
   * @type {string}
   * @default 'has-tip'
   */
  triggerClass: 'has-tip',
  /**
   * Minimum breakpoint size at which to open the tooltip.
   * @option
   * @type {string}
   * @default 'small'
   */
  showOn: 'small',
  /**
   * Custom template to be used to generate markup for tooltip.
   * @option
   * @type {string}
   * @default ''
   */
  template: '',
  /**
   * Text displayed in the tooltip template on open.
   * @option
   * @type {string}
   * @default ''
   */
  tipText: '',
  touchCloseText: 'Tap to close.',
  /**
   * Allows the tooltip to remain open if triggered with a click or touch event.
   * @option
   * @type {boolean}
   * @default true
   */
  clickOpen: true,
  /**
   * Position of tooltip. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of tooltip relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, tooltip will first try to
   * position as defined by data-position and data-alignment, but reposition if
   * it would cause an overflow.  @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * Less common for tooltips.
   * @option
   * @type {boolean}
   * @default false
   */
  allowBottomOverlap: false,
  /**
   * Distance, in pixels, the template should push away from the anchor on the Y axis.
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Distance, in pixels, the template should push away from the anchor on the X axis
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
  /**
   * Distance, in pixels, the template spacing auto-adjust for a vertical tooltip
   * @option
   * @type {number}
   * @default 14
   */
  tooltipHeight: 14,
  /**
   * Distance, in pixels, the template spacing auto-adjust for a horizontal tooltip
   * @option
   * @type {number}
   * @default 12
   */
  tooltipWidth: 12,
  /**
  * Allow HTML in tooltip. Warning: If you are loading user-generated content into tooltips,
  * allowing HTML may open yourself up to XSS attacks.
  * @option
  * @type {boolean}
  * @default false
  */
  allowHtml: false
};

/**
 * TODO utilize resize event trigger
 */



/***/ }),

/***/ "./foundation.core":
/*!****************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.core"],"amd":"./foundation.core","commonjs":"./foundation.core","commonjs2":"./foundation.core"} ***!
  \****************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_core__;

/***/ }),

/***/ "./foundation.util.box":
/*!********************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.box"],"amd":"./foundation.util.box","commonjs":"./foundation.util.box","commonjs2":"./foundation.util.box"} ***!
  \********************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_box__;

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
/*!**************************************************!*\
  !*** ./js/entries/plugins/foundation.tooltip.js ***!
  \**************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Tooltip: () => (/* reexport safe */ _foundation_tooltip__WEBPACK_IMPORTED_MODULE_1__.Tooltip)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_tooltip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.tooltip */ "./js/foundation.tooltip.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_tooltip__WEBPACK_IMPORTED_MODULE_1__.Tooltip, 'Tooltip');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.tooltip.js.map