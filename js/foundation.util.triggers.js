import $ from 'jquery';
import { onLoad } from './foundation.core.utils';
import { Motion } from './foundation.util.motion';
import { Events } from './foundation.util.events';

// Mixed-state dispatchers (7.0 line A, S4): the Triggers util now produces
// its events on the native Events layer as real DOM events. Still-on-jQuery
// consumers (Reveal, Dropdown, Tooltip, OffCanvas, ...) keep receiving them
// because jQuery applies no namespace filtering to real DOM events on the
// dispatch target ("white absorption"). The reverse direction does not exist
// - a jQuery-synthesized trigger() never reaches native listeners - which is
// why the window-level resize/scroll/closeme listeners below stay registered
// through jQuery: they must hear jQuery-synthesized events from un-migrated
// producers now, and keep hearing the real events once those producers
// migrate. For the element-local triggerHandler dispatches (open/toggle/
// toggle-focus), a real event would over-deliver to jQuery handlers of the
// same base type under other namespaces, which jQuery cannot filter - so
// those go out as a dual transport instead (see dispatchLocal below).

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

// Mixed-state element-local dispatch (S4): the native call carries the
// migrated consumers; the jQuery call carries the still-unmigrated ones with
// exact 6.x semantics (synthetic, namespace-filtered, element-local). Neither
// call can reach the other layer, so nothing double-fires while every element
// listens on exactly one side. The jQuery half disappears when the last
// consumer migrates.
const dispatchLocal = (target, type, param) => {
  Events.triggerHandler(target, type, [param]);
  $(target).triggerHandler(type, [param]);
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
    let animation = $(this).data('closable');

    // Only close the first closable element. See https://git.io/zf-7833
    e.stopPropagation();

    if(animation !== ''){
      Motion.animateOut($(this), animation, function() {
        $(this).trigger('closed.zf');
      });
    }else{
      $(this).fadeOut().trigger('closed.zf');
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
  closeMeListener: function(e, pluginId){
    let plugin = e.namespace.split('.')[0];
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
    let listeners = plugNames.map((name) => {
      return `closeme.zf.${name}`;
    }).join(' ');

    // jQuery-side on purpose (S4): the closeme producers are the still
    // un-migrated plugins, and a jQuery trigger() only reaches jQuery
    // listeners. Real events keep arriving through this same listener.
    $(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
  }
}

function debounceGlobalListener(debounce, trigger, listener) {
  let timer;
  // jQuery-side, like the closeme listener above (see the note at the top).
  $(window).on(trigger, function() {
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


Triggers.init = function (__, Foundation) {
  onLoad($(window), function () {
    if (triggersInitialized !== true) {
      Triggers.Initializers.addSimpleListeners();
      Triggers.Initializers.addGlobalListeners();
      triggersInitialized = true;
    }
  });

  if(Foundation) {
    Foundation.Triggers = Triggers;
    // Legacy included to be backwards compatible for now.
    Foundation.IHearYou = Triggers.Initializers.addGlobalListeners
  }
}

export {Triggers};
