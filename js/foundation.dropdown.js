import { Keyboard } from './foundation.util.keyboard';
import { GetYoDigits, ignoreMousedisappear } from './foundation.core.utils';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Positionable } from './foundation.positionable';

import { Triggers } from './foundation.util.triggers';
import { Touch } from './foundation.util.touch'

/**
 * Dropdown module.
 * @module foundation.dropdown
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.touch
 * @requires foundation.util.triggers
 */
class Dropdown extends Positionable {
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
    this.options = deepMerge({}, Dropdown.defaults, datasetOptions(this.$element), options);
    this.className = 'Dropdown'; // ie9 back compat

    // Touch and Triggers init are idempotent, just need to make sure they are initialized
    Touch.init();
    Triggers.init();

    this._init();

    Keyboard.register('Dropdown', {
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
    this.$anchors.forEach(function(anchor) {
      anchor.setAttribute('aria-controls', id);
      anchor.setAttribute('data-is-focus', 'false');
      anchor.setAttribute('data-yeti-box', id);
      anchor.setAttribute('aria-haspopup', 'true');
      anchor.setAttribute('aria-expanded', 'false');
    });

    this._setCurrentAnchor(this.$anchors[0]);

    if(this.options.parentClass){
      this.$parent = this.$element.closest('.' + this.options.parentClass);
    }else{
      this.$parent = null;
    }

    // Set [aria-labelledby] on the Dropdown if it is not set
    if (this.$element.getAttribute('aria-labelledby') === null) {
      // Get the anchor ID or create one
      if (this.$currentAnchor.getAttribute('id') === null) {
        this.$currentAnchor.setAttribute('id', GetYoDigits(6, 'dd-anchor'));
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
    if(position) {
      return position[0];
    } else {
      return 'bottom'
    }
  }

  _getDefaultAlignment() {
    // handle legacy float approach
    var horizontalPosition = /float-(\S+)/.exec(this.$currentAnchor.getAttribute('class'));
    if(horizontalPosition) {
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
        hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined'),
        element = this.$element;

    // S9: the four zf.trigger consumers flip to the native event layer -
    // open/toggle arrive as element-local dual dispatches and close as a
    // real bubbling event from the Triggers util (S4), resizeme as the
    // native resize broadcast.
    Events.on(element, 'open.zf.trigger', this.open.bind(this));
    Events.on(element, 'close.zf.trigger', this.close.bind(this));
    Events.on(element, 'toggle.zf.trigger', this.toggle.bind(this));
    Events.on(element, 'resizeme.zf.trigger', this._setPosition.bind(this));

    // S9: the anchor click consumer flips to the native event layer - real
    // clicks reach it directly, jQuery-synthesized clicks ride the `.click()`
    // native shortcut bridge (reveal-native precedent; jQuery suppresses
    // that shortcut for link anchors, so jQuery-synthesized clicks on `<a>`
    // anchors stay undelivered - a real click is the user contract).
    this.$anchors.forEach(anchor => {
      Events.off(anchor, 'click.zf.trigger');
      Events.on(anchor, 'click.zf.trigger', function(e) {
        _this._setCurrentAnchor(this);

        if (
          // if forceFollow false, always prevent default action
          (_this.options.forceFollow === false) ||
          // if forceFollow true and hover option true, only prevent default action on 1st click
          // on 2nd click (dropown opened) the default action (e.g. follow a href) gets executed
          (hasTouch && _this.options.hover && !_this.$element.classList.contains('is-open'))
        ) {
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
    if(this.options.hover){
      var hoverFilter = function(handler) {
        return function(e) {
          // mouseenter semantics: only when the pointer entered from
          // outside (or from nowhere, like a synthetic dispatch)
          if (e.relatedTarget && this.contains(e.relatedTarget)) { return; }
          handler.call(this, e);
        };
      };
      this.$anchors.forEach(anchor => {
        Events.off(anchor, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        Events.on(anchor, 'mouseover.zf.dropdown', hoverFilter(function(){
          _this._setCurrentAnchor(this);

          var whatInput = document.body.getAttribute('data-whatinput');
          if(whatInput === null || whatInput === 'mouse') {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function(){
              _this.open();
              // the 6.x hover flag rode jQuery's data cache (DOM-invisible);
              // the expando property keeps it invisible
              _this.$anchors[0].zfDropdownHover = true;
            }, _this.options.hoverDelay);
          }
        }));
        Events.on(anchor, 'mouseout.zf.dropdown', ignoreMousedisappear(function(){
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function(){
            _this.close();
            _this.$anchors[0].zfDropdownHover = false;
          }, _this.options.hoverDelay);
        }));
      });
      if(this.options.hoverPane){
        Events.off(this.$element, 'mouseover.zf.dropdown mouseout.zf.dropdown');
        Events.on(this.$element, 'mouseover.zf.dropdown', hoverFilter(function(){
          clearTimeout(_this.timeout);
        }));
        Events.on(this.$element, 'mouseout.zf.dropdown', ignoreMousedisappear(function(){
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function(){
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
      Events.off(bound, 'keydown.zf.dropdown');
      Events.on(bound, 'keydown.zf.dropdown', function(e) {
        var target = this;

        Keyboard.handleKey(e, 'Dropdown', {
          open: function() {
            if (_this.$anchors.indexOf(target) !== -1 && !target.matches('input, textarea')) {
              _this.open();
              _this.$element.setAttribute('tabindex', '-1');
              _this.$element.focus();
              e.preventDefault();
            }
          },
          close: function() {
            _this.close();
            // the collection .focus() focused the first anchor
            if (_this.$anchors[0]) { _this.$anchors[0].focus(); }
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
       if(_this.$anchors.indexOf(e.target) !== -1 || _this.$anchors.some(a => a.contains(e.target))) {
         return;
       }
       if(_this.$element === e.target || _this.$element.contains(e.target)) {
         return;
       }
       _this.close();
       _this._removeBodyHandler();
     };

     this._removeBodyHandler();
     // S13: the tap half flips with the Touch util - 'tap' is a real,
     // bubbling event on the touched element now, so this native body
     // listener hears it (real clicks arrived through this layer since S9).
     Events.on(body, 'click.zf.dropdown tap.zf.dropdown', bodyHandler);
  }

  /**
   * Removes the body click/tap handler added by `_addBodyHandler`.
   * @function
   * @private
   */
  _removeBodyHandler() {
    Events.off(document.body, 'click.zf.dropdown tap.zf.dropdown');
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
    Events.trigger(this.$element, 'closeme.zf.dropdown', [this.$element.getAttribute('id')]);

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

    if(this.options.autoFocus){
      const focusable = Keyboard.findFocusable(this.$element);
      if(focusable.length){
        focusable[0].focus();
      }
    }

    if(this.options.closeOnClick){ this._addBodyHandler(); }

    if (this.options.trapFocus) {
      Keyboard.trapFocus(this.$element);
    }

    /**
     * Fires once the dropdown is visible.
     * @event Dropdown#show
     */
    // S9: state production through the native event layer; the terminal
    // form forwards the plain element.
    Events.trigger(this.$element, 'show.zf.dropdown', [this.$element]);
  }

  /**
   * Closes the open dropdown pane.
   * @function
   * @fires Dropdown#hide
   */
  close() {
    if(!this.$element.classList.contains('is-open')){
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
    Events.trigger(this.$element, 'hide.zf.dropdown', [this.$element]);

    if (this.options.trapFocus) {
      Keyboard.releaseFocus(this.$element);
    }
  }

  /**
   * Toggles the dropdown pane's visibility.
   * @function
   */
  toggle() {
    if(this.$element.classList.contains('is-open')){
      if(this.$anchors[0] && this.$anchors[0].zfDropdownHover) return;
      this.close();
    }else{
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
    Events.off(this.$element, '.zf.trigger');
    this.$anchors.forEach(anchor => {
      Events.off(anchor, '.zf.dropdown');
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

export {Dropdown};
