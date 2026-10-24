import { Plugin } from './foundation.core.plugin';
import { onLoad, GetYoDigits } from './foundation.core.utils';
import { Events } from './foundation.util.events';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { SmoothScroll } from './foundation.smoothScroll';

import { Triggers } from './foundation.util.triggers';

/**
 * Magellan module.
 * @module foundation.magellan
 * @requires foundation.smoothScroll
 * @requires foundation.util.triggers
 */

class Magellan extends Plugin {
  /**
   * Creates a new instance of Magellan.
   * @class
   * @name Magellan
   * @fires Magellan#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options  = deepMerge({}, Magellan.defaults, datasetOptions(this.$element), options);
    this.className = 'Magellan'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
    this.calcPoints();
  }

  /**
   * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  _init() {
    var element = this.$element;
    var id = element.id || GetYoDigits(6, 'magellan');
    this.id = id;
    this.targets = Array.from(document.querySelectorAll('[data-magellan-target]'));
    this.links = Array.from(element.querySelectorAll('a'));
    element.setAttribute('data-resize', id);
    element.setAttribute('data-scroll', id);
    element.id = id;
    this.active = [];
    this.scrollPos = parseInt(window.pageYOffset, 10);

    this._events();
  }

  /**
   * Calculates an array of pixel values that are the demarcation lines between locations on the page.
   * Can be invoked if new elements are added or the size of a location changes.
   * @function
   */
  calcPoints() {
    var _this = this,
        body = document.body,
        html = document.documentElement;

    this.points = [];
    this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
    this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

    this.targets.forEach(function(tar){
      // jQuery offset(): the document-coordinates top (rect + page scroll)
      var pt = Math.round(tar.getBoundingClientRect().top + window.pageYOffset - _this.options.threshold);
      tar.targetPoint = pt;
      _this.points.push(pt);
    });
  }

  /**
   * Initializes events for Magellan.
   * @private
   */
  _events() {
    var _this = this;

    _this.onLoadListener = onLoad(window, function () {
      // A load callback can land after destroy() nulled the instance state
      // (the same post-destroy window the S6 slider guards cover; jQuery's
      // $(null) tolerance hid this in 6.x).
      if (!_this.$element) { return; }

      if(_this.options.deepLinking){
        if(location.hash){
          _this.scrollToLoc(location.hash);
        }
      }
      _this.calcPoints();
      _this._updateActive();
      // S7: the resizeme/scrollme consumers flip to the native event layer.
      // Both producers in the Triggers util have dispatched real element-
      // local events since S4, so this seam closes on the consumer half
      // alone; the delegated link clicks join them on the same layer.
      Events.on(_this.$element, 'resizeme.zf.trigger', _this.reflow.bind(_this));
      Events.on(_this.$element, 'scrollme.zf.trigger', _this._updateActive.bind(_this));
      Events.delegate(_this.$element, 'click.zf.magellan', 'a[href^="#"]', function (e) {
        e.preventDefault();
        _this.scrollToLoc(this.getAttribute('href'));
      });
    });

    this._deepLinkScroll = function() {
      if(_this.options.deepLinking) {
        _this.scrollToLoc(window.location.hash);
      }
    };

    // S7: the deep-link hashchange moves to the native event layer under the
    // per-instance namespace shape introduced for Reveal's hashchange, so
    // the destroy path can drop it precisely. Real hashchange events are
    // unaffected by the namespace.
    Events.on(window, `hashchange.zf.magellan:${this.id}`, this._deepLinkScroll);
  }

  /**
   * Function to scroll to a given location on the page.
   * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
   * @function
   */
  scrollToLoc(loc) {
    this._inTransition = true;
    var _this = this;

    var options = {
      animationEasing: this.options.animationEasing,
      animationDuration: this.options.animationDuration,
      threshold: this.options.threshold,
      offset: this.options.offset
    };

    SmoothScroll.scrollToLoc(loc, options, function() {
      _this._inTransition = false;
    })
  }

  /**
   * Calls necessary functions to update Magellan upon DOM change
   * @function
   */
  reflow() {
    this.calcPoints();
    this._updateActive();
  }

  /**
   * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
   * @private
   * @function
   * @fires Magellan#update
   */
  _updateActive(/*event, elem, scrollPos*/) {
    if(this._inTransition) return;

    const newScrollPos = parseInt(window.pageYOffset, 10);
    const isScrollingUp = this.scrollPos > newScrollPos;
    this.scrollPos = newScrollPos;

    let activeIdx;
    // Before the first point: no link
    if(newScrollPos < this.points[0] - this.options.offset - (isScrollingUp ? this.options.threshold : 0)){ /* do nothing */ }
    // At the bottom of the page: last link
    else if(newScrollPos + this.winHeight === this.docHeight){ activeIdx = this.points.length - 1; }
    // Otherwhise, use the last visible link
    else{
      const visibleLinks = this.points.filter((p) => {
        return (p - this.options.offset - (isScrollingUp ? this.options.threshold : 0)) <= newScrollPos;
      });
      activeIdx = visibleLinks.length ? visibleLinks.length - 1 : 0;
    }

    // Get the new active link
    const oldActive = this.active;
    let activeHash = '';
    if(typeof activeIdx !== 'undefined'){
      // 6.x filtered $links by [href="#<target>"]; the data read is the raw
      // attribute (jQuery's .data would convert numbers, the attribute
      // values here are ids)
      const targetName = this.targets[activeIdx] ? this.targets[activeIdx].getAttribute('data-magellan-target') : null;
      this.active = targetName === null ? [] : this.links.filter(function(link) {
        return link.getAttribute('href') === '#' + targetName;
      });
      if (this.active.length) activeHash = this.active[0].getAttribute('href');
    }else{
      this.active = [];
    }
    // jQuery's .is() between collections: any overlap counts as same
    const overlaps = this.active.some(function(el) { return oldActive.indexOf(el) !== -1; });
    const isNewActive = !(!this.active.length && !oldActive.length) && !overlaps;
    const isNewHash = activeHash !== window.location.hash;

    // Update the active link element (native classList, 7.0 line A S7)
    if(isNewActive) {
      oldActive.forEach(function(el) { el.classList.remove(this.options.activeClass); }, this);
      this.active.forEach(function(el) { el.classList.add(this.options.activeClass); }, this);
    }

    // Update the hash (it may have changed with the same active link)
    if(this.options.deepLinking && isNewHash){
      if(window.history.pushState){
        // Set or remove the hash (see: https://stackoverflow.com/a/5298684/4317384
        const url = activeHash ? activeHash : window.location.pathname + window.location.search;
        if(this.options.updateHistory){
          window.history.pushState({}, '', url);
        }else{
          window.history.replaceState({}, '', url);
        }
      }else{
        window.location.hash = activeHash;
      }
    }

    if (isNewActive) {
      /**
       * Fires when magellan is finished updating to the new active element.
       * @event Magellan#update
       */
      // S7: real, bubbling CustomEvent - native listeners receive it
      // directly, still-on-jQuery listeners through the real-event pass-
      // through (the forwarded $active rides in event.originalEvent.detail
      // for them).
      // 7.0 terminal form: the forwarded active links are the native
      // element array (6.x forwarded the jQuery collection).
      Events.trigger(this.$element, 'update.zf.magellan', [this.active]);
	  }
  }

  /**
   * Destroys an instance of Magellan and resets the url of the window.
   * @function
   */
  _destroy() {
    // The bare-namespace forms drop the resizeme/scrollme and delegated
    // click listeners in one pass each, and the deep-link hashchange goes
    // with its per-instance namespace.
    Events.off(this.$element, '.zf.trigger .zf.magellan');
    Events.off(window, `hashchange.zf.magellan:${this.id}`);
    if (this.onLoadListener) Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
    // Reset the active link classes (the 6.x destroy cleanup).
    this.$element.querySelectorAll(`.${this.options.activeClass}`).forEach(function(el) {
      el.classList.remove(this.options.activeClass);
    }, this);
  }
}

/**
 * Default settings for plugin
 */
Magellan.defaults = {
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
   * Class applied to the active locations link on the magellan container.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  activeClass: 'is-active',
  /**
   * Allows the script to manipulate the url of the current page, and if supported, alter the history.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinking: false,
  /**
   * Update the browser history with the active link, if deep linking is enabled.
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false,
  /**
   * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
   * @option
   * @type {number}
   * @default 0
   */
  offset: 0
}

export {Magellan};
