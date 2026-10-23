import { Events } from './foundation.util.events';

/**
 * Motion module.
 * @module foundation.motion
 */

const initClasses   = ['mui-enter', 'mui-leave'];
const activeClasses = ['mui-enter-active', 'mui-leave-active'];

// End-event names the animation completion listens for. Upstream motion-ui
// listens for the standard 'transitionend' only, while the 6.x inlined
// variant resolved a single name through a last-match-wins feature probe
// that ends on 'webkitTransitionEnd' in Chromium. Listening to both keeps
// completion working on every engine; `finish` runs at most once.
const endEvents = ['transitionend', 'webkitTransitionEnd'];

const Motion = {
  animateIn: function(element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function(element, animation, cb) {
    animate(false, element, animation, cb);
  }
}

// Unwraps the mixed-state input (jQuery collection or plain element) to the
// animation target, mirroring `toElement` in foundation.core.utils.
function toElement(obj) {
  // nodeType marks a real node: never unwrap it, even when it is itself
  // array-like (HTMLSelectElement exposes its first option as [0]).
  return obj && obj.nodeType === undefined && obj[0] !== undefined ? obj[0] : obj;
}

// Native stand-ins for jQuery's `.show()`/`.hide()`, after the S6 Reveal
// `_show` precedent: show clears an inline display override and falls back
// to `block` when the stylesheet still hides the element (what jQuery's
// getDefaultDisplay resolved to for everything animated here), hide sets
// the inline `none` jQuery would have written.
function show(el) {
  el.style.display = '';
  if (window.getComputedStyle(el).display === 'none') {
    el.style.display = 'block';
  }
}

function hide(el) {
  el.style.display = 'none';
}

// v6 fired 'finished.zf.animate' twice per Move (bubbling `trigger` plus the
// element-local `triggerHandler`), so persistent element-local handlers ran
// on every pass. The 7.0 flip dispatches ONE real, bubbling CustomEvent:
// listeners on the element and its ancestors receive it exactly once, and
// still-on-jQuery listeners keep receiving it through the S3/S4 white
// absorption (extra params are on `event.originalEvent.detail` for them).
function fireFinished(elem) {
  // S15 (detail-to-Element ruling): the extra parameter is the animation
  // target element, no longer the jQuery collection Move() was called with.
  Events.trigger(toElement(elem), 'finished.zf.animate', [toElement(elem)]);
}

function Move(duration, elem, fn){
  var anim, prog, start = null;

  if (duration === 0) {
    fn.apply(elem);
    fireFinished(elem);
    return;
  }

  function move(ts){
    if(!start) start = ts;
    prog = ts - start;
    fn.apply(elem);

    if(prog < duration){ anim = window.requestAnimationFrame(move, elem); }
    else{
      window.cancelAnimationFrame(anim);
      fireFinished(elem);
    }
  }
  anim = window.requestAnimationFrame(move);
}

/**
 * Animates an element in or out using a CSS transition class.
 * The class lifecycle replicates motion-ui's observable behavior (the v6
 * util inlined it): reset, add the animation class with transitions
 * disabled, then over two animation frames add the init class (showing the
 * element for in animations), force a reflow, release the transition and add
 * the active class. Completion waits for a transition end event, then hides
 * (out animations), resets, and runs the callback.
 * @function
 * @private
 * @param {Boolean} isIn - Defines if the animation is in or out.
 * @param {Object} element - jQuery or HTML object to animate.
 * @param {String} animation - CSS class to use.
 * @param {Function} cb - Callback to run when animation is finished.
 */
function animate(isIn, element, animation, cb) {
  // The mixed-state input is unwrapped to the animation target; the plugin
  // layer now hands in native elements (S15) while the not-yet-migrated
  // callers still pass jQuery collections.
  const el = toElement(element);

  if (!el || el.nodeType !== 1) return;

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];
  // One completion per animate() call: both end-event names are armed below.
  let finished = false;

  // Set up the animation
  reset();

  addClass(el, animation);
  el.style.transition = 'none';

  requestAnimationFrame(() => {
    addClass(el, initClass);
    if (isIn) show(el);
  });

  // Start the animation
  requestAnimationFrame(() => {
    // will trigger the browser to synchronously calculate the style and layout
    // also called reflow or layout thrashing
    // see https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    el.offsetWidth;
    el.style.transition = '';
    addClass(el, activeClass);
  });

  // Clean up the animation when it finishes
  endEvents.forEach(endEvent => Events.one(el, endEvent, finish));

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (finished) return;
    finished = true;
    if (!isIn) hide(el);
    reset();
    if (cb) cb.apply(el);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    el.style.transitionDuration = 0;
    removeClass(el, initClass, activeClass, animation);
  }

  // jQuery's class methods ignore empty tokens (callers may pass '' as the
  // animation class); classList throws on them.
  function addClass(target, token) {
    if (token) { target.classList.add(token); }
  }
  function removeClass(target, ...tokens) {
    tokens.forEach(token => { if (token) { target.classList.remove(token); } });
  }
}

export { Move, Motion };
