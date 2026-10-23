import $ from 'jquery';
import { Foundation } from './foundation.core';
import { MediaQuery } from './foundation.util.mediaQuery';
import { Plugin } from './foundation.core.plugin';
import { GetYoDigits } from './foundation.core.utils';
import { Triggers } from './foundation.util.triggers';
import { datasetOptions } from './foundation.util.dom';
import { Events } from './foundation.util.events';

/**
 * Interchange module.
 * @module foundation.interchange
 * @requires foundation.util.mediaQuery
 */

class Interchange extends Plugin {
  /**
   * Creates a new instance of Interchange.
   * @class
   * @name Interchange
   * @fires Interchange#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    this.$element = element;
    this.options = $.extend({}, Interchange.defaults, datasetOptions(element[0]), options);
    this.rules = [];
    this.currentPath = '';
    this.className = 'Interchange'; // ie9 back compat

    // Triggers init is idempotent, just need to make sure it is initialized
    Triggers.init($);

    this._init();
    this._events();
  }

  /**
   * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
   * @function
   * @private
   */
  _init() {
    MediaQuery._init();

    var element = this.$element[0];
    var id = element.id || GetYoDigits(6, 'interchange');
    // State attributes go through the native layer (7.0 line A, S12).
    element.setAttribute('data-resize', id);
    element.setAttribute('id', id);

    this._parseOptions();
    this._addBreakpoints();
    this._generateRules();
    this._reflow();
  }

  /**
   * Initializes events for Interchange.
   * @function
   * @private
   */
  _events() {
    // S12: the resizeme consumer flips to the native event layer; the
    // producer in the Triggers util has dispatched real element-local
    // events since S4, so this seam closes on the consumer half alone.
    const element = this.$element[0];
    Events.off(element, 'resizeme.zf.trigger');
    Events.on(element, 'resizeme.zf.trigger', () => this._reflow());
  }

  /**
   * Calls necessary functions to update Interchange upon DOM change
   * @function
   * @private
   */
  _reflow() {
    var match;

    // Iterate through each rule, but only save the last match
    for (var i in this.rules) {
      if(this.rules.hasOwnProperty(i)) {
        var rule = this.rules[i];
        if (window.matchMedia(rule.query).matches) {
          match = rule;
        }
      }
    }

    if (match) {
      this.replace(match.path);
    }
  }

  /**
   * Check options valifity and set defaults for:
   * - `data-interchange-type`: if set, enforce the type of replacement (auto, src, background or html)
   * @function
   * @private
   */
  _parseOptions() {
    var types = ['auto', 'src', 'background', 'html'];
    if (typeof this.options.type === 'undefined')
      this.options.type = 'auto';
    else if (types.indexOf(this.options.type) === -1) {
      console.warn(`Warning: invalid value "${this.options.type}" for Interchange option "type"`);
      this.options.type = 'auto';
    }
  }

  /**
   * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
   * @function
   * @private
   */
  _addBreakpoints() {
    for (var i in MediaQuery.queries) {
      if (MediaQuery.queries.hasOwnProperty(i)) {
        var query = MediaQuery.queries[i];
        Interchange.SPECIAL_QUERIES[query.name] = query.value;
      }
    }
  }

  /**
   * Checks the Interchange element for the provided media query + content pairings
   * @function
   * @private
   * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
   */
  _generateRules() {
    var rulesList = [];
    var rules;

    if (this.options.rules) {
      rules = this.options.rules;
    }
    else {
      // Read the attribute directly: identical to the former
      // `.data('interchange')` for every string rule list (the value is not
      // valid JSON, so jQuery's data parsing never converted it either).
      rules = this.$element[0].getAttribute('data-interchange');
    }

    rules =  typeof rules === 'string' ? rules.match(/\[.*?, .*?\]/g) : rules;

    for (var i in rules) {
      if(rules.hasOwnProperty(i)) {
        var rule = rules[i].slice(1, -1).split(', ');
        var path = rule.slice(0, -1).join('');
        var query = rule[rule.length - 1];

        if (Interchange.SPECIAL_QUERIES[query]) {
          query = Interchange.SPECIAL_QUERIES[query];
        }

        rulesList.push({
          path: path,
          query: query
        });
      }
    }

    this.rules = rulesList;
  }

  /**
   * Update the `src` property of an image, or change the HTML of a container, to the specified path.
   * @function
   * @param {String} path - Path to the image or HTML partial.
   * @fires Interchange#replaced
   */
  replace(path) {
    if (this.currentPath === path) return;

    var trigger = 'replaced.zf.interchange';
    var element = this.$element[0];

    var type = this.options.type;
    if (type === 'auto') {
      if (element.nodeName === 'IMG')
        type = 'src';
      else if (path.match(/\.(gif|jpe?g|png|svg|tiff)([?#].*)?/i))
        type = 'background';
      else
        type = 'html';
    }

    // Replacing images
    if (type === 'src') {
      // The M1 fix shape is kept byte-for-byte: a one-time load listener per
      // replace, so listeners stop accumulating across replaces (the S12
      // native form of the former `.one('load')`).
      element.setAttribute('src', path);
      Events.one(element, 'load', () => { this.currentPath = path; });
      Events.trigger(element, trigger);
    }
    // Replacing background images
    else if (type === 'background') {
      path = path.replace(/\(/g, '%28').replace(/\)/g, '%29');
      element.style.backgroundImage = 'url(' + path + ')';
      Events.trigger(element, trigger);
    }
    // Replacing HTML
    else if (type === 'html') {
      // Native fetch (7.0 line A, S14): the former `$.get(path, callback)`.
      // Error semantics aligned to the 6.x observed behavior: `$.get` only
      // called back on HTTP 2xx (its internal success filter), so a failure
      // was SILENT - no event, no state change, a console error from the
      // failed request itself. `fetch` resolves on any status, so `res.ok`
      // reproduces that filter: a non-2xx response drops the promise's
      // result exactly like the dropped jQuery callback (fetch additionally
      // logs its own failed-request console error, as jQuery did).
      fetch(path).then(res => {
        if (!res.ok) { return; }
        return res.text();
      }).then(response => {
        if (response === undefined) { return; }
        // Native html injection (7.0 line A, S12): the assignment re-parses
        // `response` in place, exactly like the former `.html()`.
        element.innerHTML = response;
        Events.trigger(element, trigger);
        // Initialize plugins in the inserted content (it is a re-parsed copy
        // of `response`, so initializing `$(response)` would hit detached nodes)
        Foundation.reflow(this.$element);
        this.currentPath = path;
      });
    }

    /**
     * Fires when content in an Interchange element is done being loaded.
     * @event Interchange#replaced
     */
    // this.$element.trigger('replaced.zf.interchange');
  }

  /**
   * Destroys an instance of interchange.
   * @function
   */
  _destroy() {
    // The resizeme consumer lives on the native event layer only now
    // (Equalizer S8 precedent for fully flipped consumers).
    Events.off(this.$element[0], 'resizeme.zf.trigger')
  }
}

/**
 * Default settings for plugin
 */
Interchange.defaults = {
  /**
   * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
   * @option
   * @type {?array}
   * @default null
   */
  rules: null,

  /**
   * Type of the responsive ressource to replace. It can take the following options:
   * - `auto` (default): choose the type according to the element tag or the ressource extension,
   * - `src`: replace the `[src]` attribute, recommended for images `<img>`.
   * - `background`: replace the `background-image` CSS property.
   * - `html`: replace the element content.
   * @option
   * @type {string}
   * @default 'auto'
   */
  type: 'auto'
};

Interchange.SPECIAL_QUERIES = {
  'landscape': 'screen and (orientation: landscape)',
  'portrait': 'screen and (orientation: portrait)',
  'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
};

export {Interchange};
