import $ from 'jquery';
import { Motion } from './foundation.util.motion';
import { Plugin } from './foundation.core.plugin';
import { RegExpEscape } from './foundation.core.utils';
import { Triggers } from './foundation.util.triggers';
import { Events } from './foundation.util.events';
import { datasetOptions, visible } from './foundation.util.dom';

/**
 * Toggler module.
 * @module foundation.toggler
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.events
 * @requires foundation.util.dom
 */

class Toggler extends Plugin {
  /**
   * Creates a new instance of Toggler.
   * @class
   * @name Toggler
   * @fires Toggler#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.$element = element;
    this.options = $.extend({}, Toggler.defaults, datasetOptions(element[0]), options);
    this.className = '';
    this.className = 'Toggler'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init($);

    this._init();
    this._events();
  }

  /**
   * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
   * @function
   * @private
   */
  _init() {
    // Collect triggers to set ARIA attributes to
    var id = this.$element[0].id,
      triggers = document.querySelectorAll(`[data-open~="${id}"], [data-close~="${id}"], [data-toggle~="${id}"]`);

    var input;
    // Parse animation classes if they were set
    if (this.options.animate) {
      input = this.options.animate.split(' ');

      this.animationIn = input[0];
      this.animationOut = input[1] || null;

      // - aria-expanded: according to the element visibility.
      //   (was `!this.$element.is(':hidden')`; Dom's visible() carries the
      //   narrow display-based semantics decided for the 7.0 line, slice S1)
      this._setTriggersExpanded(triggers, visible(this.$element[0]));
    }
    // Otherwise, parse toggle class
    else {
      input = this.options.toggler;
      if (typeof input !== 'string' || !input.length) {
        throw new Error(`The 'toggler' option containing the target class is required, got "${input}"`);
      }
      // Allow for a . at the beginning of the string
      this.className = input[0] === '.' ? input.slice(1) : input;

      // - aria-expanded: according to the elements class set.
      this._setTriggersExpanded(triggers, this.$element[0].classList.contains(this.className));
    }

    // - aria-controls: adding the element id to it if not already in it.
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      var controls = trigger.getAttribute('aria-controls') || '';

      const containsId = new RegExp(`\\b${RegExpEscape(id)}\\b`).test(controls);
      if (!containsId) trigger.setAttribute('aria-controls', controls ? `${controls} ${id}` : id);
    }
  }

  /**
   * Writes aria-expanded on every trigger element.
   * @function
   * @private
   * @param {NodeList} triggers - the trigger elements to update.
   * @param {Boolean} isOn - whether the toggler element is in the "on" state.
   */
  _setTriggersExpanded(triggers, isOn) {
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].setAttribute('aria-expanded', isOn ? 'true' : 'false');
    }
  }

  /**
   * Initializes events for the toggle trigger.
   * @function
   * @private
   */
  _events() {
    // S4: both sides of the 'toggle.zf.trigger' seam are native now - the
    // Triggers util dispatches through the Events layer, so this consumer
    // listens there too. (jQuery-synthesized triggers no longer reach it:
    // a jQuery trigger() never produces a real DOM event.)
    Events.on(this.$element[0], 'toggle.zf.trigger', this.toggle.bind(this));
  }

  /**
   * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
   * @function
   * @fires Toggler#on
   * @fires Toggler#off
   */
  toggle() {
    this[ this.options.animate ? '_toggleAnimate' : '_toggleClass']();
  }

  _toggleClass() {
    var element = this.$element[0];
    element.classList.toggle(this.className);

    var isOn = element.classList.contains(this.className);
    if (isOn) {
      /**
       * Fires if the target element has the class after a toggle.
       * @event Toggler#on
       */
      Events.trigger(element, 'on.zf.toggler');
    }
    else {
      /**
       * Fires if the target element does not have the class after a toggle.
       * @event Toggler#off
       */
      Events.trigger(element, 'off.zf.toggler');
    }

    this._updateARIA(isOn);
    this._triggerMutate();
  }

  _toggleAnimate() {
    var _this = this,
      element = this.$element[0];

    // Mixed-state seam (7.0 line A, S3): Motion still runs on jQuery, so it
    // is fed the jQuery object and its callback still arrives with jQuery
    // conventions; only the events fired from the callback already go
    // through the native Events layer.
    if (!visible(element)) {
      Motion.animateIn(this.$element, this.animationIn, function() {
        _this._updateARIA(true);
        Events.trigger(element, 'on.zf.toggler');
        _this._triggerMutate();
      });
    }
    else {
      Motion.animateOut(this.$element, this.animationOut, function() {
        _this._updateARIA(false);
        Events.trigger(element, 'off.zf.toggler');
        _this._triggerMutate();
      });
    }
  }

  _updateARIA(isOn) {
    var id = this.$element[0].id;
    var triggers = document.querySelectorAll(`[data-open="${id}"], [data-close="${id}"], [data-toggle="${id}"]`);

    this._setTriggersExpanded(triggers, isOn);
  }

  /**
   * Fires mutateme.zf.trigger on every [data-mutate] descendant, so other
   * plugins can react to the toggled element changing.
   * @function
   * @private
   */
  _triggerMutate() {
    var mutated = this.$element[0].querySelectorAll('[data-mutate]');

    for (var i = 0; i < mutated.length; i++) {
      Events.trigger(mutated[i], 'mutateme.zf.trigger');
    }
  }

  /**
   * Destroys the instance of Toggler on the element.
   * @function
   */
  _destroy() {
    // jQuery side: legacy listeners in the plugin namespace, kept while the
    // mixed state lasts.
    this.$element.off('.zf.toggler');
    // Native side: the toggle.zf.trigger seam listener and every other
    // listener this plugin registered through the Events layer are dropped
    // by the bare-namespace form in one call.
    Events.off(this.$element[0], '.zf.toggler');
  }
}

Toggler.defaults = {
  /**
   * Class of the element to toggle. It can be provided with or without "."
   * @option
   * @type {string}
   */
  toggler: undefined,
  /**
   * Tells the plugin if the element should animated when toggled.
   * @option
   * @type {boolean}
   * @default false
   */
  animate: false
};

export {Toggler};
