(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.motion"), require("./foundation.util.timer"), require("./foundation.util.imageLoader"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.touch"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.keyboard", "./foundation.util.motion", "./foundation.util.timer", "./foundation.util.imageLoader", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.touch"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.keyboard"), require("./foundation.util.motion"), require("./foundation.util.timer"), require("./foundation.util.imageLoader"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.touch"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.orbit"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.motion"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.timer"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.imageLoader"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_motion__, __WEBPACK_EXTERNAL_MODULE__foundation_util_timer__, __WEBPACK_EXTERNAL_MODULE__foundation_util_imageLoader__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.orbit.js":
/*!********************************!*\
  !*** ./js/foundation.orbit.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Orbit: () => (/* binding */ Orbit)
/* harmony export */ });
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.motion */ "./foundation.util.motion");
/* harmony import */ var _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_timer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.timer */ "./foundation.util.timer");
/* harmony import */ var _foundation_util_timer__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_timer__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.imageLoader */ "./foundation.util.imageLoader");
/* harmony import */ var _foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.core.plugin */ "./foundation.core");
/* harmony import */ var _foundation_core_utils__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_utils__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__);










/**
 * Orbit module.
 * @module foundation.orbit
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 * @requires foundation.util.timer
 * @requires foundation.util.imageLoader
 * @requires foundation.util.touch
 */

class Orbit extends _foundation_core_utils__WEBPACK_IMPORTED_MODULE_4__.Plugin {
  /**
  * Creates a new instance of an orbit carousel.
  * @class
  * @name Orbit
  * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
  * @param {Object} options - Overrides to the default plugin settings.
  */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_5__.deepMerge)({}, Orbit.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_5__.datasetOptions)(this.$element), options);
    this.className = 'Orbit'; // ie9 back compat

    _foundation_util_touch__WEBPACK_IMPORTED_MODULE_7__.Touch.init(); // Touch init is idempotent, we just need to make sure it's initialied.

    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.register('Orbit', {
      'ltr': {
        'ARROW_RIGHT': 'next',
        'ARROW_LEFT': 'previous'
      },
      'rtl': {
        'ARROW_LEFT': 'next',
        'ARROW_RIGHT': 'previous'
      }
    });
  }

  /**
  * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
  * @function
  * @private
  */
  _init() {
    // @TODO: consider discussion on PR #9278 about DOM pollution by changeSlide
    this._reset();
    this.$wrapper = this.$element.querySelector(`.${this.options.containerClass}`);
    this.$slides = Array.from(this.$element.querySelectorAll(`.${this.options.slideClass}`));
    var images = this.$element.querySelectorAll('img'),
      initActive = this.$slides.filter(slide => slide.classList.contains('is-active')),
      id = this.$element.id || (0,_foundation_core_utils__WEBPACK_IMPORTED_MODULE_4__.GetYoDigits)(6, 'orbit');

    // State attributes and classes go through the native layer (7.0 line A, S10).
    this.$element.setAttribute('data-resize', id);
    this.$element.id = id;
    if (!initActive.length && this.$slides.length) {
      this.$slides[0].classList.add('is-active');
    }
    if (!this.options.useMUI) {
      this.$slides.forEach(slide => slide.classList.add('no-motionui'));
    }
    if (images.length) {
      (0,_foundation_util_imageLoader__WEBPACK_IMPORTED_MODULE_3__.onImagesLoaded)(images, this._prepareForOrbit.bind(this));
    } else {
      this._prepareForOrbit(); //hehe
    }
    if (this.options.bullets) {
      this._loadBullets();
    }
    this._events();
    if (this.options.autoPlay && this.$slides.length > 1) {
      this.geoSync();
    }
    if (this.options.accessible) {
      // allow wrapper to be focusable to enable arrow navigation
      this.$wrapper.setAttribute('tabindex', 0);
    }
  }

  /**
  * Creates a jQuery collection of bullets, if they are being used.
  * @function
  * @private
  */
  _loadBullets() {
    this.$bullets = Array.from(this.$element.querySelectorAll(`.${this.options.boxOfBullets} button`));
  }

  /**
  * Sets a `timer` object on the orbit, and starts the counter for the next slide.
  * @function
  */
  geoSync() {
    var _this = this;
    this.timer = new _foundation_util_timer__WEBPACK_IMPORTED_MODULE_2__.Timer(this.$element, {
      duration: this.options.timerDelay,
      infinite: false
    }, function () {
      _this.changeSlide(true);
    }, 'orbit');
    this.timer.start();
  }

  /**
  * Sets wrapper and slide heights for the orbit.
  * @function
  * @private
  */
  _prepareForOrbit() {
    this._setWrapperHeight();
  }

  /**
  * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
  * @function
  * @private
  * @param {Function} cb - a callback function to fire when complete.
  */
  _setWrapperHeight(cb) {
    //rewrite this to `for` loop
    var max = 0,
      temp,
      counter = 0,
      _this = this;
    this.$slides.forEach(function (slide) {
      temp = slide.getBoundingClientRect().height;
      slide.setAttribute('data-slide', counter);

      // hide all slides but the active one
      if (!/mui/g.test(slide.className) && _this.$slides.filter(s => s.classList.contains('is-active'))[0] !== _this.$slides[counter]) {
        slide.style.display = 'none';
      }
      max = temp > max ? temp : max;
      counter++;
    });
    if (counter === this.$slides.length) {
      this.$wrapper.style.height = max + 'px'; //only change the wrapper height property once.
      if (cb) {
        cb(max);
      } //fire callback with max height dimension.
    }
  }

  /**
  * Sets the max-height of each slide.
  * @function
  * @private
  */
  _setSlideHeight(height) {
    this.$slides.forEach(function (slide) {
      slide.style.maxHeight = height + 'px';
    });
  }

  /**
  * Adds event listeners to basically everything within the element.
  * @function
  * @private
  */
  _events() {
    var _this = this;

    //***************************************
    //**Now using custom event - thanks to:**
    //**      Yohai Ararat of Toronto      **
    //***************************************
    //
    // S10: the resizeme consumer runs on the native event layer; the
    // producer in the Triggers util has dispatched real element-local
    // events since S4.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(this.$element, 'resizeme.zf.trigger');
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(this.$element, 'resizeme.zf.trigger', this._prepareForOrbit.bind(this));
    if (this.$slides.length > 1) {
      if (this.options.swipe) {
        // S13: the swipe consumers flip with the Touch util - swipeleft/
        // swiperight are real, bubbling events on the slide now, so these
        // listeners live on the native event layer.
        this.$slides.forEach(slide => {
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(slide, 'swipeleft.zf.orbit swiperight.zf.orbit');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(slide, 'swipeleft.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide(true);
          });
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(slide, 'swiperight.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide(false);
          });
        });
      }
      //***************************************

      if (this.options.autoPlay) {
        // S10: the slide click consumer runs on the native event layer -
        // real clicks arrive directly and jQuery-synthesized clicks on
        // slides ride the `.click()` shortcut bridge (reveal-native
        // precedent). The clickedOn bookkeeping rides an expando (the 6.x
        // jQuery data cache was DOM-invisible).
        this.$slides.forEach(slide => {
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(slide, 'click.zf.orbit');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(slide, 'click.zf.orbit', function () {
            _this.$element.zfOrbitClickedOn = !_this.$element.zfOrbitClickedOn;
            _this.timer[_this.$element.zfOrbitClickedOn ? 'pause' : 'start']();
          });
        });
        if (this.options.pauseOnHover) {
          // 7.0 terminal form: hover on real mouseover/mouseout with the
          // entering/leaving filter (jQuery's mouseenter synthesis port).
          var hoverFilter = function (handler) {
            return function (e) {
              if (e.relatedTarget && this.contains(e.relatedTarget)) {
                return;
              }
              handler.call(this, e);
            };
          };
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(this.$element, 'mouseover.zf.orbit mouseout.zf.orbit');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(this.$element, 'mouseover.zf.orbit', hoverFilter(function () {
            _this.timer.pause();
          }));
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(this.$element, 'mouseout.zf.orbit', hoverFilter(function () {
            if (!_this.$element.zfOrbitClickedOn) {
              _this.timer.start();
            }
          }));
        }
      }
      if (this.options.navButtons) {
        var controls = Array.from(this.$element.querySelectorAll(`.${this.options.nextClass}, .${this.options.prevClass}`));
        // S10: the nav-button click consumers run on the native event
        // layer; the tabindex write goes native with it.
        controls.forEach(control => {
          control.setAttribute('tabindex', 0);
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(control, 'click.zf.orbit touchend.zf.orbit');
          //also need to handle enter/return and spacebar key presses
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(control, 'click.zf.orbit touchend.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide(this.classList.contains(_this.options.nextClass));
          });
        });
      }
      if (this.options.bullets) {
        // S10: the bullet click consumers run on the native event layer
        // (real clicks; jQuery-synthesized clicks on buttons ride the
        // `.click()` shortcut bridge). The data reads are the numeric
        // attribute parses jQuery's .data() performed.
        this.$bullets.forEach(bullet => {
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(bullet, 'click.zf.orbit touchend.zf.orbit');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(bullet, 'click.zf.orbit touchend.zf.orbit', function () {
            if (/is-active/g.test(this.className)) {
              return false;
            } //if this is active, kick out of function.
            var idx = parseInt(this.getAttribute('data-slide'), 10),
              activeSlide = _this.$slides.filter(s => s.classList.contains('is-active'))[0],
              ltr = activeSlide ? idx > parseInt(activeSlide.getAttribute('data-slide'), 10) : true,
              slide = _this.$slides[idx];
            _this.changeSlide(ltr, slide, idx);
          });
        });
      }
      if (this.options.accessible) {
        // 7.0 terminal form: the keydown listener runs on the native event
        // layer (the coarse suite's mocks dispatch real KeyboardEvents
        // since the S16 migration), on the wrapper and every bullet like
        // the collection-wide .on() did.
        [this.$wrapper].concat(this.$bullets).filter(Boolean).forEach(bound => {
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(bound, 'keydown.zf.orbit');
          _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.on(bound, 'keydown.zf.orbit', function (e) {
            // handle keyboard event with keyboard util
            _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_0__.Keyboard.handleKey(e, 'Orbit', {
              next: function () {
                _this.changeSlide(true);
              },
              previous: function () {
                _this.changeSlide(false);
              },
              handled: function () {
                // if bullet is focused, make sure focus moves
                if (_this.$bullets.indexOf(e.target) !== -1) {
                  // the collection .focus() focused the first active bullet
                  var activeBullet = _this.$bullets.filter(b => b.classList.contains('is-active'))[0];
                  if (activeBullet) {
                    activeBullet.focus();
                  }
                }
              }
            });
          });
        });
      }
    }
  }

  /**
   * Resets Orbit so it can be reinitialized
   */
  _reset() {
    // Don't do anything if there are no slides (first run)
    if (typeof this.$slides === 'undefined') {
      return;
    }
    if (this.$slides.length > 1) {
      // Remove old events (S10/S13): the native wipe drops the click, swipe,
      // keydown and hover listeners on the element and its descendants.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(this.$element, '.zf.orbit');
      Array.from(this.$element.querySelectorAll('*')).forEach(el => _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(el, '.zf.orbit'));

      // Restart timer if autoPlay is enabled
      if (this.options.autoPlay) {
        this.timer.restart();
      }

      // Reset all slides
      this.$slides.forEach(function (slide) {
        slide.classList.remove('is-active', 'is-in');
        slide.removeAttribute('aria-live');
        slide.style.display = 'none';
      });

      // Show the first slide
      this.$slides[0].classList.add('is-active');
      this.$slides[0].style.display = '';

      // Triggers when the slide has finished animating
      // S10: real, bubbling CustomEvent; the terminal form forwards the
      // plain slide element.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.trigger(this.$element, 'slidechange.zf.orbit', [this.$slides[0]]);

      // Select first bullet if bullets are present
      if (this.options.bullets) {
        this._updateBullets(0);
      }
    }
  }

  /**
  * Changes the current slide to a new one.
  * @function
  * @param {Boolean} isLTR - if true the slide moves from right to left, if false the slide moves from left to right.
  * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
  * @param {Number} idx - the index of the new slide in its collection, if one chosen.
  * @fires Orbit#slidechange
  */
  changeSlide(isLTR, chosenSlide, idx) {
    if (!this.$slides) {
      return;
    } // Don't freak out if we're in the middle of cleanup
    // Accepts the plain element (the 7.0 contract) or a collection.
    if (chosenSlide && chosenSlide.nodeType !== 1) {
      chosenSlide = chosenSlide[0];
    }
    var curSlide = this.$slides.filter(s => s.classList.contains('is-active'))[0];
    if (/mui/g.test(curSlide.className)) {
      return false;
    } //if the slide is currently animating, kick out of the function

    var firstSlide = this.$slides[0],
      lastSlide = this.$slides[this.$slides.length - 1],
      dirIn = isLTR ? 'Right' : 'Left',
      dirOut = isLTR ? 'Left' : 'Right',
      _this = this,
      newSlide;
    var sibling = function (el, dir) {
      var next = dir === 'next' ? el.nextElementSibling : el.previousElementSibling;
      return next && next.matches(`.${_this.options.slideClass}`) ? next : null;
    };
    if (!chosenSlide) {
      //most of the time, this will be auto played or clicked from the navButtons.
      newSlide = isLTR ?
      //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
      this.options.infiniteWrap ? sibling(curSlide, 'next') || firstSlide : sibling(curSlide, 'next') //pick next slide if moving left to right
      : this.options.infiniteWrap ? sibling(curSlide, 'prev') || lastSlide : sibling(curSlide, 'prev'); //pick prev slide if moving right to left
    } else {
      newSlide = chosenSlide;
    }
    if (newSlide) {
      /**
      * Triggers before the next slide starts animating in and only if a next slide has been found.
      * @event Orbit#beforeslidechange
      */
      // Terminal form: the forwarded slides are plain elements.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.trigger(this.$element, 'beforeslidechange.zf.orbit', [curSlide, newSlide]);
      if (this.options.bullets) {
        idx = idx || this.$slides.indexOf(newSlide); //grab index to update bullets
        this._updateBullets(idx);
      }
      if (this.options.useMUI && (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_5__.visible)(this.$element)) {
        newSlide.classList.add('is-active');
        _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion.animateIn(newSlide, this.options[`animInFrom${dirIn}`], function () {
          newSlide.style.display = 'block';
          newSlide.setAttribute('aria-live', 'polite');
        });
        curSlide.classList.remove('is-active');
        _foundation_util_motion__WEBPACK_IMPORTED_MODULE_1__.Motion.animateOut(curSlide, this.options[`animOutTo${dirOut}`], function () {
          curSlide.removeAttribute('aria-live');
          if (_this.options.autoPlay && !_this.timer.isPaused) {
            _this.timer.restart();
          }
          //do stuff?
        });
      } else {
        curSlide.classList.remove('is-active', 'is-in');
        curSlide.removeAttribute('aria-live');
        curSlide.style.display = 'none';
        newSlide.classList.add('is-active', 'is-in');
        newSlide.setAttribute('aria-live', 'polite');
        newSlide.style.display = '';
        if (this.options.autoPlay && !this.timer.isPaused) {
          this.timer.restart();
        }
      }
      /**
      * Triggers when the slide has finished animating in.
      * @event Orbit#slidechange
      */
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.trigger(this.$element, 'slidechange.zf.orbit', [newSlide]);
    }
  }

  /**
  * Updates the active state of the bullets, if displayed.
  * Move the descriptor of the current slide `[data-slide-active-label]` to the newly active bullet.
  * If no `[data-slide-active-label]` is set, will move the exceeding `span` element.
  *
  * @function
  * @private
  * @param {Number} idx - the index of the current slide.
  */
  _updateBullets(idx) {
    var oldBullet = this.$bullets.filter(b => b.classList.contains('is-active'))[0];
    var othersBullets = this.$bullets.filter(b => !b.classList.contains('is-active'));
    var newBullet = this.$bullets[idx];
    if (oldBullet) {
      oldBullet.classList.remove('is-active');
      oldBullet.blur();
    }
    if (newBullet) {
      newBullet.classList.add('is-active');
    }
    if (!oldBullet || !newBullet) {
      return;
    }

    // Find the descriptor for the current slide to move it to the new slide button
    var labeled = Array.from(oldBullet.querySelectorAll(':scope > [data-slide-active-label]'));
    var activeStateDescriptor = labeled[labeled.length - 1];

    // If not explicitely given, search for the last "exceeding" span element (compared to others bullets).
    if (!activeStateDescriptor) {
      var spans = Array.from(oldBullet.querySelectorAll(':scope > span'));
      var spanCountInOthersBullets = othersBullets.map(b => b.querySelectorAll(':scope > span').length);

      // If there is an exceeding span element, use it as current slide descriptor
      if (spanCountInOthersBullets.every(count => count < spans.length)) {
        activeStateDescriptor = spans[spans.length - 1];
        activeStateDescriptor.setAttribute('data-slide-active-label', '');
      }
    }

    // Move the current slide descriptor to the new slide button
    if (activeStateDescriptor) {
      // .detach() + .append(): appendChild moves it (the descriptor carried
      // no per-element listeners)
      newBullet.appendChild(activeStateDescriptor);
    }
  }

  /**
  * Destroys the carousel and hides the element.
  * @function
  */
  _destroy() {
    // The native wipe drops every plugin-namespaced listener on the element
    // and its descendants (like _reset), then the destroy cleanup hides it.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(this.$element, '.zf.orbit');
    Array.from(this.$element.querySelectorAll('*')).forEach(el => _foundation_util_events__WEBPACK_IMPORTED_MODULE_6__.Events.off(el, '.zf.orbit'));
    this.$element.style.display = 'none';
    // Guarded (S14): the timer only exists when geoSync ran - autoPlay on
    // AND more than one slide. 6.x threw a TypeError on every destroy of a
    // single-slide or non-autoplay carousel; the guard keeps the M1 fix
    // (destroy stops the timer) for the instances that have one.
    if (this.timer) {
      this.timer.pause();
    }
  }
}
Orbit.defaults = {
  /**
  * Tells the JS to look for and loadBullets.
  * @option
   * @type {boolean}
  * @default true
  */
  bullets: true,
  /**
  * Tells the JS to apply event listeners to nav buttons
  * @option
   * @type {boolean}
  * @default true
  */
  navButtons: true,
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-in-right'
  */
  animInFromRight: 'slide-in-right',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-out-right'
  */
  animOutToRight: 'slide-out-right',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-in-left'
  *
  */
  animInFromLeft: 'slide-in-left',
  /**
  * motion-ui animation class to apply
  * @option
   * @type {string}
  * @default 'slide-out-left'
  */
  animOutToLeft: 'slide-out-left',
  /**
  * Allows Orbit to automatically animate on page load.
  * @option
   * @type {boolean}
  * @default true
  */
  autoPlay: true,
  /**
  * Amount of time, in ms, between slide transitions
  * @option
   * @type {number}
  * @default 5000
  */
  timerDelay: 5000,
  /**
  * Allows Orbit to infinitely loop through the slides
  * @option
   * @type {boolean}
  * @default true
  */
  infiniteWrap: true,
  /**
  * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
  * @option
   * @type {boolean}
  * @default true
  */
  swipe: true,
  /**
  * Allows the timing function to pause animation on hover.
  * @option
   * @type {boolean}
  * @default true
  */
  pauseOnHover: true,
  /**
  * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
  * @option
   * @type {boolean}
  * @default true
  */
  accessible: true,
  /**
  * Class applied to the container of Orbit
  * @option
   * @type {string}
  * @default 'orbit-container'
  */
  containerClass: 'orbit-container',
  /**
  * Class applied to individual slides.
  * @option
   * @type {string}
  * @default 'orbit-slide'
  */
  slideClass: 'orbit-slide',
  /**
  * Class applied to the bullet container. You're welcome.
  * @option
   * @type {string}
  * @default 'orbit-bullets'
  */
  boxOfBullets: 'orbit-bullets',
  /**
  * Class applied to the `next` navigation button.
  * @option
   * @type {string}
  * @default 'orbit-next'
  */
  nextClass: 'orbit-next',
  /**
  * Class applied to the `previous` navigation button.
  * @option
   * @type {string}
  * @default 'orbit-previous'
  */
  prevClass: 'orbit-previous',
  /**
  * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatibility.
  * @option
   * @type {boolean}
  * @default true
  */
  useMUI: true
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

/***/ "./foundation.util.imageLoader":
/*!****************************************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.imageLoader"],"amd":"./foundation.util.imageLoader","commonjs":"./foundation.util.imageLoader","commonjs2":"./foundation.util.imageLoader"} ***!
  \****************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_imageLoader__;

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

/***/ "./foundation.util.timer":
/*!****************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.timer"],"amd":"./foundation.util.timer","commonjs":"./foundation.util.timer","commonjs2":"./foundation.util.timer"} ***!
  \****************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_timer__;

/***/ }),

/***/ "./foundation.util.touch":
/*!****************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.touch"],"amd":"./foundation.util.touch","commonjs":"./foundation.util.touch","commonjs2":"./foundation.util.touch"} ***!
  \****************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__;

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
/*!************************************************!*\
  !*** ./js/entries/plugins/foundation.orbit.js ***!
  \************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation),
/* harmony export */   Orbit: () => (/* reexport safe */ _foundation_orbit__WEBPACK_IMPORTED_MODULE_1__.Orbit)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_orbit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.orbit */ "./js/foundation.orbit.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_orbit__WEBPACK_IMPORTED_MODULE_1__.Orbit, 'Orbit');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.orbit.js.map