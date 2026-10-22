import $ from 'jquery';

import { MediaQuery } from './foundation.util.mediaQuery';
import { Motion } from './foundation.util.motion';
import { Plugin } from './foundation.core.plugin';
import { Events } from './foundation.util.events';
import { datasetOptions, visible } from './foundation.util.dom';

/**
 * ResponsiveToggle module.
 * @module foundation.responsiveToggle
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.motion
 */

class ResponsiveToggle extends Plugin {
  /**
   * Creates a new instance of Tab Bar.
   * @class
   * @name ResponsiveToggle
   * @fires ResponsiveToggle#init
   * @param {jQuery} element - jQuery object to attach tab bar functionality to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, ResponsiveToggle.defaults, datasetOptions(element[0]), options);
    this.className = 'ResponsiveToggle'; // ie9 back compat

    this._init();
    this._events();
  }

  /**
   * Initializes the tab bar by finding the target element, toggling element, and running update().
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();
    var targetID = this.options.responsiveToggle;
    if (!targetID) {
      console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
    }

    this.$targetMenu = $(document.getElementById(targetID));
    this.$toggler = this.$element.find('[data-toggle]').filter(function() {
      var target = datasetOptions(this).toggle;
      return (target === targetID || target === "");
    });
    this.options = $.extend({}, this.options, datasetOptions(this.$targetMenu[0]));

    // If they were set, parse the animation classes
    if(this.options.animate) {
      let input = this.options.animate.split(' ');

      this.animationIn = input[0];
      this.animationOut = input[1] || null;
    }

    this._update();
  }

  /**
   * Adds necessary event handlers for the tab bar to work.
   * @function
   * @private
   */
  _events() {
    // Seam (S7): 'changed.zf.mediaquery' is synthesized through jQuery by
    // the MediaQuery watcher - mediaQuery is not migrated yet and a jQuery
    // trigger() cannot produce a real event - so this consumer stays on the
    // jQuery side until the MediaQuery slice flips both sides in one move.
    this._updateMqHandler = this._update.bind(this);
    $(window).on('changed.zf.mediaquery', this._updateMqHandler);

    // The toggler clicks are real browser events: they register on the
    // native event layer, on every element of the filtered collection like
    // jQuery's collection-wide .on() did.
    this._toggleMenuHandler = this.toggleMenu.bind(this);
    this.$toggler.toArray().forEach(el => {
      Events.on(el, 'click.zf.responsiveToggle', this._toggleMenuHandler);
    });
  }

  /**
   * Native stand-in for jQuery's `.show()`: clears an inline display
   * override and, when the stylesheet still hides the element, falls back to
   * the default display of a block element - what jQuery's
   * getDefaultDisplay resolved to for everything this plugin shows (the
   * `.title-bar` markup carries its own `display: flex`, so the fallback is
   * only reached for stylesheet-hidden menus).
   * @function
   * @private
   */
  _show(element) {
    if (!element) { return; }
    element.style.display = '';
    if (window.getComputedStyle(element).display === 'none') {
      element.style.display = 'block';
    }
  }

  /**
   * Native stand-in for jQuery's `.hide()`: an inline `display: none`.
   * @function
   * @private
   */
  _hide(element) {
    if (!element) { return; }
    element.style.display = 'none';
  }

  /**
   * Checks the current media query to determine if the tab bar should be visible or hidden.
   * @function
   * @private
   */
  _update() {
    var element = this.$element[0];
    var targetMenu = this.$targetMenu[0];

    // Mobile
    if (!MediaQuery.atLeast(this.options.hideFor)) {
      this._show(element);
      this._hide(targetMenu);
    }

    // Desktop
    else {
      this._hide(element);
      this._show(targetMenu);
    }
  }

  /**
   * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
   * @function
   * @fires ResponsiveToggle#toggled
   */
  toggleMenu() {
    if (!MediaQuery.atLeast(this.options.hideFor)) {
      var targetMenu = this.$targetMenu[0];

      /**
       * Fires when the element attached to the tab bar toggles.
       * @event ResponsiveToggle#toggled
       */
      if(this.options.animate) {
        // `:hidden` replacement: Dom's visible() carries the narrow
        // display-based semantics decided for the 7.0 line (S3). An empty
        // target counts as shown, like jQuery's `.is(':hidden')` did.
        var menuHidden = targetMenu ? !visible(targetMenu) : false;

        if (menuHidden) {
          Motion.animateIn(this.$targetMenu, this.animationIn, () => {
            Events.trigger(this.$element[0], 'toggled.zf.responsiveToggle');
            // Seam (S7): the animated half of the mutateme forwarding stays
            // on jQuery's element-local triggerHandler - the mutateme
            // consumers (Equalizer, Drilldown, Sticky) are still on jQuery
            // and an element-local dispatch has no native-to-jQuery bridge.
            // It flips together with them in their slice.
            this.$targetMenu.find('[data-mutate]').triggerHandler('mutateme.zf.trigger');
          });
        }
        else {
          Motion.animateOut(this.$targetMenu, this.animationOut, () => {
            Events.trigger(this.$element[0], 'toggled.zf.responsiveToggle');
          });
        }
      }
      else {
        // The 6.x `.toggle(0)` display flip, without the legacy fx tween
        // (a size/opacity "grow" that completed asynchronously; the display
        // and event contracts never depended on it - same ruling as the S6
        // Reveal showDelay tween). The synchronous order below is kept:
        // display flip, mutateme, toggled.
        if (targetMenu) {
          if (visible(targetMenu)) {
            this._hide(targetMenu);
          }
          else {
            this._show(targetMenu);
          }

          var mutated = targetMenu.querySelectorAll('[data-mutate]');
          for (var i = 0; i < mutated.length; i++) {
            // Bubbling production on the native event layer; the still-on-
            // jQuery consumers receive the real event pass-through.
            Events.trigger(mutated[i], 'mutateme.zf.trigger');
          }
        }

        Events.trigger(this.$element[0], 'toggled.zf.responsiveToggle');
      }
    }
  };

  _destroy() {
    // jQuery side: the mediaquery seam and any legacy listeners in the
    // plugin namespace, kept while the mixed state lasts.
    this.$element.off('.zf.responsiveToggle');
    this.$toggler.off('.zf.responsiveToggle');
    $(window).off('changed.zf.mediaquery', this._updateMqHandler);

    // Native side: the toggler click listeners, by bare namespace.
    this.$toggler.toArray().forEach(el => {
      Events.off(el, '.zf.responsiveToggle');
    });
  }
}

ResponsiveToggle.defaults = {
  /**
   * The breakpoint after which the menu is always shown, and the tab bar is hidden.
   * @option
   * @type {string}
   * @default 'medium'
   */
  hideFor: 'medium',

  /**
   * To decide if the toggle should be animated or not.
   * @option
   * @type {boolean}
   * @default false
   */
  animate: false
};

export { ResponsiveToggle };
