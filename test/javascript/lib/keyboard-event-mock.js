(function(global) {
  var keyCodes = {
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

  // The `key` field real KeyboardEvents carry (S14 exploration, landed in
  // S15): Keyboard.parseKey prefers it. The mock stays a jQuery Event for
  // now because the coarse suites feed it through jQuery `.trigger()` -
  // jQuery cannot wrap a real KeyboardEvent (its `type` lives on the
  // prototype, so `trigger` misparses it). Suites migrate to real
  // KeyboardEvent dispatch together with their component's keydown binding,
  // at which point this mock is retired.
  var keyNames = {
    9: 'Tab',
    13: 'Enter',
    27: 'Escape',
    32: ' ',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown'
  };

  /**
   * Creates a dummy event to parse.
   * Uses jQuery Event class constructor.
   * @param  {number} keyCode Key code of the key that is simulated.
   * @param  {object} opts    Options that say if modifiers are pressed.
   * @return {Event}          Event to use.
   */
  global.mockKeyboardEvent =  mockKeyboardEvent = function(keyCode, opts) {
    var options = opts || {},
        isCtrl = !!options.ctrl,
        isAlt = !!options.alt,
        isShift = !!options.shift,
        isMeta = !!options.meta,
        keyCode = typeof keyCode === 'number' ? keyCode : keyCodes[keyCode],
        event = {
          shiftKey: isShift,
          altKey: isAlt,
          ctrlKey: isCtrl,
          metaKey: isMeta,
          key: keyNames[keyCode] || String.fromCharCode(keyCode),
          keyCode: keyCode,
          which: keyCode
        };
    return new $.Event('keydown', event);
  };
})(window);
