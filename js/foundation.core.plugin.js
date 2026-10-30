import { GetYoDigits } from './foundation.core.utils';
import { Registry } from './foundation.util.registry';
import { Events } from './foundation.util.events';

// Abstract class for providing lifecycle hooks. Expect plugins to define AT LEAST
// {function} _setup (replaces previous constructor),
// {function} _destroy (replaces previous destroy)
//
// 7.0 line A, slice S2: instance storage moved from the `zfPlugin` jQuery data
// entry to the Registry (WeakMap).
// 7.0 line A, slice S15: the base accepts the native element the 7.0
// constructor contract carries as well as the jQuery collection the mixed
// state still feeds it (core reflow), and the `init.zf`/`destroyed.zf`
// obligation events go through the native event layer as real, bubbling
// events - the still-on-jQuery listeners keep receiving them (white
// absorption), so the obligation is unchanged for every consumer shape.
class Plugin {

  constructor(element, options) {
    this._setup(element, options);
    var pluginName = getPluginName(this);
    this.uuid = GetYoDigits(6, pluginName);

    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    if(!el.getAttribute(`data-${pluginName}`)){ el.setAttribute(`data-${pluginName}`, this.uuid); }
    if(el && !Registry.has(el)){ Registry.setInstance(el, this); }
    /**
     * Fires when the plugin has initialized.
     * @event Plugin#init
     */
    Events.trigger(el, `init.zf.${pluginName}`);
  }

  destroy() {
    this._destroy();
    var pluginName = getPluginName(this);
    var el = this.$element.nodeType === 1 ? this.$element : this.$element[0];
    el.removeAttribute(`data-${pluginName}`);
    if(el){ Registry.removeInstance(el); }
    /**
     * Fires when the plugin has been destroyed.
     * @event Plugin#destroyed
     */
    Events.trigger(el, `destroyed.zf.${pluginName}`);
    for(var prop in this){
      if (this.hasOwnProperty(prop)) {
        this[prop] = null; //clean up script to prep for garbage collection.
      }
    }
  }
}

// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getPluginName(obj) {
  return hyphenate(obj.className);
}

export {Plugin};
