describe('FoundationNext.Events', function() {
  var $container, el;

  beforeEach(function() {
    $container = $('<div id="events-test-container"></div>').appendTo('body');
    el = document.createElement('button');
    $container[0].appendChild(el);
  });

  afterEach(function() {
    FoundationNext.Events.off(el);
    FoundationNext.Events.off($container[0]);
    $container.remove();
  });

  function click(el) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  describe('on()', function() {
    it('runs the handler for a native event with this set to the element', function() {
      var spy = sinon.spy();

      FoundationNext.Events.on(el, 'click.zf.test', spy);
      click(el);

      sinon.assert.calledOnce(spy);
      spy.firstCall.thisValue.should.equal(el);
    });

    it('binds several space-separated types at once', function() {
      var spy = sinon.spy();

      FoundationNext.Events.on(el, 'click.zf.test focus.zf.test', spy);

      click(el);
      el.dispatchEvent(new FocusEvent('focus'));

      sinon.assert.calledTwice(spy);
    });
  });

  describe('off() — the four forms', function() {
    it('removes an exact type + namespace: off(el, "open.zf.toggler")', function() {
      var removed = sinon.spy();
      var kept = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.toggler', removed);
      FoundationNext.Events.on(el, 'open.zf.other', kept);
      FoundationNext.Events.off(el, 'open.zf.toggler');

      FoundationNext.Events.trigger(el, 'open.zf.toggler');
      FoundationNext.Events.trigger(el, 'open.zf.other');

      sinon.assert.notCalled(removed);
      sinon.assert.calledOnce(kept);
    });

    it('removes a whole bare namespace: off(el, ".zf.toggler")', function() {
      var open = sinon.spy();
      var close = sinon.spy();
      var kept = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.toggler', open);
      FoundationNext.Events.on(el, 'close.zf.toggler', close);
      FoundationNext.Events.on(el, 'open.zf.other', kept);
      FoundationNext.Events.off(el, '.zf.toggler');

      FoundationNext.Events.trigger(el, 'open.zf.toggler');
      FoundationNext.Events.trigger(el, 'close.zf.toggler');
      FoundationNext.Events.trigger(el, 'open.zf.other');

      sinon.assert.notCalled(open);
      sinon.assert.notCalled(close);
      sinon.assert.calledOnce(kept);
    });

    it('treats multi-segment namespaces as a flat set: off(el, "a.b.c")', function() {
      var full = sinon.spy();
      var shorter = sinon.spy();

      // ns {zf, trigger, revealScrollbarListener} contains zf AND trigger.
      FoundationNext.Events.on(el, 'resizeme.zf.trigger.revealScrollbarListener', full);
      FoundationNext.Events.off(el, 'resizeme.zf.trigger');
      FoundationNext.Events.trigger(el, 'resizeme.zf.trigger.revealScrollbarListener');
      sinon.assert.notCalled(full);

      // ns {zf, trigger} does NOT contain revealScrollbarListener.
      FoundationNext.Events.on(el, 'resizeme.zf.trigger', shorter);
      FoundationNext.Events.off(el, 'resizeme.zf.trigger.revealScrollbarListener');
      FoundationNext.Events.trigger(el, 'resizeme.zf.trigger');
      sinon.assert.calledOnce(shorter);
    });

    it('removes everything on the element: off(el)', function() {
      var first = sinon.spy();
      var second = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.test', first);
      FoundationNext.Events.on(el, 'click.zf.other', second);
      FoundationNext.Events.off(el);

      FoundationNext.Events.trigger(el, 'open.zf.test');
      click(el);

      sinon.assert.notCalled(first);
      sinon.assert.notCalled(second);
    });

    it('removes a specific handler reference, leaving others', function() {
      var first = sinon.spy();
      var second = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.test', first);
      FoundationNext.Events.on(el, 'open.zf.test', second);
      FoundationNext.Events.off(el, 'open.zf.test', first);

      FoundationNext.Events.trigger(el, 'open.zf.test');

      sinon.assert.notCalled(first);
      sinon.assert.calledOnce(second);
    });
  });

  describe('one()', function() {
    it('fires the handler exactly once across several triggers', function() {
      var spy = sinon.spy();

      FoundationNext.Events.one(el, 'open.zf.test', spy);
      FoundationNext.Events.trigger(el, 'open.zf.test');
      FoundationNext.Events.trigger(el, 'open.zf.test');

      sinon.assert.calledOnce(spy);
    });

    it('can still be removed by handler reference before firing', function() {
      var spy = sinon.spy();

      FoundationNext.Events.one(el, 'open.zf.test', spy);
      FoundationNext.Events.off(el, 'open.zf.test', spy);
      FoundationNext.Events.trigger(el, 'open.zf.test');

      sinon.assert.notCalled(spy);
    });
  });

  describe('trigger()', function() {
    it('bubbles to ancestors', function() {
      var parentSpy = sinon.spy();

      FoundationNext.Events.on($container[0], 'open.zf.toggler', parentSpy);
      FoundationNext.Events.trigger(el, 'open.zf.toggler');

      sinon.assert.calledOnce(parentSpy);
    });

    it('passes extra parameters to the handler in order', function() {
      var spy = sinon.spy();
      var payload = { key: 'value' };

      FoundationNext.Events.on(el, 'close.zf.reveal', spy);
      FoundationNext.Events.trigger(el, 'close.zf.reveal', [42, 'two', payload]);

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[1].should.equal(42);
      spy.firstCall.args[2].should.equal('two');
      spy.firstCall.args[3].should.equal(payload);
    });

    it('carries a jQuery-style sorted namespace string on the event', function() {
      var spy = sinon.spy();

      FoundationNext.Events.on(el, 'closeme.zf.reveal', spy);
      FoundationNext.Events.trigger(el, 'closeme.zf.reveal');

      spy.firstCall.args[0].namespace.should.equal('reveal.zf');
    });

    it('a namespaced trigger does not fire unnamespaced handlers', function() {
      var plain = sinon.spy();
      var namespaced = sinon.spy();

      FoundationNext.Events.on(el, 'open', plain);
      FoundationNext.Events.on(el, 'open.zf.toggler', namespaced);
      FoundationNext.Events.trigger(el, 'open.zf.toggler');

      sinon.assert.notCalled(plain);
      sinon.assert.calledOnce(namespaced);
    });

    it('a plain trigger fires namespaced handlers of the same type', function() {
      var namespaced = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.toggler', namespaced);
      FoundationNext.Events.trigger(el, 'open');

      sinon.assert.calledOnce(namespaced);
    });

    it('a handler calling stopPropagation() prevents ancestor handlers', function() {
      var parentSpy = sinon.spy();

      FoundationNext.Events.on(el, 'open.zf.test', function(e) {
        e.stopPropagation();
      });
      FoundationNext.Events.on($container[0], 'open.zf.test', parentSpy);
      FoundationNext.Events.trigger(el, 'open.zf.test');

      sinon.assert.notCalled(parentSpy);
    });

    it('calls the same-named native method, e.g. trigger("focus")', function() {
      var input = document.createElement('input');
      $container[0].appendChild(input);
      var focusSpy = sinon.spy(input, 'focus');
      var handlerSpy = sinon.spy();

      try {
        FoundationNext.Events.on(input, 'focus.zf.test', handlerSpy);
        FoundationNext.Events.trigger(input, 'focus');

        sinon.assert.calledOnce(focusSpy);
        // The echo of the native call must not run the handlers twice.
        sinon.assert.calledOnce(handlerSpy);
      } finally {
        focusSpy.restore();
      }
    });
  });

  describe('triggerHandler()', function() {
    it('returns the handler return value', function() {
      FoundationNext.Events.on(el, 'toggle.zf.test', function() {
        return 'the-result';
      });

      (FoundationNext.Events.triggerHandler(el, 'toggle.zf.test')).should.equal('the-result');
    });

    it('returns the last non-undefined result of several handlers', function() {
      FoundationNext.Events.on(el, 'toggle.zf.test', function() {
        return 'first';
      });
      FoundationNext.Events.on(el, 'toggle.zf.test', function() {
        // returns undefined on purpose
      });

      (FoundationNext.Events.triggerHandler(el, 'toggle.zf.test')).should.equal('first');
    });

    it('does not bubble', function() {
      var parentSpy = sinon.spy();

      FoundationNext.Events.on($container[0], 'toggle.zf.trigger', parentSpy);
      FoundationNext.Events.triggerHandler(el, 'toggle.zf.trigger');

      sinon.assert.notCalled(parentSpy);
    });

    it('does not call the same-named native method', function() {
      var input = document.createElement('input');
      $container[0].appendChild(input);
      var focusSpy = sinon.spy(input, 'focus');

      try {
        FoundationNext.Events.triggerHandler(input, 'focus');

        sinon.assert.notCalled(focusSpy);
      } finally {
        focusSpy.restore();
      }
    });

    it('passes extra parameters to the handler', function() {
      var spy = sinon.spy();

      FoundationNext.Events.on(el, 'toggle.zf.trigger', spy);
      FoundationNext.Events.triggerHandler(el, 'toggle.zf.trigger', [el]);

      spy.firstCall.args[1].should.equal(el);
    });
  });

  describe('delegate()', function() {
    var root, delegated;

    beforeEach(function() {
      root = $container[0];
      delegated = sinon.spy();
    });

    it('fires for a descendant matching the selector, with this set to the match', function() {
      el.setAttribute('data-open', 'x');
      FoundationNext.Events.delegate(root, 'click.zf.trigger', '[data-open]', delegated);

      click(el);

      sinon.assert.calledOnce(delegated);
      delegated.firstCall.thisValue.should.equal(el);
    });

    it('fires when the event target is the matching element itself', function() {
      var target = document.createElement('a');
      target.setAttribute('data-open', 'x');
      root.appendChild(target);

      FoundationNext.Events.delegate(root, 'click.zf.trigger', '[data-open]', delegated);

      click(target);

      sinon.assert.calledOnce(delegated);
      delegated.firstCall.thisValue.should.equal(target);
    });

    it('walks up with closest through intermediate elements', function() {
      var button = document.createElement('button');
      button.setAttribute('data-toggle', 'y');
      var span = document.createElement('span');
      button.appendChild(span);
      root.appendChild(button);

      FoundationNext.Events.delegate(root, 'click.zf.trigger', '[data-toggle]', delegated);

      span.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      sinon.assert.calledOnce(delegated);
      delegated.firstCall.thisValue.should.equal(button);
    });

    it('ignores clicks on non-matching targets', function() {
      FoundationNext.Events.delegate(root, 'click.zf.trigger', '[data-open]', delegated);

      click(root);

      sinon.assert.notCalled(delegated);
    });

    it('can be removed again with off() and the handler reference', function() {
      FoundationNext.Events.delegate(root, 'click.zf.trigger', '[data-open]', delegated);
      FoundationNext.Events.off(root, 'click.zf.trigger', delegated);

      click(el);

      sinon.assert.notCalled(delegated);
    });
  });
});
