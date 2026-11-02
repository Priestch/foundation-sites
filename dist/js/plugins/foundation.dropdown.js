(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.box"), require("./foundation.util.triggers"), require("./foundation.util.touch"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.keyboard", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.box", "./foundation.util.triggers", "./foundation.util.touch"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.box"), require("./foundation.util.triggers"), require("./foundation.util.touch"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.dropdown"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.box"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_box__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.dropdown.js":
/*!***********************************!*\
  !*** ./js/foundation.dropdown.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Dropdown: () => (/* binding */ Dropdown)
/* harmony export */ });
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_positionable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.positionable */ "./js/foundation.positionable.js");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__);








/**
 * Dropdown module.
 * @module foundation.dropdown
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.touch
 * @requires foundation.util.triggers
 */
class Dropdown extends _foundation_positionable__WEBPACK_IMPORTED_MODULE_4__.Positionable {
  /**
   * Creates a new instance of a dropdown.
   * @class
   * @name Dropdown
   * @param {jQuery} element - jQuery object to make into a dropdown.
   *        Object should be of the dropdown panel, rather than its anchor.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.deepMerge)({}, Dropdown.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_2__.datasetOptions)(this.$element), options);
    this.className = 'Dropdown'; // ie9 back compat

    // Touch and Triggers init are idempotent, just need to make sure they are initialized
    _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__.Touch.init();
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_5__.Triggers.init();
    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.register('Dropdown', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
   * @function
   * @private
   */
  _init() {
    var id = this.$element.getAttribute('id');
    var toggleAnchors = Array.from(document.querySelectorAll(`[data-toggle="${id}"]`));
    this.$anchors = toggleAnchors.length ? toggleAnchors : Array.from(document.querySelectorAll(`[data-open="${id}"]`));
    this.$anchors.forEach(function (anchor) {
      anchor.setAttribute('aria-controls', id);
      anchor.setAttribute('data-is-focus', 'false');
      anchor.setAttribute('data-yeti-box', id);
      anchor.setAttribute('aria-haspopup', 'true');
      anchor.setAttribute('aria-expanded', 'false');
    });
    this._setCurrentAnchor(this.$anchors[0]);
    if (this.options.parentClass) {
      this.$parent = this.$element.closest('.' + this.options.parentClass);
    } else {
      this.$parent = null;
    }

    // Set [aria-labelledby] on the Dropdown if it is not set
    if (this.$element.getAttribute('aria-labelledby') === null) {
      // Get the anchor ID or create one
      if (this.$currentAnchor.getAttribute('id') === null) {
        this.$currentAnchor.setAttribute('id', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_1__.GetYoDigits)(6, 'dd-anchor'));
      }
      this.$element.setAttribute('aria-labelledby', this.$currentAnchor.getAttribute('id'));
    }
    this.$element.setAttribute('aria-hidden', 'true');
    this.$element.setAttribute('data-yeti-box', id);
    this.$element.setAttribute('data-resize', id);
    super._init();
    this._events();
  }
  _getDefaultPosition() {
    // handle legacy classnames
    var position = this.$element.className.match(/(top|left|right|bottom)/g);
    if (position) {
      return position[0];
    } else {
      return 'bottom';
    }
  }
  _getDefaultAlignment() {
    // handle legacy float approach
    var horizontalPosition = /float-(\S+)/.exec(this.$currentAnchor.getAttribute('class'));
    if (horizontalPosition) {
      return horizontalPosition[1];
    }
    return super._getDefaultAlignment();
  }

  /**
   * Sets the position and orientation of the dropdown pane, checks for collisions if allow-overlap is not true.
   * Recursively calls itself if a collision is detected, with a new position class.
   * @function
   * @private
   */
  _setPosition() {
    this.$element.classList.remove(`has-position-${this.position}`, `has-alignment-${this.alignment}`);
    super._setPosition(this.$currentAnchor, this.$element, this.$parent);
    this.$element.classList.add(`has-position-${this.position}`, `has-alignment-${this.alignment}`);
  }

  /**
   * Make it a current anchor.
   * Current anchor as the reference for the position of Dropdown panes.
   * @param {HTML} el - DOM element of the anchor.
   * @function
   * @private
   */
  _setCurrentAnchor(el) {
    this.$currentAnchor = el.nodeType === 1 ? el : el[0];
  }

  /**
   * Adds event listeners to the element utilizing the triggers utility library.
   * @function
   * @private
   */
  _events() {
    var _this = this,
      hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
      element = this.$element;

    // S9: the four zf.trigger consumers flip to the native event layer -
    // open/toggle arrive as element-local dual dispatches and close as a
    // real bubbling event from the Triggers util (S4), resizeme as the
    // native resize broadcast.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(element, 'open.zf.trigger', this.open.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(element, 'close.zf.trigger', this.close.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(element, 'toggle.zf.trigger', this.toggle.bind(this));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(element, 'resizeme.zf.trigger', this._setPosition.bind(this));

    // S9: the anchor click consumer flips to the native event layer - real
    // clicks reach it directly, jQuery-synthesized clicks ride the `.click()`
    // native shortcut bridge (reveal-native precedent; jQuery suppresses
    // that shortcut for link anchors, so jQuery-synthesized clicks on `<a>`
    // anchors stay undelivered - a real click is the user contract).
    this.$anchors.forEach(anchor => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(anchor, 'click.zf.trigger');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(anchor, 'click.zf.trigger', function (e) {
        _this._setCurrentAnchor(this);
        if (
        // if forceFollow false, always prevent default action
        _this.options.forceFollow === false ||
        // if forceFollow true and hover option true, only prevent default action on 1st click
        // on 2nd click (dropown opened) the default action (e.g. follow a href) gets executed
        hasTouch && _this.options.hover && !_this.$element.classList.contains('is-open')) {
          e.preventDefault();
        }
      });
    });

    // 7.0 terminal form: hover runs on the native layer. jQuery's
    // mouseenter/mouseleave are synthesized from real mouseover/mouseout
    // with a within-element filter - the native port listens for the real
    // events and applies the same entering/leaving test, so both real
    // hovers and programmatic 'mouseover' dispatches reach it. The
    // what-input read is the attribute what-input maintains.
    if (this.options.hover) {
      var hoverFilter = function (handler) {
        return function (e) {
          // mouseenter semantics: only when the pointer entered from
          // outside (or from nowhere, like a synthetic dispatch)
          if (e.relatedTarget && this.contains(e.relatedTarget)) {
            return;
          }
          handler.call(this, e);
        };
      };
      this.$anchors.forEach(anchor => {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(anchor, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(anchor, 'mouseover.zf.dropdown', hoverFilter(function () {
          _this._setCurrentAnchor(this);
          var whatInput = document.body.getAttribute('data-whatinput');
          if (whatInput === null || whatInput === 'mouse') {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              // the 6.x hover flag rode jQuery's data cache (DOM-invisible);
              // the expando property keeps it invisible
              _this.$anchors[0].zfDropdownHover = true;
            }, _this.options.hoverDelay);
          }
        }));
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(anchor, 'mouseout.zf.dropdown', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_1__.ignoreMousedisappear)(function () {
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function () {
            _this.close();
            _this.$anchors[0].zfDropdownHover = false;
          }, _this.options.hoverDelay);
        }));
      });
      if (this.options.hoverPane) {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(this.$element, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(this.$element, 'mouseover.zf.dropdown', hoverFilter(function () {
          clearTimeout(_this.timeout);
        }));
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(this.$element, 'mouseout.zf.dropdown', (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_1__.ignoreMousedisappear)(function () {
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function () {
            _this.close();
            _this.$anchors[0].zfDropdownHover = false;
          }, _this.options.hoverDelay);
        }));
      }
    }
    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    this.$anchors.concat([this.$element]).forEach(bound => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(bound, 'keydown.zf.dropdown');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(bound, 'keydown.zf.dropdown', function (e) {
        var target = this;
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.handleKey(e, 'Dropdown', {
          open: function () {
            if (_this.$anchors.indexOf(target) !== -1 && !target.matches('input, textarea')) {
              _this.open();
              _this.$element.setAttribute('tabindex', '-1');
              _this.$element.focus();
              e.preventDefault();
            }
          },
          close: function () {
            _this.close();
            // the collection .focus() focused the first anchor
            if (_this.$anchors[0]) {
              _this.$anchors[0].focus();
            }
          }
        });
      });
    });
  }

  /**
   * Adds an event handler to the body to close any dropdowns on a click.
   * @function
   * @private
   */
  _addBodyHandler() {
    var body = document.body,
      _this = this;
    var bodyHandler = function (e) {
      if (_this.$anchors.indexOf(e.target) !== -1 || _this.$anchors.some(a => a.contains(e.target))) {
        return;
      }
      if (_this.$element === e.target || _this.$element.contains(e.target)) {
        return;
      }
      _this.close();
      _this._removeBodyHandler();
    };
    this._removeBodyHandler();
    // S13: the tap half flips with the Touch util - 'tap' is a real,
    // bubbling event on the touched element now, so this native body
    // listener hears it (real clicks arrived through this layer since S9).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.on(body, 'click.zf.dropdown tap.zf.dropdown', bodyHandler);
  }

  /**
   * Removes the body click/tap handler added by `_addBodyHandler`.
   * @function
   * @private
   */
  _removeBodyHandler() {
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(document.body, 'click.zf.dropdown tap.zf.dropdown');
  }

  /**
   * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
   * @function
   * @fires Dropdown#closeme
   * @fires Dropdown#show
   */
  open() {
    // var _this = this;
    /**
     * Fires to close other open dropdowns, typically when dropdown is opening
     * @event Dropdown#closeme
     */
    // S13: the closeme production flipped with the Triggers listener -
    // a real, bubbling event whose detail carries the plugin id.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'closeme.zf.dropdown', [this.$element.getAttribute('id')]);

    // S9: class/ARIA state flips natively.
    this.$anchors.forEach(anchor => {
      anchor.classList.add('hover');
      anchor.setAttribute('aria-expanded', 'true');
    });
    this.$element.classList.add('is-opening');
    this._setPosition();
    this.$element.classList.remove('is-opening');
    this.$element.classList.add('is-open');
    this.$element.setAttribute('aria-hidden', 'false');
    if (this.options.autoFocus) {
      const focusable = _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.findFocusable(this.$element);
      if (focusable.length) {
        focusable[0].focus();
      }
    }
    if (this.options.closeOnClick) {
      this._addBodyHandler();
    }
    if (this.options.trapFocus) {
      _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.trapFocus(this.$element);
    }

    /**
     * Fires once the dropdown is visible.
     * @event Dropdown#show
     */
    // S9: state production through the native event layer; the terminal
    // form forwards the plain element.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'show.zf.dropdown', [this.$element]);
  }

  /**
   * Closes the open dropdown pane.
   * @function
   * @fires Dropdown#hide
   */
  close() {
    if (!this.$element.classList.contains('is-open')) {
      return false;
    }
    // S9: class/ARIA state flips natively.
    this.$element.classList.remove('is-open');
    this.$element.setAttribute('aria-hidden', 'true');
    this.$anchors.forEach(anchor => {
      anchor.classList.remove('hover');
      anchor.setAttribute('aria-expanded', 'false');
    });

    /**
     * Fires once the dropdown is no longer visible.
     * @event Dropdown#hide
     */
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.trigger(this.$element, 'hide.zf.dropdown', [this.$element]);
    if (this.options.trapFocus) {
      _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.releaseFocus(this.$element);
    }
  }

  /**
   * Toggles the dropdown pane's visibility.
   * @function
   */
  toggle() {
    if (this.$element.classList.contains('is-open')) {
      if (this.$anchors[0] && this.$anchors[0].zfDropdownHover) return;
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Destroys the dropdown.
   * @function
   */
  _destroy() {
    // The zf.trigger listeners on the pane and the dropdown listeners on
    // the anchors, by bare namespaces; the destroy cleanup hides the pane.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(this.$element, '.zf.trigger');
    this.$anchors.forEach(anchor => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_3__.Events.off(anchor, '.zf.dropdown');
    });
    this._removeBodyHandler();
    this.$element.style.display = 'none';
  }
}
Dropdown.defaults = {
  /**
   * Class that designates bounding container of Dropdown (default: window)
   * @option
   * @type {?string}
   * @default null
   */
  parentClass: null,
  /**
   * Amount of time to delay opening a submenu on hover event.
   * @option
   * @type {number}
   * @default 250
   */
  hoverDelay: 250,
  /**
   * Allow submenus to open on hover events
   * @option
   * @type {boolean}
   * @default false
   */
  hover: false,
  /**
   * Don't close dropdown when hovering over dropdown pane
   * @option
   * @type {boolean}
   * @default false
   */
  hoverPane: false,
  /**
   * Number of pixels between the dropdown pane and the triggering element on open.
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Number of pixels between the dropdown pane and the triggering element on open.
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
  /**
   * Position of dropdown. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of dropdown relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, dropdown will first try to position as defined by data-position and data-alignment, but reposition if it would cause an overflow.
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
   * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
   * @option
   * @type {boolean}
   * @default false
   */
  trapFocus: false,
  /**
   * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
   * @option
   * @type {boolean}
   * @default false
   */
  autoFocus: false,
  /**
   * Allows a click on the body to close the dropdown.
   * @option
   * @type {boolean}
   * @default false
   */
  closeOnClick: false,
  /**
   * If true the default action of the toggle (e.g. follow a link with href) gets executed on click. If hover option is also true the default action gets prevented on first click for mobile / touch devices and executed on second click.
   * @option
   * @type {boolean}
   * @default true
   */
  forceFollow: true
};


/***/ }),

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

/***/ "./foundation.util.keyboard":
/*!****************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.keyboard"],"amd":"./foundation.util.keyboard","commonjs":"./foundation.util.keyboard","commonjs2":"./foundation.util.keyboard"} ***!
  \****************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__;

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
/*!***************************************************!*\
  !*** ./js/entries/plugins/foundation.dropdown.js ***!
  \***************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Dropdown: () => (/* reexport safe */ _foundation_dropdown__WEBPACK_IMPORTED_MODULE_1__.Dropdown),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_dropdown__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.dropdown */ "./js/foundation.dropdown.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_dropdown__WEBPACK_IMPORTED_MODULE_1__.Dropdown, 'Dropdown');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.dropdown.js.map