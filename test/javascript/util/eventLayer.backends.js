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

        // Reads the raw attribute strings. jQuery .data() cannot be used
        // here: it coerces "true"/"123", which would contradict the
        // no-coercion semantics this suite pins for both columns.
        datasetOptions(el) {
          const options = {};
          if (!el || el.nodeType !== 1) { return options; }
          $.each(el.attributes, function(index, attr) {
            if (attr.name.indexOf('data-') === 0) {
              options[camelCase(attr.name.slice(5))] = attr.value;
            }
          });
          return options;
        }
      }
    };
  }

  function camelCase(name) {
    return name.replace(/-([a-z])/g, function(match, char) {
      return char.toUpperCase();
    });
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
