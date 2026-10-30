import { Motion } from './foundation.util.motion';
import { Events } from './foundation.util.events';

// S13 (7.0 line A): the window-level listeners (resize/scroll debounce,
// closeme broadcast) run on the native event layer. The closeme producers
// (reveal/dropdown/tooltip) fire real events through Events.trigger in the
// same slice, and the listener is registered per plugin name so the name is
// an explicit parameter - the 6.x derivation from the jQuery event
// namespace does not exist on real events. Still-on-jQuery producers (third
// parties) keep reaching the element-level dispatchers through real-event
// pass-through; a jQuery-synthesized window event can no longer drive the
// window-level listeners (jQuery triggers produce no real events).
// dispatchLocal keeps its jQuery half until the wrap-up slice deletes it
// (S4 clause), and closeableListener's fadeOut fx chain stays jQuery-side
// (same ledger as the accordion fx).

const triggers = (el, type) => {
  (el.getAttribute(`data-${type}`) || '').split(' ').forEach(id => {
    let target = document.getElementById(id);
    if (!target) { return; }
    // Historical forms: 'close' bubbles (so it can close a parent component),
    // 'open' and 'toggle' stay element-local.
    if (type === 'close') {
      // One real, bubbling event: reaches native listeners and the document
      // closable delegation, plus the jQuery listeners of un-migrated plugins
      // (white absorption).
      Events.trigger(target, `${type}.zf.trigger`, [el]);
    } else {
      dispatchLocal(target, `${type}.zf.trigger`, el);
    }
  });
};

// Element-local dispatch (S4 ruling, terminal form): the last mixed-state
// consumers are gone, so the dual transport collapses to the native
// triggerHandler alone - a real NON-BUBBLING event (the shared transport
// between the per-bundle Events tables; same-element listeners only, the
// 6.x no-bubble shape). Still-on-jQuery third-party listeners no longer
// receive the element-local zf.trigger dispatches - 7.0 change, ledger.
const dispatchLocal = (target, type, param) => {
  Events.triggerHandler(target, type, [param]);
};

var Triggers = {
  Listeners: {
    Basic: {},
    Global: {}
  },
  Initializers: {}
}

// Module-level flag (S4): was `$.triggersInitialized`, a property hung on the
// jQuery namespace. Same one-shot semantics, no jQuery dependency.
let triggersInitialized = false;

Triggers.Listeners.Basic  = {
  openListener: function() {
    triggers(this, 'open');
  },
  closeListener: function() {
    let id = this.getAttribute('data-close');
    if (id) {
      triggers(this, 'close');
    }
    else {
      Events.trigger(this, 'close.zf.trigger');
    }
  },
  toggleListener: function() {
    let id = this.getAttribute('data-toggle');
    if (id) {
      triggers(this, 'toggle');
    } else {
      Events.trigger(this, 'toggle.zf.trigger');
    }
  },
  closeableListener: function(e) {
    let animation = this.getAttribute('data-closable');

    // Only close the first closable element. See https://git.io/zf-7833
    e.stopPropagation();

    if(animation !== ''){
      Motion.animateOut(this, animation, () => {
        Events.trigger(this, 'closed.zf');
      });
    }else{
      // fx 方案 A: the plain fadeOut on the native primitive (jQuery's fx
      // default duration, 400ms). The closed.zf production keeps its jQuery
      // transport (the S4 dual-transport seam owns it).
      Motion.fadeOut(this, 400);
      // 7.0: the closed production joins the native layer - a real,
      // bubbling event (6.x delivered a jQuery-synthetic one to jQuery
      // listeners only; both shapes reach jQuery listeners now).
      Events.trigger(this, 'closed.zf');
    }
  },
  toggleFocusListener: function() {
    let id = this.getAttribute('data-toggle-focus');
    let target = document.getElementById(id);
    if (target) {
      dispatchLocal(target, 'toggle.zf.trigger', this);
    }
  }
};

// Elements with [data-open] will reveal a plugin that supports it when clicked.
// The former off-then-on dup guard is replaced by module-level flags: once an
// Initializer has installed its delegation, repeated calls (Foundation re-init,
// third parties, IHearYou) are no-ops, so one click still yields one dispatch.
let simpleListenerFlags = {};

function delegateSimple(type, types, selector, listener) {
  if (simpleListenerFlags[type]) { return; }
  simpleListenerFlags[type] = true;
  Events.delegate(document, types, selector, listener);
}

Triggers.Initializers.addOpenListener = () => {
  delegateSimple('open', 'click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
}

// Elements with [data-close] will close a plugin that supports it when clicked.
// If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
Triggers.Initializers.addCloseListener = () => {
  delegateSimple('close', 'click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
}

// Elements with [data-toggle] will toggle a plugin that supports it when clicked.
Triggers.Initializers.addToggleListener = () => {
  delegateSimple('toggle', 'click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
}

// Elements with [data-closable] will respond to close.zf.trigger events.
Triggers.Initializers.addCloseableListener = () => {
  delegateSimple('closeable', 'close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
}

// Elements with [data-toggle-focus] will respond to coming in and out of focus
Triggers.Initializers.addToggleFocusListener = () => {
  delegateSimple('toggleFocus', 'focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
}



// More Global/complex listeners and triggers
Triggers.Listeners.Global  = {
  closeMeListener: function(e, pluginId, pluginName){
    // S13: the plugin name is an explicit parameter - the listener is
    // registered once per name (the 6.x single jQuery listener derived it
    // from the event namespace, which real events do not carry) - and the
    // id rides the event detail, where Events.trigger puts the extra
    // parameters (the 6.x second trigger parameter).
    let plugin = pluginName || (e.namespace ? e.namespace.split('.')[0] : 'dropdown');
    let plugins = document.querySelectorAll(`[data-${plugin}]`);

    for (let i = 0; i < plugins.length; i++) {
      let node = plugins[i];
      if (node.getAttribute('data-yeti-box') !== `${pluginId}`) {
        // Native broadcast: reaches the plugin's own listeners whether they
        // are already native (Events.on) or still jQuery (real-event
        // pass-through). The forwarded parameter is already the final-form
        // native element.
        Events.trigger(node, 'close.zf.trigger', [node]);
      }
    }
  }
}

// Global, parses whole document.
Triggers.Initializers.addClosemeListener = function(pluginName) {
  var yetiBoxes = document.querySelectorAll('[data-yeti-box]'),
      plugNames = ['dropdown', 'tooltip', 'reveal'];

  if(pluginName){
    if(typeof pluginName === 'string'){
      plugNames.push(pluginName);
    }else if(typeof pluginName === 'object' && typeof pluginName[0] === 'string'){
      plugNames = plugNames.concat(pluginName);
    }else{
      console.error('Plugin names must be strings');
    }
  }
  if(yetiBoxes.length){
    // Native side (S13): the producers below fire real events through the
    // Events layer in the same slice. One listener per name keeps the name
    // explicit, and the 6.x off-then-on shape is kept so every arm call
    // leaves exactly one fresh listener set behind (self-healing: a later
    // initializer call rebuilds the window listeners whatever happened to
    // the previous ones).
    let listeners = plugNames.map((name) => `closeme.zf.${name}`).join(' ');
    Events.off(window, listeners);
    plugNames.forEach((name) => {
      Events.on(window, `closeme.zf.${name}`, function(e, pluginId) {
        Triggers.Listeners.Global.closeMeListener(e, pluginId, name);
      });
    });
  }
}

function debounceGlobalListener(debounce, trigger, listener) {
  let timer;
  // Native side (S13): real resize/scroll events reach the listener through
  // the Events layer.
  Events.on(window, trigger, function() {
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(listener, debounce || 10); //default time to emit scroll event
  });
}

Triggers.Initializers.addResizeListener = function(debounce){
  // Snapshot at registration time, as before: elements added later receive
  // nothing (6.x limitation, kept by decision - a ResizeObserver rework is a
  // separate, behavior-changing slice).
  let nodes = document.querySelectorAll('[data-resize]');
  if(nodes.length){
    debounceGlobalListener(debounce, 'resize.zf.trigger', function() {
      for (let i = 0; i < nodes.length; i++) {
        Events.trigger(nodes[i], 'resizeme.zf.trigger', [nodes[i]]);
      }
    });
  }
}

Triggers.Initializers.addScrollListener = function(debounce){
  let nodes = document.querySelectorAll('[data-scroll]');
  if(nodes.length){
    debounceGlobalListener(debounce, 'scroll.zf.trigger', function() {
      for (let i = 0; i < nodes.length; i++) {
        Events.trigger(nodes[i], 'scrollme.zf.trigger', [nodes[i], window.pageYOffset]);
      }
    });
  }
}

Triggers.Initializers.addSimpleListeners = function() {
  Triggers.Initializers.addOpenListener();
  Triggers.Initializers.addCloseListener();
  Triggers.Initializers.addToggleListener();
  Triggers.Initializers.addCloseableListener();
  Triggers.Initializers.addToggleFocusListener();
}

Triggers.Initializers.addGlobalListeners = function() {
  // The MutationObserver-based mutation listener is gone (S4): resize/scroll
  // dispatch to their elements directly and no 'data-events' attribute is
  // written anymore. 'mutateme.zf.trigger' is fired by the plugin causing the
  // mutation (Toggler) or by the interacting plugin (Tabs, ResponsiveToggle).
  Triggers.Initializers.addResizeListener(250);
  Triggers.Initializers.addScrollListener();
  Triggers.Initializers.addClosemeListener();
}


Triggers.init = function (Foundation) {
  // 7.0: arm at DOMContentLoaded (or immediately once the DOM is parsed)
  // instead of window load. A stalled third-party resource - an embedded
  // video iframe that hangs without erroring - would otherwise leave every
  // [data-open]/[data-close]/[data-toggle] interaction dead until it gives
  // up, with nothing in the console. Arming at DOM-ready is safe for the
  // delegation (the document-level listeners resolve targets at event
  // time), and the initial Foundation.init() reflow completes before
  // DOMContentLoaded fires, so the closeme yeti-box snapshot still sees
  // the full plugin set.
  const arm = function () {
    if (triggersInitialized !== true) {
      Triggers.Initializers.addSimpleListeners();
      Triggers.Initializers.addGlobalListeners();
      triggersInitialized = true;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arm);
  } else {
    arm();
  }

  if(Foundation) {
    Foundation.Triggers = Triggers;
    // Legacy included to be backwards compatible for now.
    Foundation.IHearYou = Triggers.Initializers.addGlobalListeners
  }
}

export {Triggers};
