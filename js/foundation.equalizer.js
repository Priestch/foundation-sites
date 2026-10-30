import { MediaQuery } from './foundation.util.mediaQuery';
import { onImagesLoaded } from './foundation.util.imageLoader';
import { GetYoDigits } from './foundation.core.utils';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Plugin } from './foundation.core.plugin';

/**
 * Equalizer module.
 * @module foundation.equalizer
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.imageLoader if equalizer contains images
 */

class Equalizer extends Plugin {
  /**
   * Creates a new instance of Equalizer.
   * @class
   * @name Equalizer
   * @fires Equalizer#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options){
    // 7.0 line A terminal form: the element (either constructor shape).
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options  = deepMerge({}, Equalizer.defaults, datasetOptions(this.$element), options);
    this.className = 'Equalizer'; // ie9 back compat

    this._init();
  }

  /**
   * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  _init() {
    var eqId = this.$element.getAttribute('data-equalizer') || '';
    var watched = Array.from(this.$element.querySelectorAll(`[data-equalizer-watch="${eqId}"]`));

    MediaQuery._init();

    this.$watched = watched.length ? watched : Array.from(this.$element.querySelectorAll('[data-equalizer-watch]'));
    // State attributes go through the native layer (7.0 line A, S8).
    this.$element.setAttribute('data-resize', (eqId || GetYoDigits(6, 'eq')));
    this.$element.setAttribute('data-mutate', (eqId || GetYoDigits(6, 'eq')));

    this.hasNested = this.$element.querySelectorAll('[data-equalizer]').length > 0;
    // jQuery parentsUntil(document.body, sel): the ancestors strictly below
    // body matching the selector
    this.isNested = (function() {
      var p = this.$element.parentElement;
      while (p && p !== document.body) {
        if (p.matches('[data-equalizer]')) { return true; }
        p = p.parentElement;
      }
      return false;
    }).call(this);
    this.isOn = false;
    this._bindHandler = {
      onResizeMeBound: this._onResizeMe.bind(this),
      onPostEqualizedBound: this._onPostEqualized.bind(this),
      onCheckMQBound: this._checkMQ.bind(this)
    };

    var imgs = this.$element.querySelectorAll('img');
    var tooSmall;
    if(this.options.equalizeOn){
      tooSmall = this._checkMQ();
      // S13 flip: MediaQuery produces 'changed.zf.mediaquery' as a real
      // bubbling window event on the native layer now, so this consumer
      // binds there (equalizer/tabs/responsiveToggle/responsiveMenu/
      // responsiveAccordionTabs/offcanvas all flipped with the producer in
      // the same move).
      Events.on(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    }else{
      this._events();
    }
    if((typeof tooSmall !== 'undefined' && tooSmall === false) || typeof tooSmall === 'undefined'){
      if(imgs.length){
        onImagesLoaded(imgs, this._reflow.bind(this));
      }else{
        this._reflow();
      }
    }
  }

  /**
   * Removes event listeners if the breakpoint is too small.
   * @private
   */
  _pauseEvents() {
    this.isOn = false;
    // Native side: the mediaquery consumer (S13 flip), the resizeme and
    // mutateme consumers (S4 producers) and the equalizer lifecycle
    // listeners drop in one pass each. The mutateme consumer flipped
    // together with its last producers in the S10 group flip (Tabs forward,
    // ResponsiveToggle animated half).
    Events.off(window, 'changed.zf.mediaquery', this._bindHandler.onCheckMQBound);
    Events.off(this.$element, 'mutateme.zf.trigger resizeme.zf.trigger .zf.equalizer');
  }

  /**
   * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
   * @private
   */
  _onResizeMe() {
    this._reflow();
  }

  /**
   * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
   * @private
   */
  _onPostEqualized(e) {
    if(e.target !== this.$element){ this._reflow(); }
  }

  /**
   * Initializes events for Equalizer.
   * @private
   */
  _events() {
    this._pauseEvents();
    if(this.hasNested){
      // S8: the postequalized consumer flips together with its producer
      // (applyHeight below) in the same commit - both sides of the nested
      // equalizer chain live on the native event layer now.
      Events.on(this.$element, 'postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
    }else{
      // S8: the resizeme consumer flips to the native event layer; the
      // producer in the Triggers util has dispatched real element-local
      // events since S4, so this seam closes on the consumer half alone.
      Events.on(this.$element, 'resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
      // S10 group flip: the mutateme consumer joins the native event layer
      // together with its last jQuery-synthesized producers - the Tabs
      // forward and the ResponsiveToggle animated half flip in the same
      // commit, so every element listens on exactly one side and nothing
      // double-fires.
      Events.on(this.$element, 'mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
    }
    this.isOn = true;
  }

  /**
   * Checks the current breakpoint to the minimum required size.
   * @private
   */
  _checkMQ() {
    var tooSmall = !MediaQuery.is(this.options.equalizeOn);
    if(tooSmall){
      if(this.isOn){
        this._pauseEvents();
        this.$watched.forEach(el => { el.style.height = 'auto'; });
      }
    }else{
      if(!this.isOn){
        this._events();
      }
    }
    return tooSmall;
  }

  /**
   * A noop version for the plugin
   * @private
   */
  _killswitch() {
    return;
  }

  /**
   * Calls necessary functions to update Equalizer upon DOM change
   * @private
   */
  _reflow() {
    if(!this.options.equalizeOnStack){
      if(this._isStacked()){
        this.$watched.forEach(el => { el.style.height = 'auto'; });
        return false;
      }
    }
    if (this.options.equalizeByRow) {
      this.getHeightsByRow(this.applyHeightByRow.bind(this));
    }else{
      this.getHeights(this.applyHeight.bind(this));
    }
  }

  /**
   * Manually determines if the first 2 elements are *NOT* stacked.
   * @private
   */
  _isStacked() {
    if (!this.$watched[0] || !this.$watched[1]) {
      return true;
    }
    return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
  }

  /**
   * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
   * @param {Function} cb - A non-optional callback to return the heights array to.
   * @returns {Array} heights - An array of heights of children within Equalizer container
   */
  getHeights(cb) {
    var heights = [];
    for(var i = 0, len = this.$watched.length; i < len; i++){
      this.$watched[i].style.height = 'auto';
      heights.push(this.$watched[i].offsetHeight);
    }
    cb(heights);
  }

  /**
   * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
   * @param {Function} cb - A non-optional callback to return the heights array to.
   * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
   */
  getHeightsByRow(cb) {
    // jQuery offset(): document-coordinates top of the first watched item
    var lastElTopOffset = (this.$watched.length ? this.$watched[0].getBoundingClientRect().top + window.pageYOffset : 0),
        groups = [],
        group = 0;
    //group by Row
    groups[group] = [];
    for(var i = 0, len = this.$watched.length; i < len; i++){
      this.$watched[i].style.height = 'auto';
      //maybe could use this.$watched[i].offsetTop
      var elOffsetTop = this.$watched[i].getBoundingClientRect().top + window.pageYOffset;
      if (elOffsetTop !== lastElTopOffset) {
        group++;
        groups[group] = [];
        lastElTopOffset=elOffsetTop;
      }
      groups[group].push([this.$watched[i],this.$watched[i].offsetHeight]);
    }

    for (var j = 0, ln = groups.length; j < ln; j++) {
      var heights = groups[j].map(function(item){ return item[1]; });
      var max         = Math.max.apply(null, heights);
      groups[j].push(max);
    }
    cb(groups);
  }

  /**
   * Changes the CSS height property of each child in an Equalizer parent to match the tallest
   * @param {array} heights - An array of heights of children within Equalizer container
   * @fires Equalizer#preequalized
   * @fires Equalizer#postequalized
   */
  applyHeight(heights) {
    var max = Math.max.apply(null, heights);
    /**
     * Fires before the heights are applied
     * @event Equalizer#preequalized
     */
    Events.trigger(this.$element, 'preequalized.zf.equalizer');

    this.$watched.forEach(el => { el.style.height = max + 'px'; });

    /**
     * Fires when the heights have been applied
     * @event Equalizer#postequalized
     */
     Events.trigger(this.$element, 'postequalized.zf.equalizer');
  }

  /**
   * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
   * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
   * @fires Equalizer#preequalized
   * @fires Equalizer#preequalizedrow
   * @fires Equalizer#postequalizedrow
   * @fires Equalizer#postequalized
   */
  applyHeightByRow(groups) {
    /**
     * Fires before the heights are applied
     */
    Events.trigger(this.$element, 'preequalized.zf.equalizer');
    for (var i = 0, len = groups.length; i < len ; i++) {
      var groupsILength = groups[i].length,
          max = groups[i][groupsILength - 1];
      if (groupsILength<=2) {
        groups[i][0][0].style.height = 'auto';
        continue;
      }
      /**
        * Fires before the heights per row are applied
        * @event Equalizer#preequalizedrow
        */
      Events.trigger(this.$element, 'preequalizedrow.zf.equalizer');
      for (var j = 0, lenJ = (groupsILength-1); j < lenJ ; j++) {
        groups[i][j][0].style.height = max + 'px';
      }
      /**
        * Fires when the heights per row have been applied
        * @event Equalizer#postequalizedrow
        */
      Events.trigger(this.$element, 'postequalizedrow.zf.equalizer');
    }
    /**
     * Fires when the heights have been applied
     */
     Events.trigger(this.$element, 'postequalized.zf.equalizer');
  }

  /**
   * Destroys an instance of Equalizer.
   * @function
   */
  _destroy() {
    this._pauseEvents();
    this.$watched.forEach(el => { el.style.height = 'auto'; });
  }
}

/**
 * Default settings for plugin
 */
Equalizer.defaults = {
  /**
   * Enable height equalization when stacked on smaller screens.
   * @option
   * @type {boolean}
   * @default false
   */
  equalizeOnStack: false,
  /**
   * Enable height equalization row by row.
   * @option
   * @type {boolean}
   * @default false
   */
  equalizeByRow: false,
  /**
   * String representing the minimum breakpoint size the plugin should equalize heights on.
   * @option
   * @type {string}
   * @default ''
   */
  equalizeOn: ''
};

export {Equalizer};
