(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.motion"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.touch"), require("./foundation.util.triggers"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.keyboard", "./foundation.util.motion", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.touch", "./foundation.util.triggers"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.motion"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.touch"), require("./foundation.util.triggers"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.slider"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.triggers"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__, __WEBPACK_EXTERNAL_MODULE__foundation_util_triggers__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.slider.js":
/*!*********************************!*\
  !*** ./js/foundation.slider.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Slider: () => (/* binding */ Slider)
/* harmony export */ });
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.util.triggers */ "./foundation.util.triggers");
/* harmony import */ var _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__);








/**
 * Slider module.
 * @module foundation.slider
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.keyboard
 * @requires foundation.util.touch
 */

class Slider extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.Plugin {
  /**
   * Creates a new instance of a slider control.
   * @class
   * @name Slider
   * @param {jQuery} element - jQuery object to make into a slider control.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.deepMerge)({}, Slider.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_3__.datasetOptions)(this.$element), options);
    this.className = 'Slider'; // ie9 back compat
    this.initialized = false;

    // Touch and Triggers inits are idempotent, we just need to make sure it's initialied.
    _foundation_util_touch__WEBPACK_IMPORTED_MODULE_5__.Touch.init();
    _foundation_util_triggers__WEBPACK_IMPORTED_MODULE_6__.Triggers.init();
    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.register('Slider', {
      'ltr': {
        'ARROW_RIGHT': 'increase',
        'ARROW_UP': 'increase',
        'ARROW_DOWN': 'decrease',
        'ARROW_LEFT': 'decrease',
        'SHIFT_ARROW_RIGHT': 'increaseFast',
        'SHIFT_ARROW_UP': 'increaseFast',
        'SHIFT_ARROW_DOWN': 'decreaseFast',
        'SHIFT_ARROW_LEFT': 'decreaseFast',
        'HOME': 'min',
        'END': 'max'
      },
      'rtl': {
        'ARROW_LEFT': 'increase',
        'ARROW_RIGHT': 'decrease',
        'SHIFT_ARROW_LEFT': 'increaseFast',
        'SHIFT_ARROW_RIGHT': 'decreaseFast'
      }
    });
  }

  /**
   * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
   * @function
   * @private
   */
  _init() {
    this.inputs = Array.from(this.$element.querySelectorAll('input'));
    this.handles = Array.from(this.$element.querySelectorAll('[data-slider-handle]'));
    this.$handle = this.handles[0];
    this.$input = this.inputs.length ? this.inputs[0] : document.getElementById(this.$handle.getAttribute('aria-controls'));
    this.$fill = this.$element.querySelector('[data-slider-fill]');
    // Sliders without a fill element are valid markup (the 6.x empty
    // collection made every fill write a no-op; null keeps that contract).
    if (this.$fill) {
      this.$fill.style[this.options.vertical ? 'height' : 'width'] = '0';
    }

    // State attributes and classes go through the native layer (7.0 line A, S10).
    if (this.options.disabled || this.$element.classList.contains(this.options.disabledClass)) {
      this.options.disabled = true;
      this.$element.classList.add(this.options.disabledClass);
    }
    if (!this.inputs.length) {
      this.inputs = [this.$input];
      this.options.binding = true;
    }
    this._setInitAttr(0);
    if (this.handles[1]) {
      this.options.doubleSided = true;
      this.$handle2 = this.handles[1];
      this.$input2 = this.inputs.length > 1 ? this.inputs[1] : document.getElementById(this.$handle2.getAttribute('aria-controls'));
      if (!this.inputs[1]) {
        this.inputs.push(this.$input2);
      }

      // this.$handle.triggerHandler('click.zf.slider');
      this._setInitAttr(1);
    }

    // Set handle positions
    this.setHandles();
    this._events();
    this.initialized = true;
  }
  setHandles() {
    if (this.handles[1]) {
      this._setHandlePos(this.$handle, this.inputs[0].value, () => {
        this._setHandlePos(this.$handle2, this.inputs[1].value);
      });
    } else {
      this._setHandlePos(this.$handle, this.inputs[0].value);
    }
  }
  _reflow() {
    this.setHandles();
  }
  /**
  * @function
  * @private
  * @param {Number} value - floating point (the value) to be transformed using to a relative position on the slider (the inverse of _value)
  */
  _pctOfBar(value) {
    var pctOfBar = percent(value - this.options.start, this.options.end - this.options.start);
    switch (this.options.positionValueFunction) {
      case "pow":
        pctOfBar = this._logTransform(pctOfBar);
        break;
      case "log":
        pctOfBar = this._powTransform(pctOfBar);
        break;
    }
    return pctOfBar.toFixed(2);
  }

  /**
  * @function
  * @private
  * @param {Number} pctOfBar - floating point, the relative position of the slider (typically between 0-1) to be transformed to a value
  */
  _value(pctOfBar) {
    switch (this.options.positionValueFunction) {
      case "pow":
        pctOfBar = this._powTransform(pctOfBar);
        break;
      case "log":
        pctOfBar = this._logTransform(pctOfBar);
        break;
    }
    var value;
    if (this.options.vertical) {
      // linear interpolation which is working with negative values for start
      // https://math.stackexchange.com/a/1019084
      value = parseFloat(this.options.end) + pctOfBar * (this.options.start - this.options.end);
    } else {
      value = (this.options.end - this.options.start) * pctOfBar + parseFloat(this.options.start);
    }
    return value;
  }

  /**
  * @function
  * @private
  * @param {Number} value - floating point (typically between 0-1) to be transformed using the log function
  */
  _logTransform(value) {
    return baseLog(this.options.nonLinearBase, value * (this.options.nonLinearBase - 1) + 1);
  }

  /**
  * @function
  * @private
  * @param {Number} value - floating point (typically between 0-1) to be transformed using the power function
  */
  _powTransform(value) {
    return (Math.pow(this.options.nonLinearBase, value) - 1) / (this.options.nonLinearBase - 1);
  }

  /**
   * Sets the position of the selected handle and fill bar.
   * @function
   * @private
   * @param {jQuery} $hndl - the selected handle to move.
   * @param {Number} location - floating point between the start and end values of the slider bar.
   * @param {Function} cb - callback function to fire on completion.
   * @fires Slider#moved
   * @fires Slider#changed
   */
  _setHandlePos(hndl, location, cb) {
    hndl = hndl && hndl.nodeType === 1 ? hndl : hndl ? hndl[0] : hndl;
    // don't move if the slider has been disabled since its initialization
    if (this.$element.classList.contains(this.options.disabledClass)) {
      return;
    }
    //might need to alter that slightly for bars that will have odd number selections.
    location = parseFloat(location); //on input change events, convert string to number...grumble.

    // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
    if (location < this.options.start) {
      location = this.options.start;
    } else if (location > this.options.end) {
      location = this.options.end;
    }
    var isDbl = this.options.doubleSided;
    if (isDbl) {
      //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
      if (this.handles.indexOf(hndl) === 0) {
        var h2Val = parseFloat(this.$handle2.getAttribute('aria-valuenow'));
        location = location >= h2Val ? h2Val - this.options.step : location;
      } else {
        var h1Val = parseFloat(this.$handle.getAttribute('aria-valuenow'));
        location = location <= h1Val ? h1Val + this.options.step : location;
      }
    }
    var _this = this,
      vert = this.options.vertical,
      hOrW = vert ? 'height' : 'width',
      lOrT = vert ? 'top' : 'left',
      handleDim = hndl.getBoundingClientRect()[hOrW],
      elemDim = this.$element.getBoundingClientRect()[hOrW],
      //percentage of bar min/max value based on click or drag point
      pctOfBar = this._pctOfBar(location),
      //number of actual pixels to shift the handle, based on the percentage obtained above
      pxToMove = (elemDim - handleDim) * pctOfBar,
      //percentage of bar to shift the handle
      movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
    //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
    location = parseFloat(location.toFixed(this.options.decimal));
    // declare empty object for css adjustments, only used with 2 handled-sliders
    var css = {};
    this._setValues(hndl, location);

    // TODO update to calculate based on values set to respective inputs??
    if (isDbl) {
      var isLeftHndl = this.handles.indexOf(hndl) === 0,
        //empty variable, will be used for min-height/width for fill bar
        dim,
        //percentage w/h of the handle compared to the slider bar
        handlePct = Math.floor(percent(handleDim, elemDim) * 100);
      //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
      if (isLeftHndl) {
        //left or top percentage value to apply to the fill bar.
        css[lOrT] = `${movement}%`;
        //calculate the new min-height/width for the fill bar.
        dim = parseFloat(this.$handle2.style[lOrT]) - movement + handlePct;
        //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
        //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
        if (cb && typeof cb === 'function') {
          cb();
        } //this is only needed for the initialization of 2 handled sliders
      } else {
        //just caching the value of the left/bottom handle's left/top property
        var handlePos = parseFloat(this.$handle.style[lOrT]);
        //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
        //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
        dim = movement - (isNaN(handlePos) ? (this.options.initialStart - this.options.start) / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
      }
      // assign the min-height/width to our css object
      css[`min-${hOrW}`] = `${dim}%`;
    }

    //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
    // the dragging flag rode jQuery's data cache (DOM-invisible); the
    // expando property keeps it invisible
    var moveTime = this.$element.zfSliderDragging ? 1000 / 60 : this.options.moveTime;
    (0,_foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Move)(moveTime, hndl, function () {
      // A Move chain can complete after the slider was destroyed (the
      // completion runs off a requestAnimationFrame) and options are gone.
      if (!_this.options) {
        return;
      }
      // adjusting the left/top property of the handle, based on the percentage calculated above
      // if movement isNaN, that is because the slider is hidden and we cannot determine handle width,
      // fall back to next best guess.
      if (isNaN(movement)) {
        hndl.style[lOrT] = `${pctOfBar * 100}%`;
      } else {
        hndl.style[lOrT] = `${movement}%`;
      }
      if (!_this.options.doubleSided) {
        //if single-handled, a simple method to expand the fill bar
        if (_this.$fill) {
          _this.$fill.style[hOrW] = `${pctOfBar * 100}%`;
        }
      } else {
        //otherwise, use the css object we created above
        if (_this.$fill) {
          Object.keys(css).forEach(function (prop) {
            _this.$fill.style[prop] = css[prop];
          });
        }
      }
    });
    if (this.initialized) {
      // S10: the finished.zf.animate consumer flips to the native event
      // layer; the producer (Motion) has dispatched one real bubbling event
      // per Move since S5, so this seam closes on the consumer half alone.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.one(this.$element, 'finished.zf.animate', function () {
        // the chain can fire after destroy() (see the Move callback above)
        if (!_this.$element) {
          return;
        }
        /**
         * Fires when the handle is done moving.
         * @event Slider#moved
         */
        // Terminal form: real bubbling event, the plain handle element.
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(_this.$element, 'moved.zf.slider', [hndl]);
      });
      /**
       * Fires when the value has not been change for a given time.
       * @event Slider#changed
       */
      clearTimeout(_this.timeout);
      _this.timeout = setTimeout(function () {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.trigger(_this.$element, 'changed.zf.slider', [hndl]);
      }, _this.options.changedDelay);
    }
  }

  /**
   * Sets the initial attribute for the slider element.
   * @function
   * @private
   * @param {Number} idx - index of the current handle/input to use.
   */
  _setInitAttr(idx) {
    var initVal = idx === 0 ? this.options.initialStart : this.options.initialEnd;
    var id = this.inputs[idx].getAttribute('id') || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.GetYoDigits)(6, 'slider');
    // State attributes go through the native layer (7.0 line A, S10).
    var input = this.inputs[idx];
    input.setAttribute('id', id);
    input.setAttribute('max', this.options.end);
    input.setAttribute('min', this.options.start);
    input.setAttribute('step', this.options.step);
    input.value = initVal;
    var handle = this.handles[idx];
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-controls', id);
    handle.setAttribute('aria-valuemax', this.options.end);
    handle.setAttribute('aria-valuemin', this.options.start);
    handle.setAttribute('aria-valuenow', initVal);
    handle.setAttribute('aria-orientation', this.options.vertical ? 'vertical' : 'horizontal');
    handle.setAttribute('tabindex', 0);
  }

  /**
   * Sets the input and `aria-valuenow` values for the slider element.
   * @function
   * @private
   * @param {jQuery} $handle - the currently selected handle.
   * @param {Number} val - floating point of the new value.
   */
  _setValues(handle, val) {
    handle = handle.nodeType === 1 ? handle : handle[0];
    var idx = this.options.doubleSided ? this.handles.indexOf(handle) : 0;
    this.inputs[idx].value = val;
    // State attributes go through the native layer (7.0 line A, S10).
    handle.setAttribute('aria-valuenow', val);
  }

  /**
   * Handles events on the slider element.
   * Calculates the new location of the current handle.
   * If there are two handles and the bar was clicked, it determines which handle to move.
   * @function
   * @private
   * @param {Object} e - the `event` object passed from the listener.
   * @param {jQuery} $handle - the current handle to calculate for, if selected.
   * @param {Number} val - floating point number for the new value of the slider.
   * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
   */
  _handleEvent(e, handle, val) {
    var value;
    if (!val) {
      //click or drag events
      e.preventDefault();
      var _this = this,
        vertical = this.options.vertical,
        param = vertical ? 'height' : 'width',
        direction = vertical ? 'top' : 'left',
        eventOffset = vertical ? e.pageY : e.pageX,
        barDim = this.$element.getBoundingClientRect()[param],
        windowScroll = vertical ? window.pageYOffset : window.pageXOffset;

      // jQuery offset(): the document-coordinates edge
      var elemOffset = this.$element.getBoundingClientRect()[direction] + (vertical ? window.pageYOffset : window.pageXOffset);

      // touch events emulated by the touch util give position relative to screen, add window.scroll to event coordinates...
      // best way to guess this is simulated is if clientY == pageY
      if (e.clientY === e.pageY) {
        eventOffset = eventOffset + windowScroll;
      }
      var eventFromBar = eventOffset - elemOffset;
      var barXY;
      if (eventFromBar < 0) {
        barXY = 0;
      } else if (eventFromBar > barDim) {
        barXY = barDim;
      } else {
        barXY = eventFromBar;
      }
      var offsetPct = percent(barXY, barDim);
      value = this._value(offsetPct);

      // turn everything around for RTL, yay math!
      if ((0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_2__.rtl)() && !this.options.vertical) {
        value = this.options.end - value;
      }
      value = _this._adjustValue(null, value);
      if (!handle) {
        //figure out which handle it is, pass it to the next function.
        var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
          secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
        handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
      }
    } else {
      //change event on input
      value = this._adjustValue(null, val);
    }
    this._setHandlePos(handle, value);
  }

  /**
   * Adjustes value for handle in regard to step value. returns adjusted value
   * @function
   * @private
   * @param {jQuery} $handle - the selected handle.
   * @param {Number} value - value to adjust. used if $handle is falsy
   */
  _adjustValue($handle, value) {
    var val,
      step = this.options.step,
      div = parseFloat(step / 2),
      left,
      previousVal,
      nextVal;
    if (!!$handle) {
      val = parseFloat($handle.getAttribute('aria-valuenow'));
    } else {
      val = value;
    }
    if (val >= 0) {
      left = val % step;
    } else {
      left = step + val % step;
    }
    previousVal = val - left;
    nextVal = previousVal + step;
    if (left === 0) {
      return val;
    }
    val = val >= previousVal + div ? nextVal : previousVal;
    return val;
  }

  /**
   * Adds event listeners to the slider elements.
   * @function
   * @private
   */
  _events() {
    this._eventsForHandle(this.$handle);
    if (this.handles[1]) {
      this._eventsForHandle(this.$handle2);
    }
  }

  /**
   * Adds event listeners a particular handle
   * @function
   * @private
   * @param {jQuery} $handle - the current handle to apply listeners to.
   */
  _eventsForHandle(handle) {
    var _this = this,
      curHandle;
    const handleChangeEvent = function (e) {
      const idx = _this.inputs.indexOf(this);
      _this._handleEvent(e, _this.handles[idx], this.value);
    };

    // IE only triggers the change event when the input loses focus which strictly follows the HTML specification
    // listen for the enter key and trigger a change
    // @see https://html.spec.whatwg.org/multipage/input.html#common-input-element-events
    // S10: the input keyup/change consumers flip to the native event
    // layer - their producers are real browser events, which reach native
    // listeners directly. `this` is the input element, and the listeners
    // are re-registered on every element of the collection like jQuery's
    // collection-wide .on() did.
    this.inputs.forEach(input => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(input, 'keyup.zf.slider change.zf.slider');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(input, 'keyup.zf.slider', function (e) {
        if (e.keyCode === 13) handleChangeEvent.call(this, e);
      });
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(input, 'change.zf.slider', handleChangeEvent);
    });
    if (this.options.clickSelect) {
      // S10: the bar-click consumer flips to the native event layer -
      // real clicks arrive directly and jQuery-synthesized clicks on the
      // container ride the `.click()` shortcut bridge (reveal-native
      // precedent).
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(this.$element, 'click.zf.slider');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(this.$element, 'click.zf.slider', function (e) {
        if (_this.$element.zfSliderDragging) {
          return false;
        }
        if (!e.target.matches('[data-slider-handle]')) {
          if (_this.options.doubleSided) {
            _this._handleEvent(e);
          } else {
            _this._handleEvent(e, _this.$handle);
          }
        }
      });
    }
    if (this.options.draggable) {
      // S13: the drag chain flips with the Touch util - addTouch feeds real
      // synthesized mouse events now, so the mousedown/mousemove/mouseup
      // listeners live on the native event layer and serve the mouse and
      // the touch feed alike.
      this.handles.forEach(handleEl => _foundation_util_touch__WEBPACK_IMPORTED_MODULE_5__.Touch.addTouch(handleEl));
      var handleEl = handle.nodeType === 1 ? handle : handle[0];
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(handleEl, 'mousedown.zf.slider selectstart.zf.slider touchmove.zf.slider');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(handleEl, 'mousedown.zf.slider', function (e) {
        handleEl.classList.add('is-dragging');
        if (_this.$fill) {
          _this.$fill.classList.add('is-dragging');
        }
        _this.$element.zfSliderDragging = true;
        curHandle = e.currentTarget;
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(document.body, 'mousemove.zf.slider', function (ev) {
          ev.preventDefault();
          _this._handleEvent(ev, curHandle);
        });
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(document.body, 'mouseup.zf.slider', function (ev) {
          _this._handleEvent(ev, curHandle);
          handleEl.classList.remove('is-dragging');
          if (_this.$fill) {
            _this.$fill.classList.remove('is-dragging');
          }
          _this.$element.zfSliderDragging = false;
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(document.body, 'mousemove.zf.slider mouseup.zf.slider');
        });
      });
      // prevent events triggered by touch
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(handleEl, 'selectstart.zf.slider touchmove.zf.slider', function (e) {
        e.preventDefault();
      });
    }

    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    var keydownEl = handle.nodeType === 1 ? handle : handle[0];
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(keydownEl, 'keydown.zf.slider');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.on(keydownEl, 'keydown.zf.slider', function (e) {
      var _$handle = this,
        oldValue = parseFloat(keydownEl.getAttribute('aria-valuenow')),
        newValue;

      // handle keyboard event with keyboard util
      _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.handleKey(e, 'Slider', {
        decrease: function () {
          newValue = oldValue - _this.options.step;
        },
        increase: function () {
          newValue = oldValue + _this.options.step;
        },
        decreaseFast: function () {
          newValue = oldValue - _this.options.step * 10;
        },
        increaseFast: function () {
          newValue = oldValue + _this.options.step * 10;
        },
        min: function () {
          newValue = _this.options.start;
        },
        max: function () {
          newValue = _this.options.end;
        },
        handled: function () {
          // only set handle pos when event was handled specially
          e.preventDefault();
          _this._setHandlePos(_$handle, newValue);
        }
      });
      /*if (newValue) { // if pressed key has special function, update value
        e.preventDefault();
        _this._setHandlePos(_$handle, newValue);
      }*/
    });
  }

  /**
   * Destroys the slider plugin.
   */
  _destroy() {
    // Every plugin-namespaced listener drops in one pass each (the input,
    // click, drag and keydown listeners all live on the native layer now),
    // plus any body-wide drag pair left mid-drag.
    this.inputs.forEach(input => _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(input, '.zf.slider'));
    this.handles.forEach(handle => _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(handle, '.zf.slider'));
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(document.body, 'mousemove.zf.slider mouseup.zf.slider');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_4__.Events.off(this.$element, '.zf.slider');
    clearTimeout(this.timeout);
  }
}
Slider.defaults = {
  /**
   * Minimum value for the slider scale.
   * @option
   * @type {number}
   * @default 0
   */
  start: 0,
  /**
   * Maximum value for the slider scale.
   * @option
   * @type {number}
   * @default 100
   */
  end: 100,
  /**
   * Minimum value change per change event.
   * @option
   * @type {number}
   * @default 1
   */
  step: 1,
  /**
   * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
   * @option
   * @type {number}
   * @default 0
   */
  initialStart: 0,
  /**
   * Value at which the right handle/second input should be set to on initialization.
   * @option
   * @type {number}
   * @default 100
   */
  initialEnd: 100,
  /**
   * Allows the input to be located outside the container and visible. Set to by the JS
   * @option
   * @type {boolean}
   * @default false
   */
  binding: false,
  /**
   * Allows the user to click/tap on the slider bar to select a value.
   * @option
   * @type {boolean}
   * @default true
   */
  clickSelect: true,
  /**
   * Set to true and use the `vertical` class to change alignment to vertical.
   * @option
   * @type {boolean}
   * @default false
   */
  vertical: false,
  /**
   * Allows the user to drag the slider handle(s) to select a value.
   * @option
   * @type {boolean}
   * @default true
   */
  draggable: true,
  /**
   * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
   * @option
   * @type {boolean}
   * @default false
   */
  disabled: false,
  /**
   * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
   * @option
   * @type {boolean}
   * @default false
   */
  doubleSided: false,
  /**
   * Potential future feature.
   */
  // steps: 100,
  /**
   * Number of decimal places the plugin should go to for floating point precision.
   * @option
   * @type {number}
   * @default 2
   */
  decimal: 2,
  /**
   * Time delay for dragged elements.
   */
  // dragDelay: 0,
  /**
   * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
   * @option
   * @type {number}
   * @default 200
   */
  moveTime: 200,
  //update this if changing the transition time in the sass
  /**
   * Class applied to disabled sliders.
   * @option
   * @type {string}
   * @default 'disabled'
   */
  disabledClass: 'disabled',
  /**
   * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
   * @option
   * @type {boolean}
   * @default false
   */
  invertVertical: false,
  /**
   * Milliseconds before the `changed.zf-slider` event is triggered after value change.
   * @option
   * @type {number}
   * @default 500
   */
  changedDelay: 500,
  /**
  * Basevalue for non-linear sliders
  * @option
  * @type {number}
  * @default 5
  */
  nonLinearBase: 5,
  /**
  * Basevalue for non-linear sliders, possible values are: `'linear'`, `'pow'` & `'log'`. Pow and Log use the nonLinearBase setting.
  * @option
  * @type {string}
  * @default 'linear'
  */
  positionValueFunction: 'linear'
};
function percent(frac, num) {
  return frac / num;
}
function absPosition(handle, dir, clickPos, param) {
  // jQuery position(): the offsetParent-relative position; the sliders are
  // absolutely positioned inside the (relative) slider element, so the
  // offsetParent chain bottoms out there - rect-difference form.
  var parentRect = handle.offsetParent ? handle.offsetParent.getBoundingClientRect() : {
    top: 0,
    left: 0
  };
  var handleRect = handle.getBoundingClientRect();
  var pos = dir === 'top' ? handleRect.top - parentRect.top : handleRect.left - parentRect.left;
  // $handle[param](): the outer height/width (rect dimension, border-box)
  var dim = dir === 'top' ? handleRect.height : handleRect.width;
  return Math.abs(pos + dim / 2 - clickPos);
}
function baseLog(base, value) {
  return Math.log(value) / Math.log(base);
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
  !*** ./js/entries/plugins/foundation.slider.js ***!
  \*************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Slider: () => (/* reexport safe */ _foundation_slider__WEBPACK_IMPORTED_MODULE_1__.Slider)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_slider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.slider */ "./js/foundation.slider.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_slider__WEBPACK_IMPORTED_MODULE_1__.Slider, 'Slider');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.slider.js.map