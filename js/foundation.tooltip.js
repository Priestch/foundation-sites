import { GetYoDigits, ignoreMousedisappear } from './foundation.core.utils';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { MediaQuery } from './foundation.util.mediaQuery';
import { Touch } from './foundation.util.touch';
import { Triggers } from './foundation.util.triggers';
import { Positionable } from './foundation.positionable';

// jQuery's $(htmlString): parsed to the single root element.
function parseTemplate(html) {
  var probe = document.createElement('template');
  probe.innerHTML = html.trim();
  return probe.content.firstElementChild;
}
import { Motion } from './foundation.util.motion';

/**
 * Tooltip module.
 * @module foundation.tooltip
 * @requires foundation.util.box
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.triggers
 */

class Tooltip extends Positionable {
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
    this.options = deepMerge({}, Tooltip.defaults, datasetOptions(this.$element), options);
    this.className = 'Tooltip'; // ie9 back compat

    this.isActive = false;
    this.isClick = false;

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init($);

    this._init();
  }

  /**
   * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
   * @private
   */
  _init() {
    MediaQuery._init();
    var elemId = this.$element.getAttribute('aria-describedby') || GetYoDigits(6, 'tooltip');

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
    if(this.position === 'left' || this.position === 'right') {
      return this.options.hOffset + this.options.tooltipWidth;
    } else {
      return this.options.hOffset
    }
  }

  _getVOffset() {
    if(this.position === 'top' || this.position === 'bottom') {
      return this.options.vOffset + this.options.tooltipHeight;
    } else {
      return this.options.vOffset
    }
  }

  /**
   * builds the tooltip element, adds attributes, and returns the template.
   * The element is created natively (7.0 line A, S8); the terminal form
   * returns the element (the mixed state returned a jQuery collection).
   * @private
   */
  _buildTemplate(id) {
    var templateClasses = (`${this.options.tooltipClass} ${this.options.templateClasses}`).trim();
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
    if (this.options.showOn !== 'all' && !MediaQuery.is(this.options.showOn)) {
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
    Events.trigger(this.$element, 'closeme.zf.tooltip', [this.template.id]);


    // State/ARIA go through the native layer (7.0 line A, S8).
    this.template.setAttribute('data-is-active', 'true');
    this.template.setAttribute('aria-hidden', 'false');
    _this.isActive = true;
    // fx 方案 A: the fade tween runs on Motion's native primitive (the
    // stop-in-place, the hide reset and the visibility clear keep the 6.x
    // ordering).
    const templateEl = this.template;
    Motion.stop(templateEl);
    templateEl.style.display = 'none';
    templateEl.style.visibility = '';
    Motion.fadeIn(templateEl, this.options.fadeInDuration, function() {
      //maybe do stuff?
    });
    /**
     * Fires when the tooltip is shown
     * @event Tooltip#show
     */
    Events.trigger(this.$element, 'show.zf.tooltip');
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
    Motion.stop(this.template);
    Motion.fadeOut(this.template, this.options.fadeOutDuration, function() {
      _this.isActive = false;
      _this.isClick = false;
    });
    /**
     * fires when the tooltip is hidden
     * @event Tooltip#hide
     */
    Events.trigger(this.$element, 'hide.zf.tooltip');
  }

  /**
   * adds event listeners for the tooltip and its anchor
   * TODO combine some of the listeners like focus and mouseenter, etc.
   * @private
   */
  _events() {
    const _this = this;
    const element = this.$element;
    const hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined');
    var isFocus = false;

    // `disableForTouch: Fully disable the tooltip on touch devices
    if (hasTouch && this.options.disableForTouch) return;

    if (!this.options.disableHover) {
      // S8: hover/focus/click consumers flip to the native event layer -
      // mouseenter/mouseleave/mousedown/focus/focusout are real DOM events
      // and reach these listeners directly (still-on-jQuery synthetic
      // producers like `$(el).trigger('mouseenter')` do not, by design).
      Events.on(element, 'mouseenter.zf.tooltip', function() {
        if (!_this.isActive) {
          _this.timeout = setTimeout(function() {
            _this.show();
          }, _this.options.hoverDelay);
        }
      });
      Events.on(element, 'mouseleave.zf.tooltip', ignoreMousedisappear(function() {
        clearTimeout(_this.timeout);
        if (!isFocus || (_this.isClick && !_this.options.clickOpen)) {
          _this.hide();
        }
      }));
    }

    if (hasTouch) {
      // S13: the tap/touchend consumer flips with the Touch util - 'tap' is
      // a real, bubbling event on the touched element now. The anchor itself
      // has no tap listener outside this binding, so arming the document
      // touch chain (Touch.init, idempotent) covers it.
      Touch.init();
      Events.on(element, 'tap.zf.tooltip touchend.zf.tooltip', function () {
        _this.isActive ? _this.hide() : _this.show();
      });
    }

    if (this.options.clickOpen) {
      Events.on(element, 'mousedown.zf.tooltip', function() {
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
      Events.on(element, 'mousedown.zf.tooltip', function() {
        _this.isClick = true;
      });
    }

    // S8: the close consumer flips to the native event layer - both
    // producers there (the [data-close] delegation and the closeme
    // broadcast) have dispatched real bubbling events since S4.
    Events.on(element, 'close.zf.trigger', this.hide.bind(this));

    Events.on(element, 'focus.zf.tooltip', function() {
      isFocus = true;
      if (_this.isClick) {
        // If we're not showing open on clicks, we need to pretend a click-launched focus isn't
        // a real focus, otherwise on hover and come back we get bad behavior
        if(!_this.options.clickOpen) { isFocus = false; }
        return false;
      } else {
        _this.show();
      }
    });

    Events.on(element, 'focusout.zf.tooltip', function() {
      isFocus = false;
      _this.isClick = false;
      _this.hide();
    });

    // S8: the resizeme consumer flips to the native event layer (S4
    // producer).
    Events.on(element, 'resizeme.zf.trigger', function() {
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
    ['aria-describedby', 'data-disable-hover', 'data-resize', 'data-toggle', 'data-tooltip', 'data-yeti-box'].forEach(function(name) {
      this.$element.removeAttribute(name);
    }, this);

    // The flipped hover/focus/click/close/resizeme listeners.
    Events.off(this.$element, '.zf.trigger .zf.tooltip');

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

export {Tooltip};
