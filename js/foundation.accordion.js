import $ from 'jquery';
import { Plugin } from './foundation.core.plugin';
import { onLoad, GetYoDigits } from './foundation.core.utils';
import { datasetOptions } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Keyboard } from './foundation.util.keyboard';
import { Motion } from './foundation.util.motion';

/**
 * Accordion module.
 * @module foundation.accordion
 * @requires foundation.util.keyboard
 */

class Accordion extends Plugin {
  /**
   * Creates a new instance of an accordion.
   * @class
   * @name Accordion
   * @fires Accordion#init
   * @param {jQuery} element - jQuery object to make into an accordion.
   * @param {Object} options - a plain object with settings to override the default options.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? $(element) : element;
    this.options = $.extend({}, Accordion.defaults, datasetOptions(this.$element[0]), options);

    this.className = 'Accordion'; // ie9 back compat
    this._init();

    Keyboard.register('Accordion', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_DOWN': 'next',
      'ARROW_UP': 'previous',
      'HOME': 'first',
      'END': 'last',
    });
  }

  /**
   * Initializes the accordion by animating the preset active pane(s).
   * @private
   */
  _init() {
    this._isInitializing = true;
    // Per-instance id for the native deep-link hashchange namespace (7.0 line
    // A, S8) - the same shape Reveal/Magellan/Tabs use.
    this.id = this.$element[0].id || GetYoDigits(6, 'accordion');

    this.$tabs = this.$element.children('[data-accordion-item]');


    this.$tabs.each(function(idx, el) {
      var $el = $(el),
          $content = $el.children('[data-tab-content]'),
          id = $content[0].id || GetYoDigits(6, 'accordion'),
          linkId = (el.id) ? `${el.id}-label` : `${id}-label`;

      // State/ARIA go through the native layer (7.0 line A, S8).
      var link = $el.find('a:first')[0];
      link.setAttribute('aria-controls', id);
      link.setAttribute('id', linkId);
      link.setAttribute('aria-expanded', 'false');

      var content = $content[0];
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', linkId);
      content.setAttribute('aria-hidden', 'true');
      content.setAttribute('id', id);
    });

    var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
    if ($initActive.length) {
      // Save up the initial hash to return to it later when going back in history
      this._initialAnchor = $initActive.prev('a').attr('href');
      this._openSingleTab($initActive);
    }

    this._checkDeepLink = () => {
      var anchor = window.location.hash;

      if (!anchor.length) {
        // If we are still initializing and there is no anchor, then there is nothing to do
        if (this._isInitializing) return;
        // Otherwise, move to the initial anchor
        if (this._initialAnchor) anchor = this._initialAnchor;
      }

      var $anchor = anchor && $(anchor);
      var $link = anchor && this.$element.find(`[href$="${anchor}"]`);
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!($anchor.length && $link.length);

      if (isOwnAnchor) {
        // If there is an anchor for the hash, open it (if not already active)
        if ($anchor && $link && $link.length) {
          if (!$link.parent('[data-accordion-item]').hasClass('is-active')) {
            this._openSingleTab($anchor);
          }
        }
        // Otherwise, close everything
        else {
          this._closeAllTabs();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          onLoad($(window), () => {
            // A load callback can land after destroy() nulled the instance
            // state (the S6 slider guard pattern).
            if (!this.$element) { return; }
            var offset = this.$element.offset();
            // fx 方案 A: the native page-scroll tween (SmoothScroll S7
            // equivalence - one viewport tween, callback once per ledger ②)
            Motion.animate(document.documentElement, { scrollTop: offset.top - this.options.deepLinkSmudgeOffset }, this.options.deepLinkSmudgeDelay);
          });
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Accordion#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        Events.trigger(this.$element[0], 'deeplink.zf.accordion', [$link, $anchor]);
      }
    }

    //use browser to open a tab, if it exists in this tabset
    if (this.options.deepLink) {
      this._checkDeepLink();
    }

    this._events();

    this._isInitializing = false;
  }

  /**
   * Adds event handlers for items within the accordion.
   * @private
   */
  _events() {
    var _this = this;

    this.$tabs.each(function() {
      var $elem = $(this);
      var $tabContent = $elem.children('[data-tab-content]');
      if ($tabContent.length) {
        $elem.children('a').each(function() {
          // S8: the click consumer flips to the native event layer - its only
          // producer inside the library is the keyboard forwarding right
          // below, which flips in the same commit to the same layer. Real
          // user clicks reach it directly.
          Events.off(this, 'click.zf.accordion');
          Events.on(this, 'click.zf.accordion', function(e) {
            e.preventDefault();
            _this.toggle($tabContent);
          });

          // Seam (S8): the keydown binding stays on jQuery. The coarse
          // keyboard suite feeds jQuery-synthesized mock keydowns, which can
          // never reach native listeners; real keydowns keep arriving through
          // jQuery's pass-through. This half flips when its synthetic
          // producers do (Keyboard test migration).
          $(this).off('keydown.zf.accordion').on('keydown.zf.accordion', function(e) {
            Keyboard.handleKey(e, 'Accordion', {
              toggle: function() {
                _this.toggle($tabContent);
              },
              next: function() {
                var $a = $elem.next().find('a').focus();
                if (!_this.options.multiExpand) {
                  Events.trigger($a[0], 'click.zf.accordion');
                }
              },
              previous: function() {
                var $a = $elem.prev().find('a').focus();
                if (!_this.options.multiExpand) {
                  Events.trigger($a[0], 'click.zf.accordion');
                }
              },
              first: function() {
                var $a = _this.$tabs.first().find('.accordion-title').focus();
                if (!_this.options.multiExpand) {
                   Events.trigger($a[0], 'click.zf.accordion');
                }
              },
              last: function() {
                var $a = _this.$tabs.last().find('.accordion-title').focus();
                if (!_this.options.multiExpand) {
                   Events.trigger($a[0], 'click.zf.accordion');
                }
              },
              handled: function() {
                e.preventDefault();
              }
            });
          });
        });
      }
    });
    if (this.options.deepLink) {
      // S8: the deep-link hashchange moves to the native event layer under
      // the per-instance namespace shape introduced for Reveal's hashchange,
      // so the destroy path can drop it precisely. Real hashchange events are
      // unaffected by the namespace.
      Events.on(window, `hashchange.zf.accordion:${this.id}`, this._checkDeepLink);
    }
  }

  /**
   * Toggles the selected content pane's open/close state.
   * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
   * @function
   */
  toggle($target) {
    // Mixed state (S16 suites): accept the native element the fixtures carry.
    $target = $target.nodeType === 1 ? $($target) : $target;
    if ($target.closest('[data-accordion]').is('[disabled]')) {
      console.info('Cannot toggle an accordion that is disabled.');
      return;
    }
    if ($target.parent()[0].classList.contains('is-active')) {
      this.up($target);
    } else {
      this.down($target);
    }
    //either replace or update browser history
    if (this.options.deepLink) {
      var anchor = $target.prev('a').attr('href');

      if (this.options.updateHistory) {
        history.pushState({}, '', anchor);
      } else {
        history.replaceState({}, '', anchor);
      }
    }
  }

  /**
   * Opens the accordion tab defined by `$target`.
   * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   */
  down($target) {
    $target = $target.nodeType === 1 ? $($target) : $target;
    if ($target.closest('[data-accordion]').is('[disabled]'))  {
      console.info('Cannot call down on an accordion that is disabled.');
      return;
    }

    if (this.options.multiExpand)
      this._openTab($target);
    else
      this._openSingleTab($target);
  }

  /**
   * Closes the tab defined by `$target`.
   * It may be ignored if the Accordion options don't allow it.
   *
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   */
  up($target) {
    $target = $target.nodeType === 1 ? $($target) : $target;
    if (this.$element.is('[disabled]')) {
      console.info('Cannot call up on an accordion that is disabled.');
      return;
    }

    // Don't close the item if it is already closed
    const $targetItem = $target.parent();
    if (!$targetItem[0].classList.contains('is-active')) return;

    // Don't close the item if there is no other active item (unless with `allowAllClosed`)
    const $othersItems = $targetItem.siblings();
    if (!this.options.allowAllClosed && !$othersItems.hasClass('is-active')) return;

    this._closeTab($target);
  }

  /**
   * Make the tab defined by `$target` the only opened tab, closing all others tabs.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @function
   * @private
   */
  _openSingleTab($target) {
    // Close all the others active tabs.
    const $activeContents = this.$element.children('.is-active').children('[data-tab-content]');
    if ($activeContents.length) {
      this._closeTab($activeContents.not($target));
    }

    // Then open the target.
    this._openTab($target);
  }

  /**
   * Opens the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to open (`.accordion-content`).
   * @fires Accordion#down
   * @function
   * @private
   */
  _openTab($target) {
    // The labelledby lookup keeps jQuery's first-element read; the class and
    // aria-hidden writes apply to every pane of the collection, like the
    // jQuery collection calls did.
    const targetContentId = $target.attr('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    $target.each(function() {
      this.setAttribute('aria-hidden', 'false');
      this.parentElement.classList.add('is-active');
    });

    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'true');

    // fx 方案 A: the fold tween runs on Motion's native slide primitive
    // (jQuery fx parity: finish() jumps any in-flight fold, the down event
    // stays timed by the completion callback).
    Motion.finish($target);
    Motion.slideDown($target, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done opening.
       * @event Accordion#down
       */
      Events.trigger(this.$element[0], 'down.zf.accordion', [$target]);
    });
  }

  /**
   * Closes the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeTab($target) {
    // See _openTab: first-element labelledby lookup, per-element writes.
    const targetContentId = $target.attr('aria-labelledby');

    // State/ARIA go through the native layer (7.0 line A, S8).
    $target.each(function() {
      this.setAttribute('aria-hidden', 'true');
      this.parentElement.classList.remove('is-active');
    });

    const label = document.getElementById(targetContentId);
    if (label) label.setAttribute('aria-expanded', 'false');

    // fx 方案 A, see _openTab.
    Motion.finish($target);
    Motion.slideUp($target, this.options.slideSpeed, () => {
      /**
       * Fires when the tab is done collapsing up.
       * @event Accordion#up
       */
      Events.trigger(this.$element[0], 'up.zf.accordion', [$target]);
    });
  }

  /**
   * Closes all active tabs
   * @fires Accordion#up
   * @function
   * @private
   */
  _closeAllTabs() {
    var $activeTabs = this.$element.children('.is-active').children('[data-tab-content]');
    if ($activeTabs.length) {
      this._closeTab($activeTabs);
    }
  }

  /**
   * Destroys an instance of an accordion.
   * @fires Accordion#destroyed
   * @function
   */
  _destroy() {
    // fx 方案 A (see _openTab): the collapse-to-zero cleanup stops any
    // in-flight fold and hides instantly.
    this.$element.find('[data-tab-content]').each(function() {
      Motion.stop(this, true);
      Motion.slideUp(this, 0);
      this.style.display = '';
    });
    // jQuery side: legacy listeners in the plugin namespace.
    this.$element.find('a').off('.zf.accordion');
    // Native side: the flipped click listeners.
    this.$tabs.each(function() {
      $(this).children('a').each(function() {
        Events.off(this, 'click.zf.accordion');
      });
    });
    if (this.options.deepLink) {
      Events.off(window, `hashchange.zf.accordion:${this.id}`);
    }

  }
}

Accordion.defaults = {
  /**
   * Amount of time to animate the opening of an accordion pane.
   * @option
   * @type {number}
   * @default 250
   */
  slideSpeed: 250,
  /**
   * Allow the accordion to have multiple open panes.
   * @option
   * @type {boolean}
   * @default false
   */
  multiExpand: false,
  /**
   * Allow the accordion to close all panes.
   * @option
   * @type {boolean}
   * @default false
   */
  allowAllClosed: false,
  /**
   * Link the location hash to the open pane.
   * Set the location hash when the opened pane changes, and open and scroll to the corresponding pane when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,
  /**
   * If `deepLink` is enabled, adjust the deep link scroll to make sure the top of the accordion panel is visible
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinkSmudge: false,
  /**
   * If `deepLinkSmudge` is enabled, animation time (ms) for the deep link adjustment
   * @option
   * @type {number}
   * @default 300
   */
  deepLinkSmudgeDelay: 300,
  /**
   * If `deepLinkSmudge` is enabled, the offset for the scrollToTop to prevent overlap by a sticky element at the top of the page
   * @option
   * @type {number}
   * @default 0
   */
  deepLinkSmudgeOffset: 0,
  /**
   * If `deepLink` is enabled, update the browser history with the open accordion
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false
};

export { Accordion };
