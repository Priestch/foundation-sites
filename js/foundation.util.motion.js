import $ from 'jquery';
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
  return obj && obj[0] !== undefined ? obj[0] : obj;
}

// v6 fired 'finished.zf.animate' twice per Move (bubbling `trigger` plus the
// element-local `triggerHandler`), so persistent element-local handlers ran
// on every pass. The 7.0 flip dispatches ONE real, bubbling CustomEvent:
// listeners on the element and its ancestors receive it exactly once, and
// still-on-jQuery listeners keep receiving it through the S3/S4 white
// absorption (extra params are on `event.originalEvent.detail` for them).
function fireFinished(elem) {
  Events.trigger(toElement(elem), 'finished.zf.animate', [elem]);
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
  // Mixed state: the element is still fed to (and hidden/shown through)
  // jQuery, the animation target for classes, styles and events is taken
  // from $element[0].
  const $element = $(element).eq(0);

  if (!$element.length) return;

  const el = $element[0];
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
    if (isIn) $element.show();
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
    if (!isIn) $element.hide();
    reset();
    if (cb) cb.apply($element);
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
