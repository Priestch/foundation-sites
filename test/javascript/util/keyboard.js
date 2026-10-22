describe('Keyboard util', function() {
  /**
   * Creates a dummy event to parse.
   * Uses jQuery Event class constructor.
   * @param  {number} keyCode Key code of the key that is simulated.
   * @param  {object} opts    Options that say if modifiers are pressed.
   * @return {Event}          Event to use.
   */
  const createEvent = window.mockKeyboardEvent;
  const keyCodes = {
    'A': 65,
    'TAB': 9,
    'ENTER': 13,
    'ESCAPE': 27,
    'SPACE': 32,
    'ARROW_LEFT': 37,
    'ARROW_UP': 38,
    'ARROW_RIGHT': 39,
    'ARROW_DOWN': 40
  };

  afterEach(function() {
    document.activeElement.blur();
  });

  // The trapFocus listeners live on the native event layer (7.0 line A, S5),
  // so the focus trap is exercised with real, bubbling KeyboardEvents -
  // a jQuery trigger() never produces one.
  function pressTab(shift) {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      which: 9,
      shiftKey: !!shift
    }));
  }

  it('exists on the Foundation API', function() {
    (window.Foundation.Keyboard).should.be.an('object');
  });

  describe('parseKey()', function() {
    it('parses a real KeyboardEvent', function() {
      let event = new KeyboardEvent('keydown', {key: 'Escape', keyCode: 27, which: 27}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('ESCAPE');
    });
    it('parses a real KeyboardEvent with modifiers', function() {
      let event = new KeyboardEvent('keydown', {key: 'Tab', keyCode: 9, which: 9, shiftKey: true}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('SHIFT_TAB');
    });
    it('returns the character pressed for a normal key', function() {
      let event = createEvent(keyCodes.A),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('A');
    });
    it('returns the character pressed for special keys', function() {
      for (let key in keyCodes) {
        let keyCode = keyCodes[key];
        let event = createEvent(keyCode),
            parsedKey = Foundation.Keyboard.parseKey(event);

        parsedKey.should.be.equal(key);
      }
    });
    it('recognizes if CTRL was pressed', function() {
      let event = createEvent(keyCodes.A, {ctrl: true}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('CTRL_A');
    });
    it('recognizes if ALT was pressed', function() {
      let event = createEvent(keyCodes.A, {alt: true}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('ALT_A');
    });
    it('recognizes if SHIFT was pressed', function() {
      let event = createEvent(keyCodes.A, {shift: true}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('SHIFT_A');
    });
    it('recognizes if multiple modifiers were pressed', function() {
      let event = createEvent(keyCodes.A, {shift: true, alt: true, ctrl: true}),
          parsedKey = Foundation.Keyboard.parseKey(event);

      parsedKey.should.be.equal('ALT_CTRL_SHIFT_A');
    });
  });
  describe('handleKey()', function() {
    it('executes callback for given key event', function() {
      let spy = sinon.spy();

      // Register component
      Foundation.Keyboard.register('MyComponent', {
        'ESCAPE': 'close'
      });

      let event = createEvent(keyCodes.ESCAPE);

      Foundation.Keyboard.handleKey(event, 'MyComponent', {
        close: () => {
          spy();
        }
      });

      spy.called.should.be.true;
    });
    it('executes handled callback for given key event', function() {
      let spy = sinon.spy();

      // Register component
      Foundation.Keyboard.register('MyComponent', {
        'ESCAPE': 'close'
      });

      let event = createEvent(keyCodes.ESCAPE);

      Foundation.Keyboard.handleKey(event, 'MyComponent', {
        close: () => {
          // stuff
        },
        handled: () => {
          spy();
        }
      });

      spy.called.should.be.true;
    });
    it('executes unhandled callback for given key event', function() {
      let spy = sinon.spy();

      // Register component
      Foundation.Keyboard.register('MyComponent', {
      });

      let event = createEvent(keyCodes.ESCAPE);

      Foundation.Keyboard.handleKey(event, 'MyComponent', {
        unhandled: () => {
          spy();
        }
      });

      spy.called.should.be.true;
    });
    it('executes callbacks for a real dispatched KeyboardEvent', function() {
      let spy = sinon.spy(),
          handledSpy = sinon.spy();

      // Register component
      Foundation.Keyboard.register('MyRealComponent', {
        'ESCAPE': 'close'
      });

      let $html = $('<div></div>').appendTo('body');

      // A consumer on the native event layer routes the real keydown into
      // handleKey - the shape every migrated consumer will use.
      FoundationNext.Events.on($html[0], 'keydown', function(e) {
        Foundation.Keyboard.handleKey(e, 'MyRealComponent', {
          close: spy,
          handled: handledSpy
        });
      });

      $html[0].dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
      }));

      spy.called.should.be.true;
      handledSpy.called.should.be.true;

      $html.remove();
    });
  });

  describe('findFocusable()', function() {
    it('finds focusable elements inside a container', function() {
      let $html = $(`<div>
            <a href="#">Link</a>
            <button>Button</button>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      $focusable.length.should.be.equal(2);

      $html.remove();
    });

    it('does not find hidden focusable elements', function() {
      let $html = $(`<div>
            <a style="display: none;" href="#">Link</a>
            <button style="display: none;">Button</button>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      $focusable.length.should.be.equal(0);

      $html.remove();
    });

    it('does not find disabled focusable elements', function() {
      let $html = $(`<div>
            <button disabled>Button</button>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      $focusable.length.should.be.equal(0);

      $html.remove();
    });

    it('does not find focusable elements with negative tabindex', function() {
      let $html = $(`<div>
            <button tabindex="-1">Button</button>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      $focusable.length.should.be.equal(0);

      $html.remove();
    });

    it('does sort by tabindex', function() {
      let $html = $(`<div>
            <a href="#" tabindex="1">Link1</a>
            <a href="#">Link3</a>
            <a href="#" tabindex="2">Link2</a>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      $focusable.eq(2)[0].should.be.equal($html.find('a').eq(1)[0]);

      $html.remove();
    });

    it('returns a jQuery collection with DOM order and accessors intact', function() {
      let $html = $(`<div>
            <button>First</button>
            <a href="#" tabindex="1">Link1</a>
            <a href="#">Link2</a>
          </div>`).appendTo('body');

      let $focusable = Foundation.Keyboard.findFocusable($html);

      // Mixed state: callers consume .length, .eq() and [0] on the result.
      $focusable.should.have.property('jquery');
      $focusable.length.should.be.equal(3);
      // tabindex=1 jumps the queue, plain elements keep DOM order behind it
      $focusable.eq(0)[0].should.be.equal($html.find('a')[0]);
      $focusable.eq(1)[0].should.be.equal($html.find('button')[0]);
      $focusable.eq(2)[0].should.be.equal($html.find('a')[1]);

      $html.remove();
    });
  });

  describe('trapFocus()', function() {
    it('moves the focus to the first focusable element', function() {
      let $html = $(`<div>
            <a href="#">Link1</a>
            <a href="#">Link2</a>
            <a href="#">Link3</a>
          </div>`).appendTo('body');

      Foundation.Keyboard.trapFocus($html);
      $html.find('a').last().focus();

      pressTab();

      document.activeElement.should.be.equal($html.find('a').eq(0)[0]);

      $html.remove();
    });

    it('moves the focus to the last focusable element', function() {
      let $html = $(`<div>
            <a href="#">Link1</a>
            <a href="#">Link2</a>
            <a href="#">Link3</a>
          </div>`).appendTo('body');

      Foundation.Keyboard.trapFocus($html);
      $html.find('a').first().focus();

      pressTab(true);

      document.activeElement.should.be.equal($html.find('a').eq(2)[0]);

      $html.remove();
    });

    it('keeps cycling inside the element', function() {
      let $html = $(`<div>
            <a href="#">Link1</a>
            <a href="#">Link2</a>
            <a href="#">Link3</a>
          </div>`).appendTo('body');

      Foundation.Keyboard.trapFocus($html);
      $html.find('a').last().focus();

      // last -> first wraps around ...
      pressTab();
      document.activeElement.should.be.equal($html.find('a').eq(0)[0]);

      // ... and a further TAB out of the first element stays in the trap
      // (the container handler only intercepts the boundary keys).
      pressTab();
      document.activeElement.should.be.equal($html.find('a').eq(0)[0]);

      // SHIFT_TAB on the first element wraps back to the last one
      pressTab(true);
      document.activeElement.should.be.equal($html.find('a').eq(2)[0]);

      $html.remove();
    });
  });

  describe('releaseFocus()', function() {
    it('stops trapping the focus at the end', function() {
      let $html = $(`<div>
            <a href="#">Link1</a>
            <a href="#">Link2</a>
            <a href="#">Link3</a>
          </div>`).appendTo('body');

      Foundation.Keyboard.trapFocus($html);
      $html.find('a').last().focus();

      Foundation.Keyboard.releaseFocus($html);

      pressTab();

      document.activeElement.should.not.be.equal($html.find('a').eq(0)[0]);

      $html.remove();
    });

    it('stops trapping the focus at the top', function() {
      let $html = $(`<div>
            <a href="#">Link1</a>
            <a href="#">Link2</a>
            <a href="#">Link3</a>
          </div>`).appendTo('body');

      Foundation.Keyboard.trapFocus($html);
      $html.find('a').first().focus();

      Foundation.Keyboard.releaseFocus($html);

      pressTab(true);

      document.activeElement.should.not.be.equal($html.find('a').eq(2)[0]);

      $html.remove();
    });
  });
});
