import { GetYoDigits } from './foundation.core.utils';
import { Registry } from './foundation.util.registry';
import { Events } from './foundation.util.events';
import { MediaQuery } from './foundation.util.mediaQuery';

var FOUNDATION_VERSION = '7.0.0-beta.1';

// Global Foundation object
// This is attached to the window, or used as a module for AMD/Browserify
var Foundation = {
  version: FOUNDATION_VERSION,

  /**
   * Stores initialized plugins.
   */
  _plugins: {},

  /**
   * Stores generated unique ids for plugin instances
   */
  _uuids: [],

  /**
   * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
   * @param {Object} plugin - The constructor of the plugin.
   */
  plugin: function(plugin, name) {
    // Object key to use when adding to global Foundation object
    // Examples: Foundation.Reveal, Foundation.OffCanvas
    var className = (name || functionName(plugin));
    // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
    // Examples: data-reveal, data-off-canvas
    var attrName  = hyphenate(className);

    // Add to the Foundation object and the plugins list (for reflowing)
    this._plugins[attrName] = this[className] = plugin;
  },
  /**
   * @function
   * Populates the _uuids array with pointers to each individual plugin instance.
   * Adds the `data-<name>` attribute to programmatically created plugins.
   * Also fires the initialization event for each plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @param {String} name - the name of the plugin, passed as a camelCased string.
   * @fires Plugin#init
   */
  registerPlugin: function(plugin, name){
    var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
    plugin.uuid = GetYoDigits(6, pluginName);

    // 7.0 terminal form: the element write, the Registry entry and the
    // real, bubbling init event (the Plugin base class does the same).
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    if(!el.getAttribute(`data-${pluginName}`)){ el.setAttribute(`data-${pluginName}`, plugin.uuid); }
    if(el && !Registry.has(el)){ Registry.setInstance(el, plugin); }
          /**
           * Fires when the plugin has initialized.
           * @event Plugin#init
           */
    Events.trigger(el, `init.zf.${pluginName}`);

    this._uuids.push(plugin.uuid);

    return;
  },
  /**
   * @function
   * Removes the plugins uuid from the _uuids array.
   * Removes the identifying data attribute and the stored Registry entry.
   * Also fires the destroyed event for the plugin, consolidating repetitive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#destroyed
   */
  unregisterPlugin: function(plugin){
    var el = plugin.$element && plugin.$element.nodeType === 1 ? plugin.$element : plugin.$element[0];
    var pluginName = hyphenate(functionName(Registry.getInstance(el).constructor));

    this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
    el.removeAttribute(`data-${pluginName}`);
    Registry.removeInstance(el)
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    Events.trigger(el, `destroyed.zf.${pluginName}`);
    for(var prop in plugin){
      if(typeof plugin[prop] === 'function'){
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
    }
    return;
  },

  /**
   * @function
   * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
   * @param {Element|String|Array} plugins - a native element (or, legacy, a jQuery collection) holding the plugin, a string of a plugin class i.e. `'dropdown'`, or an array of such strings.
   * @default If no argument is passed, reflow all currently active plugins.
   */
   reInit: function(plugins){
     // 7.0 terminal form: an element (or a collection, legacy shape) holds
     // the instance to re-init; strings name plugin classes to sweep.
     var isElement = typeof Element !== 'undefined' && plugins instanceof Element;
     var isCollection = !isElement && plugins && plugins.nodeType === undefined && plugins.length !== undefined && typeof plugins !== 'string';
     try{
       if(isElement || isCollection){
         var elements = isElement ? [plugins] : Array.from(plugins);
         elements.forEach(function(el){
           var instance = Registry.getInstance(el);
           if (instance) { instance._init(); }
         });
       }else{
         var type = typeof plugins,
         _this = this;
         var reInitByName = function(name) {
           document.querySelectorAll('[data-'+ name +']').forEach(function(el) {
             var instance = Registry.getInstance(el);
             if (instance) { instance._init(); }
           });
         };
         if (type === 'object' && plugins && plugins.forEach) {
           plugins.forEach(function(p){
             reInitByName(hyphenate(p));
           });
         } else if (type === 'string') {
           reInitByName(hyphenate(plugins));
         } else {
           Object.keys(_this._plugins).forEach(reInitByName);
         }
       }
     }catch(err){
       console.error(err);
     }finally{
       return plugins;
     }
   },

  /**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Element|Document|String|Object} elem - native element or document to scan, a selector string, or (legacy, mixed state) a jQuery object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
  reflow: function(elem, plugins) {

    // If plugins is undefined, just grab everything
    if (typeof plugins === 'undefined') {
      plugins = Object.keys(this._plugins);
    }
    // If plugins is a string, convert it to an array with one item
    else if (typeof plugins === 'string') {
      plugins = [plugins];
    }

    var _this = this;

    // 7.0 terminal form: the root accepts an element, the document, a
    // selector string or (legacy) a collection - unwrapped to elements. The
    // scan stays on the `data-<name>` attribute: v6's find + addBack is the
    // subtree plus the root itself (the document root never matches itself).
    var rootEls;
    if (typeof elem === 'string') {
      rootEls = Array.from(document.querySelectorAll(elem));
    } else if (elem && elem.nodeType === 1) {
      rootEls = [elem];
    } else if (elem && elem.nodeType === 9) {
      rootEls = null; // document: search everything
    } else if (elem && elem.length !== undefined) {
      rootEls = Array.from(elem);
    } else {
      rootEls = null;
    }

    // Iterate through each plugin
    plugins.forEach(function(name) {
      // Get the current plugin
      var plugin = _this._plugins[name];

      // Localize the search to all elements inside elem, as well as elem itself
      var candidates;
      if (rootEls === null) {
        candidates = Array.from(document.querySelectorAll('[data-'+name+']'));
      } else {
        candidates = [];
        rootEls.forEach(function(rootEl) {
          candidates.push(...Array.from(rootEl.querySelectorAll('[data-'+name+']')));
          if (rootEl.matches('[data-'+name+']')) { candidates.push(rootEl); }
        });
      }
      var unregistered = candidates.filter(function (el) {
        return typeof Registry.getInstance(el) === 'undefined';
      });

      // For each plugin found, initialize it
      unregistered.forEach(function(el) {
        var opts = { reflow: true };

        if(el.getAttribute('data-options')){
          el.getAttribute('data-options').split(';').forEach(function(option){
            var opt = option.split(':').map(function(part){ return part.trim(); });
            if(opt[0]) opts[opt[0]] = parseValue(opt[1]);
          });
        }
        try{
          Registry.setInstance(el, new plugin(el, opts));
        }catch(er){
          console.error(er);
        }
      });
    });
  },
  getFnName: functionName,

  /**
   * Initializes Foundation: primes the MediaQuery layer, removes the
   * `no-js` class and reflows (constructs) every plugin found under `root`.
   * @function
   * @param {Element|Document|String} [root=document] - where to scan for plugins: an element, the document, or a selector string.
   * @returns {Element|Document|String} the root that was initialized.
   */
  init: function(root) {
    root = root || document;

    document.querySelectorAll('.no-js').forEach(function(el) {
      el.classList.remove('no-js');
    });

    MediaQuery._init();
    Foundation.reflow(root);
    return root;
  },

};

Foundation.util = {
  /**
   * Function for applying a debounce effect to a function call.
   * @function
   * @param {Function} func - Function to be called at end of timeout.
   * @param {Number} delay - Time in ms to delay the call of `func`.
   * @returns function
   */
  throttle: function (func, delay) {
    var timer = null;

    return function () {
      var context = this, args = arguments;

      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
};

window.Foundation = Foundation;

// Polyfill to get the name of a function in IE9
function functionName(fn) {
  if (typeof Function.prototype.name === 'undefined') {
    var funcNameRegex = /function\s([^(]{1,})\(/;
    var results = (funcNameRegex).exec((fn).toString());
    return (results && results.length > 1) ? results[1].trim() : "";
  }
  else if (typeof fn.prototype === 'undefined') {
    return fn.constructor.name;
  }
  else {
    return fn.prototype.constructor.name;
  }
}
function parseValue(str){
  if ('true' === str) return true;
  else if ('false' === str) return false;
  else if (!isNaN(str * 1)) return parseFloat(str);
  return str;
}
// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export {Foundation};
