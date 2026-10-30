import { Plugin } from './foundation.core.plugin';
import { onLoad, GetYoDigits } from './foundation.core.utils';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Keyboard } from './foundation.util.keyboard';
import { onImagesLoaded } from './foundation.util.imageLoader';
import { Motion } from './foundation.util.motion';
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
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Tabs.defaults, datasetOptions(this.$element), options);
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
    this.id = this.$element.id || GetYoDigits(6, 'tabs');

    this.$element.setAttribute('role', 'tablist');
    this.$tabTitles = Array.from(this.$element.querySelectorAll(`.${this.options.linkClass}`));
    this.$tabContent = document.querySelector(`[data-tabs-content="${this.$element.id}"]`);

    this.$tabTitles.forEach(function(elem){
      var link = elem.querySelector('a'),
          isActive = elem.classList.contains(`${_this.options.linkActiveClass}`),
          hash = link.getAttribute('data-tabs-target') || link.hash.slice(1),
          linkId = link.id ? link.id : `${hash}-label`,
          tabContent = document.getElementById(hash);

      // State/ARIA go through the native layer (7.0 line A, S8).
      elem.setAttribute('role', 'presentation');

      link.setAttribute('role', 'tab');
      link.setAttribute('aria-controls', hash);
      link.setAttribute('aria-selected', `${isActive}`);
      link.setAttribute('id', linkId);
      link.setAttribute('tabindex', isActive ? '0' : '-1');

      tabContent.setAttribute('role', 'tabpanel');
      tabContent.setAttribute('aria-labelledby', linkId);

      // Save up the initial hash to return to it later when going back in history
      if (isActive) {
        _this._initialAnchor = `#${hash}`;
      }

      if(!isActive) {
        tabContent.setAttribute('aria-hidden', 'true');
      }

      if(isActive && _this.options.autoFocus){
        _this.onLoadListener = onLoad(window, function() {
          // A load callback can land after destroy() nulled the instance
          // state (the S6 slider guard pattern).
          if (!_this.$element) { return; }
          // fx 方案 A: the native page-scroll tween (SmoothScroll S7
          // equivalence - one viewport tween, the callback once, ledger ②)
          Motion.animate(document.documentElement, { scrollTop: elem.getBoundingClientRect().top + window.pageYOffset }, _this.options.deepLinkSmudgeDelay, null, () => {
            link.focus();
          });
        });
      }
    });

    if(this.options.matchHeight) {
      var images = this.$tabContent ? this.$tabContent.querySelectorAll('img') : [];

      if (images.length) {
        onImagesLoaded(images, this._setHeight.bind(this));
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
      var anchorEl = anchorNoHash ? document.getElementById(anchorNoHash) : null;
      var link = anchor ? this.$element.querySelector(`[href$="${anchor}"],[data-tabs-target="${anchorNoHash}"]`) : null;
      // Whether the anchor element that has been found is part of this element
      var isOwnAnchor = !!(anchorEl && link);

      if (isOwnAnchor) {
        // If there is an anchor for the hash, select it
        if (anchorEl && link) {
          this.selectTab(anchorEl, true);
        }
        // Otherwise, collapse everything
        else {
          this._collapse();
        }

        // Roll up a little to show the titles
        if (this.options.deepLinkSmudge) {
          var offsetTop = this.$element.getBoundingClientRect().top + window.pageYOffset;
          Motion.animate(document.documentElement, { scrollTop: offsetTop - this.options.deepLinkSmudgeOffset}, this.options.deepLinkSmudgeDelay);
        }

        /**
         * Fires when the plugin has deeplinked at pageload
         * @event Tabs#deeplink
         */
        // S8: real, bubbling CustomEvent - native listeners receive it
        // directly, still-on-jQuery listeners through the real-event
        // pass-through (the forwarded $link/$anchor ride in
        // event.originalEvent.detail for them).
        Events.trigger(this.$element, 'deeplink.zf.tabs', [link, anchorEl]);
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
    Events.off(this.$element, 'click.zf.tabs');
    Events.delegate(this.$element, 'click.zf.tabs', `.${this.options.linkClass}`, function(e){
      e.preventDefault();
      _this._handleTabChange(this);
    });
  }

  /**
   * Adds keyboard event handlers for items within the tabs.
   * @private
   */
  _addKeyHandler() {
    var _this = this;

    // 7.0 line A terminal form: the keydown listener runs on the native
    // event layer (the coarse suite's mocks dispatch real KeyboardEvents
    // since the S16 migration, so the old jQuery-pass-through reason is
    // gone). The listener binds on every title, like the collection-wide
    // .on() did.
    this.$tabTitles.forEach(function(title) {
      Events.off(title, 'keydown.zf.tabs');
      Events.on(title, 'keydown.zf.tabs', function(e){
        if (e.which === 9) return;

        var elements = Array.from(this.parentElement.children),
          prevElement,
          nextElement,
          i = elements.indexOf(this);

        if (_this.options.wrapOnKeys) {
          prevElement = i === 0 ? elements[elements.length - 1] : elements[i-1];
          nextElement = i === elements.length - 1 ? elements[0] : elements[i+1];
        } else {
          prevElement = elements[Math.max(0, i-1)];
          nextElement = elements[Math.min(i+1, elements.length-1)];
        }

        var element = this;
        // handle keyboard event with keyboard util
        Keyboard.handleKey(e, 'Tabs', {
          open: function() {
            element.querySelector('[role="tab"]').focus();
            _this._handleTabChange(element);
          },
          previous: function() {
            prevElement.querySelector('[role="tab"]').focus();
            _this._handleTabChange(prevElement);
          },
          next: function() {
            nextElement.querySelector('[role="tab"]').focus();
            _this._handleTabChange(nextElement);
          },
          handled: function() {
            e.preventDefault();
          }
        });
      });
    }, this.$tabTitles);
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`. Collapses active tab.
   * @param {jQuery} $target - Tab to open.
   * @param {boolean} historyHandled - browser has already handled a history update
   * @fires Tabs#change
   * @function
   */
  _handleTabChange(target, historyHandled) {
    target = target.nodeType === 1 ? target : target[0];

    // With `activeCollapse`, if the target is the active Tab, collapse it.
    if (target.classList.contains(`${this.options.linkActiveClass}`)) {
        if(this.options.activeCollapse) {
            this._collapse();
        }
        return;
    }

    var oldTab = this.$element.
          querySelector(`.${this.options.linkClass}.${this.options.linkActiveClass}`),
          tabLink = target.querySelector('[role="tab"]'),
          targetName = tabLink.getAttribute('data-tabs-target'),
          anchor = targetName && targetName.length ? `#${targetName}` : tabLink.hash,
          targetContent = this.$tabContent.querySelector(anchor);

    //close old tab
    this._collapseTab(oldTab);

    //open new tab
    this._openTab(target);

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
    // 7.0 terminal form (the ruled detail sweep): the change production is
    // a real, bubbling CustomEvent with the plain elements as parameters -
    // the 6.x jQuery trigger delivered collections as trailing handler
    // arguments; jQuery listeners on this real event read them from
    // event.originalEvent.detail.
    Events.trigger(this.$element, 'change.zf.tabs', [target, targetContent]);

    // S10 group flip: the mutateme forward is a real bubbling event.
    var mutated = targetContent ? targetContent.querySelectorAll('[data-mutate]') : [];
    for (var i = 0; i < mutated.length; i++) {
      Events.trigger(mutated[i], 'mutateme.zf.trigger');
    }
  }

  /**
   * Opens the tab `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to open.
   * @function
   */
  _openTab(target) {
      var tabLink = target.querySelector('[role="tab"]'),
          hash = tabLink.getAttribute('data-tabs-target') || tabLink.hash.slice(1),
          targetContent = this.$tabContent.querySelector(`#${hash}`);

      // State/ARIA go through the native layer (7.0 line A, S8).
      target.classList.add(`${this.options.linkActiveClass}`);

      tabLink.setAttribute('aria-selected', 'true');
      tabLink.setAttribute('tabindex', '0');

      targetContent.classList.add(`${this.options.panelActiveClass}`);
      targetContent.removeAttribute('aria-hidden');
  }

  /**
   * Collapses `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to collapse.
   * @function
   */
  _collapseTab(target) {
    target = target.nodeType === 1 ? target : target[0];
    // State/ARIA go through the native layer (7.0 line A, S8).
    var tabLink = target.querySelector('[role="tab"]');
    target.classList.remove(`${this.options.linkActiveClass}`);
    tabLink.setAttribute('aria-selected', 'false');
    tabLink.setAttribute('tabindex', '-1');

    var panel = document.getElementById(tabLink.getAttribute('aria-controls'));
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
    var activeTab = this.$element.querySelector(`.${this.options.linkClass}.${this.options.linkActiveClass}`);

    if (activeTab) {
      this._collapseTab(activeTab);

      /**
      * Fires when the plugin has successfully collapsed tabs.
      * @event Tabs#collapse
      */
      // S8: real, bubbling CustomEvent; the terminal form forwards the
      // plain element.
      Events.trigger(this.$element, 'collapse.zf.tabs', [activeTab]);
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
      // nodeType marks a real node: a native element arrives unwrapped
      // (the 7.0 contract), a jQuery collection still needs the [0] head
      idStr = elem.nodeType === 1 ? elem.id : elem[0].id;
    } else {
      idStr = elem;
    }

    if (idStr.indexOf('#') < 0) {
      hashIdStr = `#${idStr}`;
    } else {
      hashIdStr = idStr;
      idStr = idStr.slice(1);
    }

    // jQuery's .has(): the titles CONTAINING a descendant matching
    var target = this.$tabTitles.filter(function(title) {
      return title.querySelector(`[href$="${hashIdStr}"],[data-tabs-target="${idStr}"]`);
    })[0];

    this._handleTabChange(target, historyHandled);
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

    var panels = Array.from(this.$tabContent.querySelectorAll(`.${this.options.panelClass}`));

    panels.forEach(function(panel) {
      panel.style.minHeight = '';

      var isActive = panel.classList.contains(`${_this.options.panelActiveClass}`); // get the options from the parent instead of trying to get them from the child

      if (!isActive) {
        panel.style.visibility = 'hidden';
        panel.style.display = 'block';
      }

      var temp = panel.getBoundingClientRect().height;

      if (!isActive) {
        panel.style.visibility = '';
        panel.style.display = '';
      }

      max = temp > max ? temp : max;
    });

    panels.forEach(function(panel) {
      panel.style.minHeight = `${max}px`;
    });
  }

  /**
   * Destroys an instance of tabs.
   * @fires Tabs#destroyed
   */
  _destroy() {
    // the 6.x destroy cleanup: hide the titles and panels
    this.$element.querySelectorAll(`.${this.options.linkClass}`).forEach(function(el) {
      el.style.display = 'none';
    });
    this.$element.querySelectorAll(`.${this.options.panelClass}`).forEach(function(el) {
      el.style.display = 'none';
    });

    // the delegated click listener, the title keydown listeners and the
    // deep-link hashchange go with their namespaces.
    Events.off(this.$element, 'click.zf.tabs');
    this.$tabTitles.forEach(function(title) {
      Events.off(title, '.zf.tabs');
    });

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
