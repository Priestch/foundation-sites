(function(global) {
  var keys = {
    'A': 'a',
    'TAB': 'Tab',
    'ENTER': 'Enter',
    'ESCAPE': 'Escape',
    'SPACE': ' ',
    'END': 'End',
    'HOME': 'Home',
    'ARROW_LEFT': 'ArrowLeft',
    'ARROW_UP': 'ArrowUp',
    'ARROW_RIGHT': 'ArrowRight',
    'ARROW_DOWN': 'ArrowDown'
  };

  // S16: the mock builds a REAL KeyboardEvent now - the suites dispatch it
  // with `element.dispatchEvent(mock)` and both listener layers (native
  // Events.on and still-on-jQuery .on) receive it, because a dispatched event
  // is a real DOM event. `key` is the primary field Keyboard.parseKey reads;
  // keyCode/which are defined as own properties (the KeyboardEvent
  // constructor ignores them) for the `which` fallback and for suites that
  // assert on them. The mock keeps its name and call shape.
  global.mockKeyboardEvent = mockKeyboardEvent = function(keyCode, opts) {
    var options = opts || {},
        isCtrl = !!options.ctrl,
        isAlt = !!options.alt,
        isShift = !!options.shift,
        isMeta = !!options.meta,
        code = typeof keyCode === 'number' ? keyCode : keyNumber(keyCode),
        key = keys[keyCode] || String.fromCharCode(code).toLowerCase();

    var event = new KeyboardEvent('keydown', {
      key: key,
      bubbles: true,
      cancelable: true,
      shiftKey: isShift,
      altKey: isAlt,
      ctrlKey: isCtrl,
      metaKey: isMeta
    });
    // KeyboardEventInit carries no keyCode/which - define them read-only.
    Object.defineProperty(event, 'keyCode', { value: code });
    Object.defineProperty(event, 'which', { value: code });
    return event;
  };

  function keyNumber(name) {
    var numbers = {
      'A': 65,
      'TAB': 9,
      'ENTER': 13,
      'ESCAPE': 27,
      'SPACE': 32,
      'END': 35,
      'HOME': 36,
      'ARROW_LEFT': 37,
      'ARROW_UP': 38,
      'ARROW_RIGHT': 39,
      'ARROW_DOWN': 40
    };
    return numbers[name] || 0;
  }
})(window);
