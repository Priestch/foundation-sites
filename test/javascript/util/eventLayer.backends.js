// Dual-column differential test backends (7.0 line A).
//
// The same behavior spec (eventLayer.spec.js) runs twice: once against a
// test-only adapter backed by jQuery — the golden master pinning today's
// semantics — and once against the native FoundationNext layer from slice
// S1. Both green means the native layer is behaviorally equivalent on every
// case the library actually exercises.
//
// This file is test infrastructure only: no js/ library file imports jQuery.

(function(global, $) {
  function makeJQueryBackend() {
    return {
      name: 'jQuery',

      on(el, types, fn) {
        $(el).on(types, fn);
      },

      off(el, types, fn) {
        if (types == null) {
          $(el).off();
        } else {
          $(el).off(types, fn);
        }
      },

      one(el, types, fn) {
        $(el).one(types, fn);
      },

      trigger(el, types, params) {
        $(el).trigger(types, params);
      },

      triggerHandler(el, types, params) {
        return $(el).triggerHandler(types, params);
      },

      delegate(root, types, selector, fn) {
        $(root).on(types, selector, fn);
      },

      registry: {
        getInstance(el) {
          return $(el).data('zfPlugin');
        },

        setInstance(el, instance) {
          $(el).data('zfPlugin', instance);
          return instance;
        },

        has(el) {
          return $(el).data('zfPlugin') !== undefined;
        },

        removeInstance(el) {
          $(el).removeData('zfPlugin');
        }
      },

      helpers: {
        // jQuery's :visible (the wide semantics).
        visible(el) {
          return $(el).is(':visible');
        },

        q(sel, ctx) {
          return $(sel, ctx).get(0);
        },

        // Reads through jQuery's own .data() so both columns assert the
        // same jQuery-style value conversion (decided 2026-10-22). The
        // result is copied so callers cannot mutate jQuery's data cache.
        datasetOptions(el) {
          return $.extend({}, $(el).data());
        }
      }
    };
  }

  function makeNativeBackend() {
    const Events = global.FoundationNext.Events;
    const Registry = global.FoundationNext.Registry;
    const Dom = global.FoundationNext.Dom;

    return {
      name: 'native (FoundationNext)',

      on: Events.on,
      off: Events.off,
      one: Events.one,
      trigger: Events.trigger,
      triggerHandler: Events.triggerHandler,
      delegate: Events.delegate,

      registry: {
        getInstance: Registry.getInstance,
        setInstance: Registry.setInstance,
        has: Registry.has,
        removeInstance: Registry.removeInstance
      },

      helpers: Dom
    };
  }

  global.FoundationEventBackends = {
    jquery: makeJQueryBackend,
    next: makeNativeBackend
  };
})(window, jQuery);
