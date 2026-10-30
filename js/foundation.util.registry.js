/**
 * Instance registry for the jQuery-free plugin layer (7.0 line A, slice S1).
 *
 * Replaces the `$(el).data('zfPlugin')` instance store with point lookups on a
 * WeakMap. Keys are held weakly, so once a plugin is destroyed and every other
 * reference to its element is dropped, the whole entry can be garbage
 * collected — the same lifetime the jQuery data cache had.
 *
 * Scope note: discovery/enumeration of initialized elements is NOT a registry
 * concern and stays where it is today — on the `data-<name>` attribute, found
 * with `querySelectorAll('[data-<name>]')`. The registry only answers "does
 * this element have an instance, and which one?". A WeakMap cannot be
 * enumerated by design, but jQuery data was not enumerable either, so this
 * matches the v6 division of labor exactly.
 */
const instances = new WeakMap();

const Registry = {
  /**
   * Gets the plugin instance registered for an element.
   * @param {Element} el - the element to look up.
   * @returns {?Object} the registered instance, or undefined if there is none.
   */
  getInstance(el) {
    return instances.get(el);
  },

  /**
   * Registers the plugin instance for an element, replacing any previous one.
   * @param {Element} el - the element the instance belongs to.
   * @param {Object} instance - the plugin instance.
   * @returns {Object} the stored instance, for chaining.
   */
  setInstance(el, instance) {
    instances.set(el, instance);
    return instance;
  },

  /**
   * Whether an element currently has a registered instance.
   * @param {Element} el - the element to look up.
   * @returns {Boolean} true if an instance is registered for the element.
   */
  has(el) {
    return instances.has(el);
  },

  /**
   * Removes the entry for an element (used on the plugin destroy path).
   * @param {Element} el - the element to unregister.
   * @returns {Boolean} true if an entry existed and was removed.
   */
  removeInstance(el) {
    return instances.delete(el);
  }
}

export {Registry};
