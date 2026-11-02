(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.keyboard"), require("./foundation.util.nest"), require("./foundation.util.box"), require("./foundation.util.touch"));
	else if(typeof define === 'function' && define.amd)
		define(["./foundation.core", "./foundation.util.dom", "./foundation.util.events", "./foundation.util.keyboard", "./foundation.util.nest", "./foundation.util.box", "./foundation.util.touch"], factory);
	else if(typeof exports === 'object')
		exports["__FOUNDATION_EXTERNAL__"] = factory(require("./foundation.core"), require("./foundation.util.dom"), require("./foundation.util.events"), require("./foundation.util.keyboard"), require("./foundation.util.nest"), require("./foundation.util.box"), require("./foundation.util.touch"));
	else
		root["__FOUNDATION_EXTERNAL__"] = root["__FOUNDATION_EXTERNAL__"] || {}, root["__FOUNDATION_EXTERNAL__"]["foundation.dropdownMenu"] = factory(root["__FOUNDATION_EXTERNAL__"]["foundation.core"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.dom"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.events"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.keyboard"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.nest"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.box"], root["__FOUNDATION_EXTERNAL__"]["foundation.util.touch"]);
})(globalThis, (__WEBPACK_EXTERNAL_MODULE__foundation_core__, __WEBPACK_EXTERNAL_MODULE__foundation_util_dom__, __WEBPACK_EXTERNAL_MODULE__foundation_util_events__, __WEBPACK_EXTERNAL_MODULE__foundation_util_keyboard__, __WEBPACK_EXTERNAL_MODULE__foundation_util_nest__, __WEBPACK_EXTERNAL_MODULE__foundation_util_box__, __WEBPACK_EXTERNAL_MODULE__foundation_util_touch__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/foundation.dropdownMenu.js":
/*!***************************************!*\
  !*** ./js/foundation.dropdownMenu.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DropdownMenu: () => (/* binding */ DropdownMenu)
/* harmony export */ });
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core.utils */ "./foundation.core");
/* harmony import */ var _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./foundation.util.dom */ "./foundation.util.dom");
/* harmony import */ var _foundation_util_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./foundation.util.events */ "./foundation.util.events");
/* harmony import */ var _foundation_util_events__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_events__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./foundation.util.keyboard */ "./foundation.util.keyboard");
/* harmony import */ var _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _foundation_util_nest__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./foundation.util.nest */ "./foundation.util.nest");
/* harmony import */ var _foundation_util_nest__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_nest__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _foundation_util_box__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./foundation.util.box */ "./foundation.util.box");
/* harmony import */ var _foundation_util_box__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_box__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./foundation.util.touch */ "./foundation.util.touch");
/* harmony import */ var _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__);









/**
 * DropdownMenu module.
 * @module foundation.dropdownMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.nest
 * @requires foundation.util.touch
 */

class DropdownMenu extends _foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  /**
   * Creates a new instance of DropdownMenu.
   * @class
   * @name DropdownMenu
   * @fires DropdownMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.deepMerge)({}, DropdownMenu.defaults, (0,_foundation_util_dom__WEBPACK_IMPORTED_MODULE_1__.datasetOptions)(this.$element), options);
    this.className = 'DropdownMenu'; // ie9 back compat

    _foundation_util_touch__WEBPACK_IMPORTED_MODULE_6__.Touch.init(); // Touch init is idempotent, we just need to make sure it's initialied.

    this._init();
    _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.register('DropdownMenu', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close'
    });
  }

  /**
   * Initializes the plugin, and calls _prepareMenu
   * @private
   * @function
   */
  _init() {
    _foundation_util_nest__WEBPACK_IMPORTED_MODULE_4__.Nest.Feather(this.$element, 'dropdown');
    var subs = Array.from(this.$element.querySelectorAll('li.is-dropdown-submenu-parent'));
    this.$element.querySelectorAll(':scope > .is-dropdown-submenu-parent > .is-dropdown-submenu').forEach(el => {
      el.classList.add('first-sub');
    });
    this.$menuItems = Array.from(this.$element.querySelectorAll('li[role="none"]'));
    this.$tabs = Array.from(this.$element.querySelectorAll(':scope > li[role="none"]'));
    this.$tabs.forEach(tab => {
      tab.querySelectorAll('ul.is-dropdown-submenu').forEach(ul => {
        ul.classList.add(this.options.verticalClass);
      });
    });
    if (this.options.alignment === 'auto') {
      // .parents('.top-bar-right').is('*'): any matching ancestor
      var inTopBarRight = false,
        anc = this.$element.parentElement;
      while (anc && anc.nodeType === 1) {
        if (anc.matches('.top-bar-right')) {
          inTopBarRight = true;
          break;
        }
        anc = anc.parentElement;
      }
      if (this.$element.classList.contains(this.options.rightClass) || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.rtl)() || inTopBarRight) {
        this.options.alignment = 'right';
        subs.forEach(el => el.classList.add('opens-left'));
      } else {
        this.options.alignment = 'left';
        subs.forEach(el => el.classList.add('opens-right'));
      }
    } else {
      if (this.options.alignment === 'right') {
        subs.forEach(el => el.classList.add('opens-left'));
      } else {
        subs.forEach(el => el.classList.add('opens-right'));
      }
    }
    this.changed = false;
    this._events();
  }
  _isVertical() {
    // jQuery .css(): the computed value
    return window.getComputedStyle(this.$tabs[0]).display === 'block' || window.getComputedStyle(this.$element).flexDirection === 'column';
  }
  _isRtl() {
    return this.$element.classList.contains('align-right') || (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.rtl)() && !this.$element.classList.contains('align-left');
  }

  /**
   * Adds event listeners to elements within the menu
   * @private
   * @function
   */
  _events() {
    var _this = this,
      hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
      parClass = 'is-dropdown-submenu-parent';

    // used for onClick and in the keyboard handlers
    var handleClickFn = function (e) {
      // $(target).parentsUntil('ul', '.parClass'): the nearest ancestor
      // matching the class, walking up but not past a <ul>
      var elem = e.target.parentElement;
      while (elem && elem.tagName !== 'UL') {
        if (elem.matches(`.${parClass}`)) {
          break;
        }
        elem = elem.parentElement;
      }
      var found = elem && elem.tagName !== 'UL' && elem.matches(`.${parClass}`) ? elem : null,
        hasSub = !!found,
        hasClicked = found && found.getAttribute('data-is-click') === 'true',
        sub = found && found.querySelector(':scope > .is-dropdown-submenu');
      if (hasSub) {
        if (hasClicked) {
          if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
            return;
          }
          e.stopImmediatePropagation();
          e.preventDefault();
          _this._hide(found);
        } else {
          e.stopImmediatePropagation();
          e.preventDefault();
          _this._show(sub);
          // S9: the click-state attribute flips natively.
          var chain = [found];
          var anc = found.parentElement;
          while (anc && anc !== _this.$element) {
            if (anc.matches(`.${parClass}`)) {
              chain.push(anc);
            }
            anc = anc.parentElement;
          }
          chain.forEach(el => el.setAttribute('data-is-click', 'true'));
        }
      }
    };
    if (this.options.clickOpen || hasTouch) {
      // S9: the click (and real touchstart) consumer flips to the native
      // event layer - real events reach it directly and jQuery-synthesized
      // clicks on non-link items ride the `.click()` shortcut bridge
      // (reveal-native precedent; jQuery suppresses that shortcut for link
      // anchors, so a jQuery-synthesized click on the `<a>` itself stays
      // undelivered - a real click is the user contract). The library itself
      // has no jQuery-synthesized touchstart producer left (the Touch util
      // makes 'tap').
      this.$menuItems.forEach(item => {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(item, 'click.zf.dropdownMenu touchstart.zf.dropdownMenu', handleClickFn);
      });
    }

    // Handle Leaf element Clicks
    if (_this.options.closeOnClickInside) {
      this.$menuItems.forEach(item => {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(item, 'click.zf.dropdownMenu', function () {
          if (!this.classList.contains(parClass)) {
            _this._hide();
          }
        });
      });
    }
    if (hasTouch && this.options.disableHoverOnTouch) this.options.disableHover = true;

    // 7.0 terminal form: hover intent runs on the native layer. jQuery's
    // mouseenter/mouseleave are real mouseover/mouseout with the
    // within-element filter; the delay timers ride an expando like jQuery's
    // DOM-invisible data cache.
    if (!this.options.disableHover) {
      var hoverFilter = function (handler) {
        return function (e) {
          if (e.relatedTarget && this.contains(e.relatedTarget)) {
            return;
          }
          handler.call(this, e);
        };
      };
      this.$menuItems.forEach(item => {
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(item, 'mouseover.zf.dropdownMenu mouseout.zf.dropdownMenu');
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(item, 'mouseover.zf.dropdownMenu', hoverFilter(function () {
          if (this.classList.contains(parClass)) {
            clearTimeout(this.zfMenuDelay);
            const el = this;
            el.zfMenuDelay = setTimeout(function () {
              _this._show(el.querySelector(':scope > .is-dropdown-submenu'));
            }, _this.options.hoverDelay);
          }
        }));
        _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(item, 'mouseout.zf.dropdownMenu', (0,_foundation_core_plugin__WEBPACK_IMPORTED_MODULE_0__.ignoreMousedisappear)(function () {
          if (this.classList.contains(parClass) && _this.options.autoclose) {
            if (this.getAttribute('data-is-click') === 'true' && _this.options.clickOpen) {
              return false;
            }
            clearTimeout(this.zfMenuDelay);
            const el = this;
            el.zfMenuDelay = setTimeout(function () {
              _this._hide(el);
            }, _this.options.closingTime);
          }
        }));
      });
    }
    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration).
    this.$menuItems.forEach(menuItem => {
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(menuItem, 'keydown.zf.dropdownMenu');
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(menuItem, 'keydown.zf.dropdownMenu', function (e) {
        // $(target).parentsUntil('ul', '[role="none"]'): the nearest
        // role="none" li ancestor, not walking past a <ul>
        var element = e.target.parentElement;
        while (element && element.tagName !== 'UL') {
          if (element.matches('[role="none"]')) {
            break;
          }
          element = element.parentElement;
        }
        element = element && element.tagName !== 'UL' && element.matches('[role="none"]') ? element : null;
        if (!element) {
          return;
        }
        var isTab = _this.$tabs.indexOf(element) > -1,
          // jQuery .siblings('li').add($element) sorts into document order:
          // the parent's li children including the element itself
          elements = isTab ? _this.$tabs : Array.from(element.parentElement.children).filter(el => el.matches('li')),
          prevElement,
          nextElement;
        var i = elements.indexOf(element);
        prevElement = elements[i - 1];
        nextElement = elements[i + 1];
        var nextSibling = function () {
            if (nextElement) nextElement.querySelector(':scope > a').focus();
            e.preventDefault();
          },
          prevSibling = function () {
            if (prevElement) prevElement.querySelector(':scope > a').focus();
            e.preventDefault();
          },
          openSub = function () {
            var sub = element.querySelector(':scope > ul.is-dropdown-submenu');
            if (sub) {
              _this._show(sub);
              // jQuery's find('li > a:first') scoped the child combinator to
              // the subtree (the item's own anchor never matched); the first
              // anchor inside the submenu is the focused one
              sub.querySelector('a').focus();
              e.preventDefault();
            } else {
              return;
            }
          },
          closeSub = function () {
            //if ($element.is(':first-child')) {
            var close = element.parentElement.parentElement;
            if (close.matches('li')) {
              var link = close.querySelector(':scope > a');
              if (link) link.focus();
              _this._hide(close);
            }
            e.preventDefault();
            //}
          };
        var functions = {
          open: openSub,
          close: function () {
            _this._hide(_this.$element);
            var firstLink = _this.$menuItems[0].querySelector(':scope > a');
            if (firstLink) firstLink.focus(); // focus to first element
            e.preventDefault();
          }
        };
        if (isTab) {
          if (_this._isVertical()) {
            // vertical menu
            if (_this._isRtl()) {
              // right aligned
              Object.assign(functions, {
                down: nextSibling,
                up: prevSibling,
                next: closeSub,
                previous: openSub
              });
            } else {
              // left aligned
              Object.assign(functions, {
                down: nextSibling,
                up: prevSibling,
                next: openSub,
                previous: closeSub
              });
            }
          } else {
            // horizontal menu
            if (_this._isRtl()) {
              // right aligned
              Object.assign(functions, {
                next: prevSibling,
                previous: nextSibling,
                down: openSub,
                up: closeSub
              });
            } else {
              // left aligned
              Object.assign(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          }
        } else {
          // not tabs -> one sub
          if (_this._isRtl()) {
            // right aligned
            Object.assign(functions, {
              next: closeSub,
              previous: openSub,
              down: nextSibling,
              up: prevSibling
            });
          } else {
            // left aligned
            Object.assign(functions, {
              next: openSub,
              previous: closeSub,
              down: nextSibling,
              up: prevSibling
            });
          }
        }
        _foundation_util_keyboard__WEBPACK_IMPORTED_MODULE_3__.Keyboard.handleKey(e, 'DropdownMenu', functions);
      });
    });
  }

  /**
   * Adds an event handler to the body to close any dropdowns on a click.
   * @function
   * @private
   */
  _addBodyHandler() {
    const body = document.body;
    this._removeBodyHandler();
    const bodyHandler = e => {
      // $(target).closest($element): the element or any descendant
      var isItself = e.target === this.$element || this.$element.contains(e.target);
      if (isItself) return;
      this._hide();
      this._removeBodyHandler();
    };
    // S13: the tap half flips with the Touch util - 'tap' is a real,
    // bubbling event on the touched element now, so this native body
    // listener hears it (real clicks arrived through this layer since S9).
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.on(body, 'click.zf.dropdownMenu tap.zf.dropdownMenu', bodyHandler);
  }

  /**
   * Remove the body event handler. See `_addBodyHandler`.
   * @function
   * @private
   */
  _removeBodyHandler() {
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(document.body, 'click.zf.dropdownMenu tap.zf.dropdownMenu');
  }

  /**
   * Opens a dropdown pane, and checks for collisions first.
   * @param {jQuery} $sub - ul element that is a submenu to show
   * @function
   * @private
   * @fires DropdownMenu#show
   */
  _show(sub) {
    sub = sub.nodeType === 1 ? sub : sub[0];
    // which top-level tab owns this submenu
    var ownerTab = sub.closest('li[role="none"]');
    while (ownerTab && ownerTab.parentElement !== this.$element) {
      ownerTab = ownerTab.parentElement ? ownerTab.parentElement.closest('li[role="none"]') : null;
    }
    var idx = ownerTab ? this.$tabs.indexOf(ownerTab) : -1;
    var parentLi = sub.parentElement && sub.parentElement.matches('li.is-dropdown-submenu-parent') ? sub.parentElement : null;
    var sibs = parentLi ? Array.from(parentLi.parentElement.children).filter(el => el.matches('li.is-dropdown-submenu-parent')) : [];
    this._hide(sibs, idx);
    // S9: class/inline-style state flips natively.
    sub.style.visibility = 'hidden';
    sub.classList.add('js-dropdown-active');
    if (parentLi) {
      parentLi.classList.add('is-active');
    }
    // S13: the Box util reads plain elements.
    var clear = _foundation_util_box__WEBPACK_IMPORTED_MODULE_5__.Box.ImNotTouchingYou(sub, null, true);
    if (!clear) {
      var oldClass = this.options.alignment === 'left' ? '-right' : '-left';
      if (parentLi) {
        parentLi.classList.remove(`opens${oldClass}`);
        parentLi.classList.add(`opens-${this.options.alignment}`);
      }
      clear = _foundation_util_box__WEBPACK_IMPORTED_MODULE_5__.Box.ImNotTouchingYou(sub, null, true);
      if (!clear && parentLi) {
        parentLi.classList.remove(`opens-${this.options.alignment}`);
        parentLi.classList.add('opens-inner');
      }
      this.changed = true;
    }
    sub.style.visibility = '';
    if (this.options.closeOnClick) {
      this._addBodyHandler();
    }
    /**
     * Fires when the new dropdown pane is visible.
     * @event DropdownMenu#show
     */
    // S9: state production through the native event layer; the terminal
    // form forwards the plain element.
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'show.zf.dropdownMenu', [sub]);
  }

  /**
   * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
   * @function
   * @param {jQuery} $elem - element with a submenu to hide
   * @param {Number} idx - index of the $tabs collection to hide
   * @fires DropdownMenu#hide
   * @private
   */
  _hide(elem, idx) {
    // Accepts an element, a collection, a NodeList or an array.
    var toClose;
    if (elem) {
      toClose = elem.nodeType === 1 ? [elem] : Array.from(elem);
    } else if (typeof idx !== 'undefined') {
      toClose = this.$tabs.filter(function (tab, i) {
        return i !== idx;
      });
    } else {
      toClose = [this.$element];
    }
    var root = toClose[0];
    var somethingToClose = toClose.some(el => el.classList.contains('is-active')) || !!root.querySelector('.is-active');
    if (somethingToClose) {
      var activeItems = Array.from(root.querySelectorAll('li.is-active'));
      // S9: class/data state flips natively.
      toClose.concat(activeItems).forEach(el => {
        el.setAttribute('data-is-click', 'false');
        el.classList.remove('is-active');
      });
      toClose.forEach(closeRoot => {
        closeRoot.querySelectorAll('ul.js-dropdown-active').forEach(ul => {
          ul.classList.remove('js-dropdown-active');
        });
      });

      // the original find('opens-inner') was a selector typo in 6.x - it
      // never matched anything (class selectors need the dot); the changed
      // flag carried the real condition
      if (this.changed) {
        var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
        toClose.forEach(closeRoot => {
          closeRoot.querySelectorAll('li.is-dropdown-submenu-parent').concat(closeRoot.matches('li.is-dropdown-submenu-parent') ? [closeRoot] : []).forEach(el => {
            el.classList.remove('opens-inner', `opens-${this.options.alignment}`);
            el.classList.add(`opens-${oldClass}`);
          });
        });
        this.changed = false;
      }
      activeItems.forEach(el => {
        clearTimeout(el.zfMenuDelay);
      });
      if (root.zfMenuDelay) {
        clearTimeout(root.zfMenuDelay);
      }
      this._removeBodyHandler();

      /**
       * Fires when the open menus are closed.
       * @event DropdownMenu#hide
       */
      // S9: state production through the native event layer; the terminal
      // form forwards the element array.
      _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.trigger(this.$element, 'hide.zf.dropdownMenu', [toClose]);
    }
  }

  /**
   * Destroys the plugin.
   * @function
   */
  _destroy() {
    // The listeners by bare namespace, the state attributes and the
    // orientation classes reset.
    this.$menuItems.forEach(item => _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(item, '.zf.dropdownMenu'));
    this.$menuItems.forEach(item => {
      item.removeAttribute('data-is-click');
      item.classList.remove('is-right-arrow', 'is-left-arrow', 'is-down-arrow', 'opens-right', 'opens-left', 'opens-inner');
    });
    this._removeBodyHandler();
    _foundation_util_events__WEBPACK_IMPORTED_MODULE_2__.Events.off(document.body, '.zf.dropdownMenu');
    _foundation_util_nest__WEBPACK_IMPORTED_MODULE_4__.Nest.Burn(this.$element, 'dropdown');
  }
}

/**
 * Default settings for plugin
 */
DropdownMenu.defaults = {
  /**
   * Disallows hover events from opening submenus
   * @option
   * @type {boolean}
   * @default false
   */
  disableHover: false,
  /**
   * Disallows hover on touch devices
   * @option
   * @type {boolean}
   * @default true
   */
  disableHoverOnTouch: true,
  /**
   * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
   * @option
   * @type {boolean}
   * @default true
   */
  autoclose: true,
  /**
   * Amount of time to delay opening a submenu on hover event.
   * @option
   * @type {number}
   * @default 50
   */
  hoverDelay: 50,
  /**
   * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
   * @option
   * @type {boolean}
   * @default false
   */
  clickOpen: false,
  /**
   * Amount of time to delay closing a submenu on a mouseleave event.
   * @option
   * @type {number}
   * @default 500
   */

  closingTime: 500,
  /**
   * Position of the menu relative to what direction the submenus should open. Handled by JS. Can be `'auto'`, `'left'` or `'right'`.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow clicks on the body to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClick: true,
  /**
   * Allow clicks on leaf anchor links to close any open submenus.
   * @option
   * @type {boolean}
   * @default true
   */
  closeOnClickInside: true,
  /**
   * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'vertical'
   */
  verticalClass: 'vertical',
  /**
   * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
   * @option
   * @type {string}
   * @default 'align-right'
   */
  rightClass: 'align-right',
  /**
   * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
   * @option
   * @type {boolean}
   * @default true
   */
  forceFollow: true
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

/***/ "./foundation.util.nest":
/*!************************************************************************************************************************************************************************************!*\
  !*** external {"root":["__FOUNDATION_EXTERNAL__","foundation.util.nest"],"amd":"./foundation.util.nest","commonjs":"./foundation.util.nest","commonjs2":"./foundation.util.nest"} ***!
  \************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__foundation_util_nest__;

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
/*!*******************************************************!*\
  !*** ./js/entries/plugins/foundation.dropdownMenu.js ***!
  \*******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DropdownMenu: () => (/* reexport safe */ _foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_1__.DropdownMenu),
/* harmony export */   Foundation: () => (/* reexport safe */ _foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation)
/* harmony export */ });
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./foundation.core */ "./foundation.core");
/* harmony import */ var _foundation_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_foundation_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../foundation.dropdownMenu */ "./js/foundation.dropdownMenu.js");


_foundation_core__WEBPACK_IMPORTED_MODULE_0__.Foundation.plugin(_foundation_dropdownMenu__WEBPACK_IMPORTED_MODULE_1__.DropdownMenu, 'DropdownMenu');

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=foundation.dropdownMenu.js.map