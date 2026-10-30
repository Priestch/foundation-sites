//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************

import { Events } from './foundation.util.events';

// S13 (7.0 line A): the synthesizers produce real, bubbling CustomEvents
// through the Events layer instead of jQuery triggers. The 6.x chain armed
// itself per element through the `$.event.special` setup hooks; the native
// chain arms ONCE on the document (Touch.init) and dispatches each synthetic
// event on the touched element, so it bubbles to the same ancestors the
// jQuery synthetic walk reached. Extra parameters ride the event detail in
// the 6.x shapes: 'swipe' carries (touchmoveEvent, direction), the
// directional swipe<dir> and 'tap' carry their source touch event. Native
// handlers receive them as trailing arguments; jQuery listeners of the
// mixed state read them from event.originalEvent.detail.
var Touch = {};

var startPosX,
    startTime,
    elapsedTime,
    startEvent,
    isMoving = false,
    didMoved = false,
    touchTarget = null;

function onTouchEnd(e) {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);

  // If the touch did not move, consider it as a "tap"
  if (!didMoved) {
    Events.trigger(touchTarget || document.body, 'tap', startEvent || e);
  }

  startEvent = null;
  isMoving = false;
  didMoved = false;
  touchTarget = null;
}

function onTouchMove(e) {
  if (true === Touch.spotSwipe.preventDefault) { e.preventDefault(); }

  if(isMoving) {
    var x = e.touches[0].pageX;
    // var y = e.touches[0].pageY;
    var dx = startPosX - x;
    // var dy = startPosY - y;
    var dir;
    didMoved = true;
    elapsedTime = new Date().getTime() - startTime;
    if(Math.abs(dx) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
      dir = dx > 0 ? 'left' : 'right';
    }
    // else if(Math.abs(dy) >= Touch.spotSwipe.moveThreshold && elapsedTime <= Touch.spotSwipe.timeThreshold) {
    //   dir = dy > 0 ? 'down' : 'up';
    // }
    if(dir) {
      e.preventDefault();
      // the reset in onTouchEnd clears the module state; the swipe still
      // dispatches on the element the touch started on
      var swipeTarget = touchTarget;
      onTouchEnd.apply(this, arguments);
      Events.trigger(swipeTarget, 'swipe', [e, dir]);
      Events.trigger(swipeTarget, `swipe${dir}`, e);
    }
  }

}

function onTouchStart(e) {

  if (e.touches.length === 1) {
    touchTarget = e.target;
    startPosX = e.touches[0].pageX;
    startEvent = e;
    isMoving = true;
    didMoved = false;
    startTime = new Date().getTime();
    document.addEventListener('touchmove', onTouchMove, { passive : true === Touch.spotSwipe.preventDefault });
    document.addEventListener('touchend', onTouchEnd, false);
  }
}

function handleTouch(event) {
  var touches = event.changedTouches,
      first = touches[0],
      eventTypes = {
        touchstart: 'mousedown',
        touchmove: 'mousemove',
        touchend: 'mouseup'
      },
      type = eventTypes[event.type];

  if('MouseEvent' in window && typeof window.MouseEvent === 'function') {
    first.target.dispatchEvent(new window.MouseEvent(type, {
      'bubbles': true,
      'cancelable': true,
      'screenX': first.screenX,
      'screenY': first.screenY,
      'clientX': first.clientX,
      'clientY': first.clientY
    }));
  }
}

class SpotSwipe {
  constructor() {
    this.version = '1.0.0';
    this.enabled = 'ontouchstart' in document.documentElement;
    this.preventDefault = false;
    this.moveThreshold = 75;
    this.timeThreshold = 200;
    // The 6.x `_init()` registered the synthesizers through `$.event.special`
    // setup hooks, which jQuery invoked for every element a 'tap'/'swipe*'
    // listener was bound to. The native chain arms once on the document (see
    // Touch.init), so there is nothing per-element to set up anymore.
  }
}

/****************************************************
 * As far as I can tell, both setupSpotSwipe and    *
 * setupTouchHandler should be idempotent,          *
 * because they directly replace functions &        *
 * values, and do not add event handlers directly.  *
 ****************************************************/

Touch.setupSpotSwipe = function() {
  Touch.spotSwipe = new SpotSwipe();
};

/****************************************************
 * Method for adding pseudo drag events to elements *
 ***************************************************/
Touch.setupTouchHandler = function() {
  // Native form of `$.fn.addTouch`: the feed replays touch input as mouse
  // events dispatched on the touch origin - real events, which reach the
  // native listeners directly and still-on-jQuery ones through the
  // real-event pass-through.
  Touch.addTouch = function(element) {
    if (!element || !element.addEventListener) { return; }
    element.addEventListener('touchstart', handleTouch, false);
    element.addEventListener('touchmove', handleTouch, false);
    element.addEventListener('touchend', handleTouch, false);
    element.addEventListener('touchcancel', handleTouch, false);
  };
};

Touch.init = function () {
  if(typeof(Touch.spotSwipe) === 'undefined') {
    Touch.setupSpotSwipe();
    Touch.setupTouchHandler();
    // One document-level touchstart arm, replacing the per-element
    // `$.event.special` setups: every tap/swipe below is dispatched on the
    // touched element and bubbles, so the ancestor bindings (body tap
    // handlers) hear it like the jQuery synthetic walk delivered them.
    document.addEventListener('touchstart', onTouchStart, { passive : true });
  }
};

export {Touch};
