import { Plugin } from './foundation.core.plugin';
import { onLoad, GetYoDigits } from './foundation.core.utils';
import { Events } from './foundation.util.events';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { MediaQuery } from './foundation.util.mediaQuery';
import { Triggers } from './foundation.util.triggers';

/**
 * Sticky module.
 * @module foundation.sticky
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

class Sticky extends Plugin {
  /**
   * Creates a new instance of a sticky thing.
   * @class
   * @name Sticky
   * @param {jQuery} element - jQuery object to make sticky.
   * @param {Object} options - options object passed when creating the element programmatically.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Sticky.defaults, datasetOptions(this.$element), options);
    this.className = 'Sticky'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init();

    this._init();
  }

  /**
   * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();

    var parentContainer = (this.$element.parentElement && this.$element.parentElement.matches('[data-sticky-container]')) ? this.$element.parentElement : null,
        id = this.$element.id || GetYoDigits(6, 'sticky'),
        _this = this;

    if(parentContainer){
      this.$container = parentContainer;
    } else {
      this.wasWrapped = true;
      // .wrap(htmlString): a container built from the option markup
      var probe = document.createElement('template');
      probe.innerHTML = this.options.container.trim();
      var wrapper = probe.content.firstElementChild;
      this.$element.parentElement.insertBefore(wrapper, this.$element);
      wrapper.appendChild(this.$element);
      this.$container = this.$element.parentElement;
    }
    this.$container.classList.add(this.options.containerClass);

    // State attributes go through the native layer (7.0 line A, S10).
    this.$element.classList.add(this.options.stickyClass);
    this.$element.setAttribute('data-resize', id);
    this.$element.setAttribute('data-mutate', id);
    if (this.options.anchor !== '') {
        var anchorInit = document.getElementById(_this.options.anchor);
        if (anchorInit) { anchorInit.setAttribute('data-mutate', id); }
    }

    this.scrollCount = this.options.checkEvery;
    this.isStuck = false;
    this.onLoadListener = onLoad(window, function () {
      // A load callback can land after destroy() nulled the instance state
      // (Magellan S7 precedent).
      if (!_this.$element) { return; }

      //We calculate the container height to have correct values for anchor points offset calculation.
      _this.containerHeight = window.getComputedStyle(_this.$element).display === "none" ? 0 : _this.$element.getBoundingClientRect().height;
      _this.$container.style.height = _this.containerHeight + 'px';
      _this.elemHeight = _this.containerHeight;
      if (_this.options.anchor !== '') {
        _this.$anchor = document.getElementById(_this.options.anchor);
      } else {
        _this._parsePoints();
      }

      _this._setSizes(function () {
        var scroll = window.pageYOffset;
        _this._calc(false, scroll);
        //Unstick the element will ensure that proper classes are set.
        if (!_this.isStuck) {
          _this._removeSticky((scroll >= _this.topPoint) ? false : true);
        }
      });
      _this._events(id.split('-').reverse().join('-'));
    });
  }

  /**
   * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
   * @function
   * @private
   */
  _parsePoints() {
    var top = this.options.topAnchor === "" ? 1 : this.options.topAnchor,
        btm = this.options.btmAnchor === "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
        pts = [top, btm],
        breaks = {};
    for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
      var pt;
      if (typeof pts[i] === 'number') {
        pt = pts[i];
      } else {
        var place = pts[i].split(':'),
            anchor = document.getElementById(place[0]);

        // offset().top equivalent (7.0 line A, S10): viewport-relative rect
        // plus the current scroll, the S7 SmoothScroll precedent.
        pt = anchor.getBoundingClientRect().top + window.pageYOffset;
        if (place[1] && place[1].toLowerCase() === 'bottom') {
          pt += anchor.getBoundingClientRect().height;
        }
      }
      breaks[i] = pt;
    }


    this.points = breaks;
    return;
  }

  /**
   * Adds event handlers for the scrolling element.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _events(id) {
    var _this = this,
        scrollListener = this.scrollListener = `scroll.zf.${id}`;
    if (this.isOn) { return; }
    if (this.canStick) {
      this.isOn = true;
      // S10: the window scroll consumer flips to the native event layer -
      // real scroll events reach it directly, under the per-instance
      // namespace so the destroy path can drop it precisely.
      Events.off(window, scrollListener);
      Events.on(window, scrollListener, function() {
        if (_this.scrollCount === 0) {
          _this.scrollCount = _this.options.checkEvery;
          _this._setSizes(function() {
            _this._calc(false, window.pageYOffset);
          });
        } else {
          _this.scrollCount--;
          _this._calc(false, window.pageYOffset);
        }
      });
    }

    // S10: the resizeme consumer flips to the native event layer (S4
    // producer), like Equalizer S8.
    Events.off(this.$element, 'resizeme.zf.trigger');
    Events.on(this.$element, 'resizeme.zf.trigger', function() {
        _this._eventsHandler(id);
    });

    // S10 group flip: the mutateme consumers (element and anchor) join the
    // native event layer together with the last jQuery-synthesized
    // producers (Tabs forward, ResponsiveToggle animated half), so every
    // listener receives each dispatch exactly once.
    Events.on(this.$element, 'mutateme.zf.trigger', function () {
        _this._eventsHandler(id);
    });

    if(this.$anchor) {
      Events.on(this.$anchor, 'mutateme.zf.trigger', function () {
          _this._eventsHandler(id);
      });
    }
  }

  /**
   * Handler for events.
   * @private
   * @param {String} id - pseudo-random id for unique scroll event listener.
   */
  _eventsHandler(id) {
       var _this = this,
        scrollListener = this.scrollListener = `scroll.zf.${id}`;

       _this._setSizes(function() {
       _this._calc(false);
       if (_this.canStick) {
         if (!_this.isOn) {
           _this._events(id);
         }
       } else if (_this.isOn) {
         _this._pauseListeners(scrollListener);
       }
     });
  }

  /**
   * Removes event handlers for scroll and change events on anchor.
   * @fires Sticky#pause
   * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
   */
  _pauseListeners(scrollListener) {
    this.isOn = false;
    Events.off(window, scrollListener);

    /**
     * Fires when the plugin is paused due to resize event shrinking the view.
     * @event Sticky#pause
     * @private
     */
     // S10: real, bubbling CustomEvent - native listeners receive it
     // directly, still-on-jQuery listeners through the real-event pass-
     // through (white absorption).
     Events.trigger(this.$element, 'pause.zf.sticky');
  }

  /**
   * Called on every `scroll` event and on `_init`
   * fires functions based on booleans and cached values
   * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
   * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
   */
  _calc(checkSizes, scroll) {
    if (checkSizes) { this._setSizes(); }

    if (!this.canStick) {
      if (this.isStuck) {
        this._removeSticky(true);
      }
      return false;
    }

    if (!scroll) { scroll = window.pageYOffset; }

    if (scroll >= this.topPoint) {
      if (scroll <= this.bottomPoint) {
        if (!this.isStuck) {
          this._setSticky();
        }
      } else {
        if (this.isStuck) {
          this._removeSticky(false);
        }
      }
    } else {
      if (this.isStuck) {
        this._removeSticky(true);
      }
    }
  }

  /**
   * Causes the $element to become stuck.
   * Adds `position: fixed;`, and helper classes.
   * @fires Sticky#stuckto
   * @function
   * @private
   */
  _setSticky() {
    var _this = this,
        stickTo = this.options.stickTo,
        mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
        notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
        css = {};

    css[mrgn] = `${this.options[mrgn]}em`;
    css[stickTo] = 0;
    css[notStuckTo] = 'auto';
    this.isStuck = true;
    // State classes go through the native layer (7.0 line A, S10); the css
    // writes stay on jQuery (css seam).
    this.$element.classList.remove('is-anchored', `is-at-${notStuckTo}`);
    this.$element.classList.add('is-stuck', `is-at-${stickTo}`);
    Object.keys(css).forEach(function(prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become `position: fixed;`
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
     * @event Sticky#stuckto
     */
    Events.trigger(this.$element, `sticky.zf.stuckto:${stickTo}`);
    // S10: the transitionend-family consumer flips to the native event
    // layer - real browser events reach it directly. M1's off-then-on wipe
    // carries over as the Events.off form.
    Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky')
    Events.on(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky', function() {
      _this._setSizes();
    });
  }

  /**
   * Causes the $element to become unstuck.
   * Removes `position: fixed;`, and helper classes.
   * Adds other helper classes.
   * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
   * @fires Sticky#unstuckfrom
   * @private
   */
  _removeSticky(isTop) {
    var stickTo = this.options.stickTo,
        stickToTop = stickTo === 'top',
        css = {},
        anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
        mrgn = stickToTop ? 'marginTop' : 'marginBottom',
        topOrBottom = isTop ? 'top' : 'bottom';

    css[mrgn] = 0;

    css.bottom = 'auto';
    if(isTop) {
      css.top = 0;
    } else {
      css.top = anchorPt;
    }

    this.isStuck = false;
    // State classes go through the native layer (7.0 line A, S10).
    this.$element.classList.remove('is-stuck', `is-at-${stickTo}`);
    this.$element.classList.add('is-anchored', `is-at-${topOrBottom}`);
    Object.keys(css).forEach(function(prop) {
      this.$element.style[prop] = css[prop];
    }, this);
    /**
     * Fires when the $element has become anchored.
     * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
     * @event Sticky#unstuckfrom
     */
    Events.trigger(this.$element, `sticky.zf.unstuckfrom:${topOrBottom}`);
  }

  /**
   * Sets the $element and $container sizes for plugin.
   * Calls `_setBreakPoints`.
   * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
   * @private
   */
  _setSizes(cb) {
    this.canStick = MediaQuery.is(this.options.stickyOn);
    if (!this.canStick) {
      if (cb && typeof cb === 'function') { cb(); }
      return;
    }

    var newElemWidth = this.$container.getBoundingClientRect().width,
      comp = window.getComputedStyle(this.$container),
      pdngl = parseInt(comp['padding-left'], 10),
      pdngr = parseInt(comp['padding-right'], 10);

    if (this.$anchor) {
      this.anchorHeight = this.$anchor.getBoundingClientRect().height;
    } else {
      this._parsePoints();
    }

    this.$element.style.maxWidth = `${newElemWidth - pdngl - pdngr}px`;

    // Recalculate the height only if it is "dynamic"
    if (this.options.dynamicHeight || !this.containerHeight) {
      // Get the sticked element height and apply it to the container to "hold the place"
      var newContainerHeight = this.$element.getBoundingClientRect().height || this.containerHeight;
      newContainerHeight = window.getComputedStyle(this.$element).display === "none" ? 0 : newContainerHeight;
      this.$container.style.height = newContainerHeight + 'px';
      this.containerHeight = newContainerHeight;
    }
    this.elemHeight = this.containerHeight;

    if (!this.isStuck) {
      if (this.$element.classList.contains('is-at-bottom')) {
        var anchorPt = (this.points ? this.points[1] - (this.$container.getBoundingClientRect().top + window.pageYOffset) : this.anchorHeight) - this.elemHeight;
        this.$element.style.top = anchorPt + 'px';
      }
    }

    this._setBreakPoints(this.containerHeight, function() {
      if (cb && typeof cb === 'function') { cb(); }
    });
  }

  /**
   * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
   * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
   * @param {Function} cb - optional callback function to be called on completion.
   * @private
   */
  _setBreakPoints(elemHeight, cb) {
    if (!this.canStick) {
      if (cb && typeof cb === 'function') { cb(); }
      return false;
    }
    var mTop = emCalc(this.options.marginTop),
        mBtm = emCalc(this.options.marginBottom),
        // offset().top equivalent (7.0 line A, S10, S7 SmoothScroll
        // precedent).
        topPoint = this.points ? this.points[0] : this.$anchor.getBoundingClientRect().top + window.pageYOffset,
        bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,
        winHeight = window.innerHeight;

    if (this.options.stickTo === 'top') {
      topPoint -= mTop;
      bottomPoint -= (elemHeight + mTop);
    } else if (this.options.stickTo === 'bottom') {
      topPoint -= (winHeight - (elemHeight + mBtm));
      bottomPoint -= (winHeight - mBtm);
    } else {
      //this would be the stickTo: both option... tricky
    }

    this.topPoint = topPoint;
    this.bottomPoint = bottomPoint;

    if (cb && typeof cb === 'function') { cb(); }
  }

  /**
   * Destroys the current sticky element.
   * Resets the element to the top position first.
   * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
   * @function
   */
  _destroy() {
    this._removeSticky(true);

    // The css resets and the state classes.
    this.$element.classList.remove(`${this.options.stickyClass}`, 'is-anchored', 'is-at-top');
    this.$element.style.height = '';
    this.$element.style.top = '';
    this.$element.style.bottom = '';
    this.$element.style.maxWidth = '';
    // Native side: the flipped resizeme/mutateme/transitionend listeners and
    // the per-instance window scroll listener drop precisely. The mutateme
    // listeners live on the native layer since the S10 group flip.
    Events.off(this.$element, 'resizeme.zf.trigger mutateme.zf.trigger');
    Events.off(this.$element, 'transitionend.zf.sticky webkitTransitionEnd.zf.sticky oTransitionEnd.zf.sticky otransitionend.zf.sticky MSTransitionEnd.zf.sticky');
    if (this.$anchor) {
      // The 'change.zf.sticky' off below is removed (S14): 6.x never bound a
      // change listener on the anchor (grep master confirms - only this off
      // existed), so the wipe always matched nothing, and on the native
      // layer it could never unregister anything either. Dead code.
      Events.off(this.$anchor, 'mutateme.zf.trigger');
    }
    if (this.scrollListener) Events.off(window, this.scrollListener)
    if (this.onLoadListener) Events.off(window, this.onLoadListener) // S4: onLoad registers on the native event layer

    if (this.wasWrapped) {
      // .unwrap(): the wrapper is replaced by its children
      const wrapper = this.$element.parentElement;
      while (wrapper.firstChild) {
        wrapper.parentElement.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    } else {
      this.$container.classList.remove(this.options.containerClass);
      this.$container.style.height = '';
    }
  }
}

Sticky.defaults = {
  /**
   * Customizable container template. Add your own classes for styling and sizing.
   * @option
   * @type {string}
   * @default '&lt;div data-sticky-container&gt;&lt;/div&gt;'
   */
  container: '<div data-sticky-container></div>',
  /**
   * Location in the view the element sticks to. Can be `'top'` or `'bottom'`.
   * @option
   * @type {string}
   * @default 'top'
   */
  stickTo: 'top',
  /**
   * If anchored to a single element, the id of that element.
   * @option
   * @type {string}
   * @default ''
   */
  anchor: '',
  /**
   * If using more than one element as anchor points, the id of the top anchor.
   * @option
   * @type {string}
   * @default ''
   */
  topAnchor: '',
  /**
   * If using more than one element as anchor points, the id of the bottom anchor.
   * @option
   * @type {string}
   * @default ''
   */
  btmAnchor: '',
  /**
   * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginTop: 1,
  /**
   * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
   * @option
   * @type {number}
   * @default 1
   */
  marginBottom: 1,
  /**
   * Breakpoint string that is the minimum screen size an element should become sticky.
   * @option
   * @type {string}
   * @default 'medium'
   */
  stickyOn: 'medium',
  /**
   * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
   * @option
   * @type {string}
   * @default 'sticky'
   */
  stickyClass: 'sticky',
  /**
   * Class applied to sticky container. Foundation defaults to `sticky-container`.
   * @option
   * @type {string}
   * @default 'sticky-container'
   */
  containerClass: 'sticky-container',
  /**
   * If true (by default), keep the sticky container the same height as the element. Otherwise, the container height is set once and does not change.
   * @option
   * @type {boolean}
   * @default true
   */
  dynamicHeight: true,
  /**
   * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
   * @option
   * @type {number}
   * @default -1
   */
  checkEvery: -1
};

/**
 * Helper function to calculate em values
 * @param Number {em} - number of em's to calculate into pixels
 */
function emCalc(em) {
  return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
}

export {Sticky};
