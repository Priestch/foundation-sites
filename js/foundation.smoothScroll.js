import $ from 'jquery';
import { GetYoDigits } from './foundation.core.utils';
import { Events } from './foundation.util.events';
import { datasetOptions } from './foundation.util.dom';
import { Plugin } from './foundation.core.plugin';

/**
 * SmoothScroll module.
 * @module foundation.smoothScroll
 */

// The page-scroll tween (7.0 line A, S7): replaces the former
// `$('html, body').stop(true).animate({scrollTop}, …)`. It keeps the Move
// shape of the S5 Motion util - duration 0 completes synchronously, longer
// durations advance through requestAnimationFrame - and reproduces the two
// observable jQuery behaviors: only one page animation runs at a time
// (starting a new one stops the previous where it stands, the net effect of
// the `stop(true)` queue clear; 6.x animated both html and body because old
// engines split root scrolling, the baseline browsers scroll the viewport
// only), and unknown easing names fall back to jQuery's `_default` swing.
// 6.x fired no event from this path (the callback is the completion
// contract, delivered once per scroll where jQuery delivered it once per
// animated element), so none is added.
let activeScroll = null;

function stopActiveScroll() {
  if (activeScroll !== null) {
    window.cancelAnimationFrame(activeScroll);
    activeScroll = null;
  }
}

function resolveEasing(easing) {
  if (typeof easing === 'function') { return easing; }
  if (easing === 'linear') { return (p) => p; }
  // jQuery's `_default` easing: unknown names animate as 'swing'
  return (p) => 0.5 - Math.cos(p * Math.PI) / 2;
}

function animateScroll(scrollPos, options, callback) {
  const start = window.pageYOffset;
  const delta = scrollPos - start;
  const duration = options.animationDuration;
  const easing = resolveEasing(options.animationEasing);

  stopActiveScroll();

  if (duration === 0) {
    window.scrollTo(0, scrollPos);
    if (typeof callback === 'function') { callback(); }
    return;
  }

  let origin = null;
  function step(ts) {
    if (origin === null) { origin = ts; }
    const progress = Math.min((ts - origin) / duration, 1);
    window.scrollTo(0, Math.round(start + delta * easing(progress)));
    if (progress < 1) {
      activeScroll = window.requestAnimationFrame(step);
    } else {
      activeScroll = null;
      if (typeof callback === 'function') { callback(); }
    }
  }
  activeScroll = window.requestAnimationFrame(step);
}

class SmoothScroll extends Plugin {
  /**
   * Creates a new instance of SmoothScroll.
   * @class
   * @name SmoothScroll
   * @fires SmoothScroll#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
    _setup(element, options) {
        this.$element = element;
        this.options = $.extend({}, SmoothScroll.defaults, datasetOptions(element[0]), options);
        this.className = 'SmoothScroll'; // ie9 back compat

        this._init();
    }

    /**
     * Initialize the SmoothScroll plugin
     * @private
     */
    _init() {
        const element = this.$element[0];
        const id = element.id || GetYoDigits(6, 'smooth-scroll');
        element.id = id;

        this._events();
    }

    /**
     * Initializes events for SmoothScroll.
     * @private
     */
    _events() {
        // S7: both registrations move to the native event layer. The direct
        // binding keeps the 6.x shape where a click landing on the container
        // itself reaches the handler and is filtered by the anchor check; the
        // delegated binding mirrors the jQuery delegate walk (closest match,
        // never escaping the root) and hands the match to the handler, since
        // a real event's currentTarget stays the listener element.
        const element = this.$element[0];
        const _this = this;
        this._linkClickListener = function(e) {
            _this._handleLinkClick(e, e.currentTarget);
        };
        this._delegatedClickListener = function(e) {
            _this._handleLinkClick(e, this);
        };
        Events.on(element, 'click.zf.smoothScroll', this._linkClickListener);
        Events.delegate(element, 'click.zf.smoothScroll', 'a[href^="#"]', this._delegatedClickListener);
    }

    /**
     * Handle the given event to smoothly scroll to the anchor pointed by the event target.
     * @param {*} e - event
     * @param {*} link - the element the event landed on: the container for the
     *   direct binding, the closest 'a[href^="#"]' for the delegated one.
     * @function
     * @private
     */
    _handleLinkClick(e, link) {
        // Follow the link if it does not point to an anchor.
        if (!link || !link.matches('a[href^="#"]')) return;

        const arrival = link.getAttribute('href');

        this._inTransition = true;

        SmoothScroll.scrollToLoc(arrival, this.options, () => {
            this._inTransition = false;
        });

        e.preventDefault();
    };

    /**
     * Function to scroll to a given location on the page.
     * @param {String} loc - A properly formatted jQuery id selector. Example: '#foo'
     * @param {Object} options - The options to use.
     * @param {Function} callback - The callback function.
     * @static
     * @function
     */
    static scrollToLoc(loc, options = SmoothScroll.defaults, callback) {
        const target = document.querySelector(loc);

        // Do nothing if target does not exist to prevent errors
        if (!target) return false;

        var scrollPos = Math.round(target.getBoundingClientRect().top + window.pageYOffset - options.threshold / 2 - options.offset);

        animateScroll(scrollPos, options, callback);
    }

    /**
     * Destroys the SmoothScroll instance.
     * @function
     */
    _destroy() {
        // jQuery side: legacy listeners in the plugin namespace, kept while
        // the mixed state lasts.
        this.$element.off('.zf.smoothScroll');
        // Native side: the direct and delegated click listeners share the
        // zf.smoothScroll namespace and go in one bare-namespace call.
        Events.off(this.$element[0], '.zf.smoothScroll');
    }
}

/**
 * Default settings for plugin.
 */
SmoothScroll.defaults = {
  /**
   * Amount of time, in ms, the animated scrolling should take between locations.
   * @option
   * @type {number}
   * @default 500
   */
  animationDuration: 500,
  /**
   * Animation style to use when scrolling between locations. Can be `'swing'` or `'linear'`.
   * @option
   * @type {string}
   * @default 'linear'
   * @see {@link https://api.jquery.com/animate|Jquery animate}
   */
  animationEasing: 'linear',
  /**
   * Number of pixels to use as a marker for location changes.
   * @option
   * @type {number}
   * @default 50
   */
  threshold: 50,
  /**
   * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
   * @option
   * @type {number}
   * @default 0
   */
  offset: 0
}

export {SmoothScroll}
