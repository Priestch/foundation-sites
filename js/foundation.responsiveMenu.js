import $ from 'jquery';

import { MediaQuery } from './foundation.util.mediaQuery';
import { GetYoDigits } from './foundation.core.utils';
import { Plugin } from './foundation.core.plugin';

import { DropdownMenu } from './foundation.dropdownMenu';
import { Drilldown } from './foundation.drilldown';
import { AccordionMenu } from './foundation.accordionMenu';

let MenuPlugins = {
  dropdown: {
    cssClass: 'dropdown',
    plugin: DropdownMenu
  },
 drilldown: {
    cssClass: 'drilldown',
    plugin: Drilldown
  },
  accordion: {
    cssClass: 'accordion-menu',
    plugin: AccordionMenu
  }
};

  // import "foundation.util.triggers.js";


/**
 * ResponsiveMenu module.
 * @module foundation.responsiveMenu
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */

// 7.0 line A, slice S11: the wrapper itself runs on the native layer. The
// mq switch is an explicit destroy+rebuild of the sub-plugin on the same
// element - all three sub-plugins (DropdownMenu, AccordionMenu, Drilldown)
// are native since S9 and register their own instance/attrs beside the
// wrapper's, like the 6.x zfPlugin guard let them.
class ResponsiveMenu extends Plugin {
  /**
   * Creates a new instance of a responsive menu.
   * @class
   * @name ResponsiveMenu
   * @fires ResponsiveMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element) {
    this.$element = $(element);
    this.rules = this.$element.data('responsive-menu');
    this.currentMq = null;
    this.currentPlugin = null;
    this.className = 'ResponsiveMenu'; // ie9 back compat

    this._init();
    this._events();
  }

  /**
   * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
   * @function
   * @private
   */
  _init() {

    MediaQuery._init();
    // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
    if (typeof this.rules === 'string') {
      let rulesTree = {};

      // Parse rules from "classes" pulled from data attribute
      let rules = this.rules.split(' ');

      // Iterate through every rule found
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i].split('-');
        let ruleSize = rule.length > 1 ? rule[0] : 'small';
        let rulePlugin = rule.length > 1 ? rule[1] : rule[0];

        if (MenuPlugins[rulePlugin] !== null) {
          rulesTree[ruleSize] = MenuPlugins[rulePlugin];
        }
      }

      this.rules = rulesTree;
    }

    if (!$.isEmptyObject(this.rules)) {
      this._checkMediaQueries();
    }
    // Add data-mutate since children may need it.
    if (!this.$element[0].getAttribute('data-mutate')) {
      this.$element[0].setAttribute('data-mutate', GetYoDigits(6, 'responsive-menu'));
    }
  }

  /**
   * Initializes events for the Menu.
   * @function
   * @private
   */
  _events() {
    // Seam (S11): 'changed.zf.mediaquery' is synthesized through jQuery by
    // the MediaQuery watcher - mediaQuery is not migrated yet and a jQuery
    // trigger() cannot produce a real event - so this consumer stays on the
    // jQuery side until the MediaQuery slice flips both sides in one move
    // (ResponsiveToggle/OffCanvas/Equalizer/Tabs precedent).
    this._changedZfMediaQueryHandler = this._checkMediaQueries.bind(this);
    $(window).on('changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }

  /**
   * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
   * @function
   * @private
   */
  _checkMediaQueries() {
    var matchedMq = null;
    var element = this.$element[0];

    // Iterate through each rule and find the last matching rule
    Object.keys(this.rules).forEach(function(key) {
      if (MediaQuery.atLeast(key)) {
        matchedMq = key;
      }
    });

    // No match? No dice
    if (!matchedMq) return;

    // Plugin already initialized? We good
    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

    // Remove existing plugin-specific CSS classes
    Object.keys(MenuPlugins).forEach(function(key) {
      element.classList.remove(MenuPlugins[key].cssClass);
    });

    // Add the CSS class for the new plugin
    element.classList.add(this.rules[matchedMq].cssClass);

    // The swap is destroy + construct: the outgoing sub-plugin runs its own
    // destroy (listeners, feather, wrapper - each S9 plugin cleans its own
    // layer), then the new type is built on the same element.
    if (this.currentPlugin) this.currentPlugin.destroy();
    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
  }

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  _destroy() {
    if (this.currentPlugin) this.currentPlugin.destroy();
    $(window).off('changed.zf.mediaquery', this._changedZfMediaQueryHandler);
  }
}

ResponsiveMenu.defaults = {};

export {ResponsiveMenu};
