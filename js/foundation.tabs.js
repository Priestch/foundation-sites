import $ from 'jquery';
import { Plugin } from './foundation.core.plugin';
import { onLoad, GetYoDigits } from './foundation.core.utils';
import { datasetOptions } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Keyboard } from './foundation.util.keyboard';
import { onImagesLoaded } from './foundation.util.imageLoader';
/**
 * Tabs module.
 * @module foundation.tabs
 * @requires foundation.util.keyboard
 * @requires foundation.util.imageLoader if tabs contain images
 */

class Tabs extends Plugin {
  /**
   * Creates a new instance of tabs.
   * @class
   * @name Tabs
   * @fires Tabs#init
   * @param {jQuery} element - jQuery object to make into tabs.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.$element = element;
    this.options = $.extend({}, Tabs.defaults, datasetOptions(element[0]), options);
    this.className = 'Tabs'; // ie9 back compat

    this._init();
    Keyboard.register('Tabs', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'previous',
      'ARROW_DOWN': 'next',
      'ARROW_LEFT': 'previous'
      // 'TAB': 'next',
      // 'SHIFT_TAB': 'previous'
    });
  }

  /**
   * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
   * @private
   */
  _init() {
    var _this = this;
    this._isInitializing = true;
    // Per-instance id for the native deep-link hashchange namespace (7.0 line
    // A, S8) - the same shape Reveal/Magellan/Accordion use.
    this.id = this.$element[0].id || GetYoDigits(6, 'tabs');

    this.$element[0].setAttribute('role', 'tablist');
    this.$tabTitles = this.$element.find(`.${this.options.linkClass}`);
    this.$tabContent = $(`[data-tabs-content="${this.$element[0].id}"]`);

    this.$tabTitles.each(function(){
      var $elem = $(this),
          $link = $elem.find('a'),
          isActive = $elem.hasClass(`${_this.options.linkActiveClass}`),
          hash = $link.attr('data-tabs-target') || $link[0].hash.slice(1),
          linkId = $link[0].id ? $link[0].id : `${hash}-label`,
          $tabContent = $(`#${hash}`);

      // State/ARIA go through the native layer (7.0 line A, S8).
      $elem[0].setAttribute('role', 'presentation');

      var link = $link[0];
      link.setAttribute('role', 'tab');
      link.setAttribute('aria-controls', hash);
      link.setAttribute('aria-selected', `${isActive}`);
      link.setAttribute('id', linkId);
      link.setAttribute('tabindex', isActive ? '0' : '-1');

      $tabContent[0].setAttribute('role', 'tabpanel');
      $tabContent[0].setAttribute('aria-labelledby', linkId);

      // Save up the initial hash to return to it later when going back in history
      if (isActive) {
        _this._initialAnchor = `#${hash}`;
      }

      if(!isActive) {
        $tabContent[0].setAttribute('aria-hidden', 'true');
      }

      if(isActive && _this.options.autoFocus){
        _this.onLoadListener = onLoad($(window), function() {
          // A load callback can land after destroy() nulled the instance
          // state (the S6 slider guard pattern).
          if (!_this.$element) { return; }
          $('html, body').animate({ scrollTop: $elem.offset().top }, _this.options.deepLinkSmudgeDelay, () => {
            $link.focus();
          });
        });
      }
    });

    if(this.options.matchHeight) {
      var $images = this.$tabContent.find('img');

      if ($images.length) {
        onImagesLoaded($images, this._setHeight.bind(this));
      } else {
        this._setHeight();
      }
    }

     // Current context-bound function to open tabs on page load or history hashchange
    this._checkDeepLink = () => {
      var anchor = window.location.hash;

      if (!anchor.length) {
        // If we are still initializing and there is no anchor, then there is nothing to do
        if (this._isInitializing) return;
        // Otherwise, move to the initial anchor
        if (this._initialAnchor) anchor = this._initialAnchor;
      }

      var anchorNoHash = anchor.indexOf('#') >= 0 ? anchor.slice(1) : anchor;
      var $anchor = anchorNoHash && $(`#${anchorNoHash}`);
      var $link = anchor && this.$element.find(`[href$="${anchor}"],[data-tabs-target="${anchorNoHash}"]`).first();
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!($anchor.length && $link.length);

      if (isOwnAnchor) {
        // If there is an anchor for the hash, select it
        if ($anchor && $anchor.length && $link && $link.length) {
          this.selectTab($anchor, true);
        }
        // Otherwise, collapse everything
        else {
          this._collapse();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          var offset = this.$element.offset();
          $('html, body').animate({ scrollTop: offset.top - this.options.deepLinkSmudgeOffset}, this.options.deepLinkSmudgeDelay);
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Tabs#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        Events.trigger(this.$element[0], 'deeplink.zf.tabs', [$link, $anchor]);
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
   * Adds event handlers for items within the tabs.
   * @private
   */
  _events() {
    this._addKeyHandler();
    this._addClickHandler();
    this._setHeightMqHandler = null;

    if (this.options.matchHeight) {
      this._setHeightMqHandler = this._setHeight.bind(this);

      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs/offcanvas all flipped with the producer in
      // the same move).
      Events.on(window, 'changed.zf.mediaquery', this._setHeightMqHandler);
    }

    if(this.options.deepLink) {
      // S8: the deep-link hashchange moves to the native event layer under
      // the per-instance namespace shape introduced for Reveal's hashchange,
      // so the destroy path can drop it precisely. Real hashchange events are
      // unaffected by the namespace.
      Events.on(window, `hashchange.zf.tabs:${this.id}`, this._checkDeepLink);
    }
  }

  /**
   * Adds click handlers for items within the tabs.
   * @private
   */
  _addClickHandler() {
    var _this = this;

    // S8: the delegated click consumer flips to the native event layer. Its
    // producers are real user clicks only (the keyboard flow calls
    // _handleTabChange directly), so this half can move alone; inside the
    // handler `this` is the matched title element, like jQuery's delegation.
    Events.off(this.$element[0], 'click.zf.tabs');
    Events.delegate(this.$element[0], 'click.zf.tabs', `.${this.options.linkClass}`, function(e){
      e.preventDefault();
      _this._handleTabChange($(this));
    });
  }

  /**
   * Adds keyboard event handlers for items within the tabs.
   * @private
   */
  _addKeyHandler() {
    var _this = this;

    // Seam (S8): the keydown binding stays on jQuery. The coarse keyboard
    // suite feeds jQuery-synthesized mock keydowns, which can never reach
    // native listeners; real keydowns keep arriving through jQuery's
    // pass-through. This half flips when its synthetic producers do
    // (Keyboard test migration).
    this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function(e){
      if (e.which === 9) return;


      var $element = $(this),
        $elements = $element.parent('ul').children('li'),
        $prevElement,
        $nextElement;

      $elements.each(function(i) {
        if ($(this).is($element)) {
          if (_this.options.wrapOnKeys) {
            $prevElement = i === 0 ? $elements.last() : $elements.eq(i-1);
            $nextElement = i === $elements.length -1 ? $elements.first() : $elements.eq(i+1);
          } else {
            $prevElement = $elements.eq(Math.max(0, i-1));
            $nextElement = $elements.eq(Math.min(i+1, $elements.length-1));
          }
          return;
        }
      });

      // handle keyboard event with keyboard util
      Keyboard.handleKey(e, 'Tabs', {
        open: function() {
          $element.find('[role="tab"]').focus();
          _this._handleTabChange($element);
        },
        previous: function() {
          $prevElement.find('[role="tab"]').focus();
          _this._handleTabChange($prevElement);
        },
        next: function() {
          $nextElement.find('[role="tab"]').focus();
          _this._handleTabChange($nextElement);
        },
        handled: function() {
          e.preventDefault();
        }
      });
    });
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`. Collapses active tab.
   * @param {jQuery} $target - Tab to open.
   * @param {boolean} historyHandled - browser has already handled a history update
   * @fires Tabs#change
   * @function
   */
  _handleTabChange($target, historyHandled) {

    // With `activeCollapse`, if the target is the active Tab, collapse it.
    if ($target.hasClass(`${this.options.linkActiveClass}`)) {
        if(this.options.activeCollapse) {
            this._collapse();
        }
        return;
    }

    var $oldTab = this.$element.
          find(`.${this.options.linkClass}.${this.options.linkActiveClass}`),
          $tabLink = $target.find('[role="tab"]'),
          target = $tabLink.attr('data-tabs-target'),
          anchor = target && target.length ? `#${target}` : $tabLink[0].hash,
          $targetContent = this.$tabContent.find(anchor);

    //close old tab
    this._collapseTab($oldTab);

    //open new tab
    this._openTab($target);

    //either replace or update browser history
    if (this.options.deepLink && !historyHandled) {
      if (this.options.updateHistory) {
        history.pushState({}, '', location.pathname + location.search + anchor);
      } else {
        history.replaceState({}, '', location.pathname + location.search + anchor);
      }
    }

    /**
     * Fires when the plugin has successfully changed tabs.
     * @event Tabs#change
     */
    // Seam (S8): the change production stays on jQuery. Its jQuery-side
    // consumers (the coarse suite, user code) read the forwarded collections
    // as trailing handler arguments - a real CustomEvent delivers them only
    // in event.originalEvent.detail, which would silently break those
    // signatures. This producer flips together with that consumer base in
    // the wrap-up/test-migration slice.
    this.$element.trigger('change.zf.tabs', [$target, $targetContent]);

    // S10 group flip: the mutateme forward joins the native event layer -
    // the last jQuery-side consumers (Equalizer, Drilldown, Sticky) flip in
    // the same commit, so each listener receives the real bubbling event
    // exactly once; still-on-jQuery third-party listeners keep receiving it
    // through the real-event pass-through (white absorption).
    var mutated = $targetContent.length ? $targetContent[0].querySelectorAll('[data-mutate]') : [];
    for (var i = 0; i < mutated.length; i++) {
      Events.trigger(mutated[i], 'mutateme.zf.trigger');
    }
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to open.
   * @function
   */
  _openTab($target) {
      var $tabLink = $target.find('[role="tab"]'),
          hash = $tabLink.attr('data-tabs-target') || $tabLink[0].hash.slice(1),
          $targetContent = this.$tabContent.find(`#${hash}`);

      // State/ARIA go through the native layer (7.0 line A, S8).
      $target[0].classList.add(`${this.options.linkActiveClass}`);

      $tabLink[0].setAttribute('aria-selected', 'true');
      $tabLink[0].setAttribute('tabindex', '0');

      $targetContent[0].classList.add(`${this.options.panelActiveClass}`);
      $targetContent[0].removeAttribute('aria-hidden');
  }

  /**
   * Collapses `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to collapse.
   * @function
   */
  _collapseTab($target) {
    // State/ARIA go through the native layer (7.0 line A, S8).
    var $tabLink = $target.find('[role="tab"]');
    $target[0].classList.remove(`${this.options.linkActiveClass}`);
    $tabLink[0].setAttribute('aria-selected', 'false');
    $tabLink[0].setAttribute('tabindex', '-1');

    var panel = document.getElementById($tabLink[0].getAttribute('aria-controls'));
    if (panel) {
      panel.classList.remove(`${this.options.panelActiveClass}`);
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Collapses the active Tab.
   * @fires Tabs#collapse
   * @function
   */
  _collapse() {
    var $activeTab = this.$element.find(`.${this.options.linkClass}.${this.options.linkActiveClass}`);

    if ($activeTab.length) {
      this._collapseTab($activeTab);

      /**
      * Fires when the plugin has successfully collapsed tabs.
      * @event Tabs#collapse
      */
      // S8: real, bubbling CustomEvent - native listeners receive it
      // directly, still-on-jQuery listeners through the real-event
      // pass-through (the forwarded $activeTab rides in
      // event.originalEvent.detail for them).
      Events.trigger(this.$element[0], 'collapse.zf.tabs', [$activeTab]);
    }
  }

  /**
   * Public method for selecting a content pane to display.
   * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
   * @param {boolean} historyHandled - browser has already handled a history update
   * @function
   */
  selectTab(elem, historyHandled) {
    var idStr, hashIdStr;

    if (typeof elem === 'object') {
      idStr = elem[0].id;
    } else {
      idStr = elem;
    }

    if (idStr.indexOf('#') < 0) {
      hashIdStr = `#${idStr}`;
    } else {
      hashIdStr = idStr;
      idStr = idStr.slice(1);
    }

    var $target = this.$tabTitles.has(`[href$="${hashIdStr}"],[data-tabs-target="${idStr}"]`).first();

    this._handleTabChange($target, historyHandled);
  };

  /**
   * Sets the height of each panel to the height of the tallest panel.
   * If enabled in options, gets called on media query change.
   * If loading content via external source, can be called directly or with _reflow.
   * If enabled with `data-match-height="true"`, tabs sets to equal height
   * @function
   * @private
   */
  _setHeight() {
    var max = 0,
        _this = this; // Lock down the `this` value for the root tabs object

    if (!this.$tabContent) {
      return;
    }

    this.$tabContent
      .find(`.${this.options.panelClass}`)
      .css('min-height', '')
      .each(function() {

        var panel = $(this),
            isActive = panel.hasClass(`${_this.options.panelActiveClass}`); // get the options from the parent instead of trying to get them from the child

        if (!isActive) {
          panel.css({'visibility': 'hidden', 'display': 'block'});
        }

        var temp = this.getBoundingClientRect().height;

        if (!isActive) {
          panel.css({
            'visibility': '',
            'display': ''
          });
        }

        max = temp > max ? temp : max;
      })
      .css('min-height', `${max}px`);
  }

  /**
   * Destroys an instance of tabs.
   * @fires Tabs#destroyed
   */
  _destroy() {
    this.$element
      .find(`.${this.options.linkClass}`)
      .off('.zf.tabs').hide().end()
      .find(`.${this.options.panelClass}`)
      .hide();

    // Native side: the delegated click listener and the deep-link
    // hashchange go with their namespaces.
    Events.off(this.$element[0], 'click.zf.tabs');

    if (this.options.matchHeight) {
      if (this._setHeightMqHandler != null) {
         Events.off(window, 'changed.zf.mediaquery', this._setHeightMqHandler); // S13 flip, see _events
      }
    }

    if (this.options.deepLink) {
      Events.off(window, `hashchange.zf.tabs:${this.id}`);
    }

    if (this.onLoadListener) {
      Events.off(window, this.onLoadListener); // S4: onLoad registers on the native event layer
    }
  }
}

Tabs.defaults = {
  /**
   * Link the location hash to the active pane.
   * Set the location hash when the active pane changes, and open the corresponding pane when the location changes.
   * @option
   * @type {boolean}
   * @default false
   */
  deepLink: false,

  /**
   * If `deepLink` is enabled, adjust the deep link scroll to make sure the top of the tab panel is visible
   * @option
   * @type {boolean}
   * @default false
   */
  deepLinkSmudge: false,

  /**
   * If `deepLink` is enabled, animation time (ms) for the deep link adjustment
   * @option
   * @type {number}
   * @default 300
   */
  deepLinkSmudgeDelay: 300,

  /**
   * If `deepLink` is enabled, animation offset from the top for the deep link adjustment
   * @option
   * @type {number}
   * @default 0
   */
  deepLinkSmudgeOffset: 0,

  /**
   * If `deepLink` is enabled, update the browser history with the open tab
   * @option
   * @type {boolean}
   * @default false
   */
  updateHistory: false,

  /**
   * Allows the window to scroll to content of active pane on load.
   * Not recommended if more than one tab panel per page.
   * @option
   * @type {boolean}
   * @default false
   */
  autoFocus: false,

  /**
   * Allows keyboard input to 'wrap' around the tab links.
   * @option
   * @type {boolean}
   * @default true
   */
  wrapOnKeys: true,

  /**
   * Allows the tab content panes to match heights if set to true.
   * @option
   * @type {boolean}
   * @default false
   */
  matchHeight: false,

  /**
   * Allows active tabs to collapse when clicked.
   * @option
   * @type {boolean}
   * @default false
   */
  activeCollapse: false,

  /**
   * Class applied to `li`'s in tab link list.
   * @option
   * @type {string}
   * @default 'tabs-title'
   */
  linkClass: 'tabs-title',

  /**
   * Class applied to the active `li` in tab link list.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  linkActiveClass: 'is-active',

  /**
   * Class applied to the content containers.
   * @option
   * @type {string}
   * @default 'tabs-panel'
   */
  panelClass: 'tabs-panel',

  /**
   * Class applied to the active content container.
   * @option
   * @type {string}
   * @default 'is-active'
   */
  panelActiveClass: 'is-active'
};

export {Tabs};
