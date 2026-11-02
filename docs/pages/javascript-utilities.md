---
title: JavaScript Utilities
description: Our JavaScript Utility Libraries are easy to use and super helpful.
video: 'h83jR82cjWM'
---

## Installing

See our [JavaScript](javascript.html) and [Installation](installation.html) pages on how to install our files in your project.

## Box
`js/foundation.util.box.js`

One of the useful libraries is `Foundation.Box`, and it has a couple methods designed to make your life easier. Both take plain JavaScript elements (the 7.0 terminal form; collections work too).

```js

var dims = Foundation.Box.GetDimensions(element);
```
Will return an object that contains the dimensions of `element`. The object return looks like:

```js

{
  height: 54,
  width: 521,
  offset: {
    left: 198,
    top: 1047
  },
  parentDims: {
    height: ... // parentDims and windowDims share the same format as the element dimensions.
  },
  windowDims: {
    height: ...
  }
}
```

Also included is the `ImNotTouchingYou` function. It returns a boolean based on whether the passed `element` is colliding with the edge of the window (default), or a parent element. The remaining two options are booleans for limiting collision detection to only one axis.
```js

var clear = Foundation.Box.ImNotTouchingYou(element [, parent, leftAndRightOnly, topAndBottomOnly]);
```

## Keyboard
`js/foundation.util.keyboard.js`

Another quite useful library, `Foundation.Keyboard` has several methods to make keyboard event interaction easier for all. Shout out to Marius Olbertz of Germany who conceived and coded this library.

Ever wanted a handy list of common keycodes and the keys they represent? Use `Foundation.Keyboard.keys`. This is an object containing key/value pairs of the most frequently used keys in our framework.

Want to manage your own keyboard inputs? No problem! In your key event callback, call `Foundation.Keyboard.parseKey(event)` to get a string of what key was pressed, e.g. `'TAB'` or `'ALT_X'`.
(You can also use this function outside of the Foundation components, in your own JavaScript code!)

What if you want to know if there's focusable elements somewhere on a page? Instead of writing your own function and selector from scratch, just use:
```js
var focusable = Foundation.Keyboard.findFocusable(document.querySelector('#content'));
```

The Keyboard utility also provides functions to trap the keyboard focus inside a given element. This is quite useful for modals in terms of accessibility. When the focus is trapped, pressing tab while the last focusable element inside the given container is selected will focus the first element and vice versa.
```js
// Trap focus to given element
Foundation.Keyboard.trapFocus(document.querySelector('#content'));

// Release focus from given element
Foundation.Keyboard.releaseFocus(document.querySelector('#content'));
```


The real gem of this library, however, is the `handleKey` function. Any plugin that is registered with the utility can call on this method to manage keyboard inputs.
```js
Foundation.Keyboard.register('pluginName', {
  'TAB': 'next'
});
...//in event callback
Foundation.Keyboard.handleKey(event, 'pluginName', {
  next: function(){
    //do stuff
  }
});
```
There are also the functions `handled` and `unhandled`, where you can place any code that shall always be executed after the key event has been handled (or not).

If you want to use your own key bindings, simply call the `Foundation.Keyboard.register` function. It even works after Foundation has already initialized.

## MediaQuery
`js/foundation.util.mediaQuery.js`

The media query library used by Foundation has two publicly accessible functions and two properties:
```js

Foundation.MediaQuery.get('medium');
// returns the minimum pixel value for the `medium` breakpoint.
Foundation.MediaQuery.atLeast('large');
// returns a boolean if the current screen size is, you guessed it, at least `large`.
Foundation.MediaQuery.queries;
// an array of media queries Foundation uses for breakpoints.
Foundation.MediaQuery.current;
// a string of the current breakpoint size.
```

Also included is an event emitter for breakpoint changes. The `changed.zf.mediaquery` event fires on `window`; the sizes are passed in the event detail (7.0: native events carry extra parameters in `event.detail`):
```js
window.addEventListener('changed.zf.mediaquery', function(event) {
  var newSize = event.detail[0], oldSize = event.detail[1];
});
```

## Motion & Move
`js/foundation.util.motion.js`

Two handy utilities, one little file.

`Foundation.Motion` implements the same class lifecycle as the JavaScript helpers of the [Motion-UI](https://github.com/foundation/motion-ui/) library (whose classes and Sass mixins it drives), and is included in Foundation. See the GitHub page for more details.

`Foundation.Move` is a simple helper function for utilizing browsers' `requestAnimationFrame` method for hardware acceleration. Invoke like so:
```js
Foundation.Move(durationInMS, element, function(){
  //animation logic
});
```
When the animation is complete, the element will fire `finished.zf.animate`.

## Timer
`js/foundation.util.timer.js`

```js

var timer = new Foundation.Timer(element, {duration: ms, infinite: bool}, callback);
// includes: timer.start(), timer.pause(), timer.restart()
```
Similar to `setInterval`, except you can pause and resume where you left off.

## ImageLoader
`js/foundation.util.imageLoader.js`

```js
Foundation.onImagesLoaded(document.querySelectorAll('img'), callback);
```
This will execute your callback function after all the images in the list have loaded (an element, a NodeList or an array all work).

## Touch
`js/foundation.util.touch.js`

Allows you to add `swipe*` and pseudo-drag events to elements.

> **7.0 note:** the jQuery-side surfaces `$.spotSwipe` and
> `$('selector').addTouch()` are gone. Bind native listeners (or use the
> `Foundation.Touch` helpers, e.g. `Foundation.Touch.addTouch(element)`) and
> listen for the events with `element.addEventListener`. jQuery-synthesized
> events no longer reach native listeners.

```js
Foundation.Touch.addTouch(document.querySelector('#my-element'));
// Binds elements to touch events. Used in the Slider plugin for mobile devices.
document.querySelector('#my-element').addEventListener('swipeleft', handleLeftSwipe);
// Binds elements to swipe events. Used in the Orbit plugin for mobile devices.
```

## Triggers
`js/foundation.util.triggers.js`

Provides a number of event listeners and triggers your script can hook into. Most are self-explanatory, and used in many Foundation plugins.
```html
<button data-open="someId">I open something!</button>
<button data-close="someId">I close something!</button>
<button data-toggle="someId">I toggle something!</button>
```
```js
// Add the data-open/close/toggle="idOfElement" tag to your markup.
// When a click event is triggered on that element, these are the non-bubbling events directed at your element.
// If you don't use an `id` selector, an event will be triggered that bubbles up to window.
element.addEventListener('open.zf.trigger', handleOpen);
element.addEventListener('close.zf.trigger', handleClose);
element.addEventListener('toggle.zf.trigger', handleToggle);
```
Besides these useful click triggers, there are also other listeners for you to tap into. Need to know when the window has been resized, but only when it's done resizing? How about a debounced scroll event? Add this markup and JavaScript and you're good to go!

```html
<div data-scroll="someId">...</div>
<div data-resize="someId">...</div>
```
```js
var el = document.getElementById('someId');
el.addEventListener('scrollme.zf.trigger', handleScroll);
el.addEventListener('resizeme.zf.trigger', handleResize);
```

## Throttle
`js/foundation.core.js`

Many times when you create a callback, it's advantageous to add a delay in order to prevent it from being triggered multiple times. Foundation includes one type of callback delay: `throttle`.

`Throttle` prevents a function from being executed more than once every n milliseconds. Throttling is often used in cases where it's disadvantageous to trigger a callback every time an event is triggered (during a continuous action), but you still want to trigger a reaction while the event is occurring. Examples of this would be reacting to the browser window being resized, or animating an element.

### Without Delay
```js
// Button click handler
document.querySelector('.button').addEventListener('click', function(e){
  // Handle Click
});

// Resize function
window.addEventListener('resize', function(e){
  // Do responsive stuff
});
```

### With Delay
```js
// Throttled resize function
window.addEventListener('resize', Foundation.util.throttle(function(e){
  // Do responsive stuff
}, 300));
```

### Method Signature
```js
// Arguments:
//    Func (Function): Function to be throttled.
//
//    Delay (Integer): Function execution threshold in milliseconds.
//
// Returns:
//    Lazy_function (Function): Function with throttling applied.

throttle(func, delay) { ... }
```

## Miscellaneous

Foundation includes a couple useful features in the core library that are used in many places, that you can tap into.

`Foundation.GetYoDigits([number, namespace])` returns a base-36, pseudo-random string with a hyphenated namespace (if you include one). Both arguments are optional; by default, it will return a string six characters long.

`Foundation.getFnName(fn)` returns a string representation of a named function. Seems small, but believe us—it's useful.

`Foundation.transitionend()` is a function<span data-tooltip title="Goodbye ZURB, I'll miss you"> </span> that returns the string of the properly vendor-prefixed version of `transitionend` events. Most browsers don't require a prefix these days, but for those that do, we've got you covered.
