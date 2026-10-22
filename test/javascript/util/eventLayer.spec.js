// Dual-column differential spec for the 7.0 event/registry/DOM layer.
//
// Implementation-independent: everything goes through the injected backend
// (see eventLayer.backends.js). Each case below is drawn from the library's
// actual usage surface; a case is only asserted when both the jQuery golden
// master and the native FoundationNext layer can satisfy it identically.
//
// Known, deliberate divergences that are therefore NOT asserted here:
// - visible(): the native layer uses narrow (display-only) semantics while
//   the jQuery adapter maps to the wide :visible; zero-size and detached
//   elements would disagree and are reported separately.
// - jQuery also fires `el.onclick` property handlers along the trigger path
//   and orders delegates before direct handlers on the same element; the
//   library uses neither, so they are not modeled.

(function(global) {
  function click(el) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  function spec(backendName, makeBackend) {
    describe('Event layer semantics — ' + backendName + ' backend', function() {
      var backend, $container, el;

      beforeEach(function() {
        backend = makeBackend();
        $container = $('<div id="diff-container"></div>').appendTo('body');
        el = document.createElement('button');
        $container[0].appendChild(el);
      });

      afterEach(function() {
        // off() on the suite's own fixture elements only — never on shared
        // roots like document.
        backend.off(el);
        backend.off($container[0]);
        $container.remove();
      });

      describe('off() — the four forms', function() {
        it('removes an exact type + namespace: off(el, "open.zf.toggler")', function() {
          var removed = sinon.spy();
          var kept = sinon.spy();

          backend.on(el, 'open.zf.toggler', removed);
          backend.on(el, 'open.zf.other', kept);
          backend.off(el, 'open.zf.toggler');

          backend.trigger(el, 'open.zf.toggler');
          backend.trigger(el, 'open.zf.other');

          sinon.assert.notCalled(removed);
          sinon.assert.calledOnce(kept);
        });

        it('removes a whole bare namespace: off(el, ".zf.toggler")', function() {
          var open = sinon.spy();
          var close = sinon.spy();
          var kept = sinon.spy();

          backend.on(el, 'open.zf.toggler', open);
          backend.on(el, 'close.zf.toggler', close);
          backend.on(el, 'open.zf.other', kept);
          backend.off(el, '.zf.toggler');

          backend.trigger(el, 'open.zf.toggler');
          backend.trigger(el, 'close.zf.toggler');
          backend.trigger(el, 'open.zf.other');

          sinon.assert.notCalled(open);
          sinon.assert.notCalled(close);
          sinon.assert.calledOnce(kept);
        });

        it('treats multi-segment namespaces as a flat set', function() {
          var full = sinon.spy();
          var shorter = sinon.spy();

          // Handler namespaces {zf, trigger, revealScrollbarListener} contain
          // zf AND trigger: off('resizeme.zf.trigger') removes it.
          backend.on(el, 'resizeme.zf.trigger.revealScrollbarListener', full);
          backend.off(el, 'resizeme.zf.trigger');
          backend.trigger(el, 'resizeme.zf.trigger.revealScrollbarListener');
          sinon.assert.notCalled(full);

          // {zf, trigger} does not contain revealScrollbarListener: the
          // longer off() must not touch it.
          backend.on(el, 'resizeme.zf.trigger', shorter);
          backend.off(el, 'resizeme.zf.trigger.revealScrollbarListener');
          backend.trigger(el, 'resizeme.zf.trigger');
          sinon.assert.calledOnce(shorter);
        });

        it('removes everything on the element: off(el)', function() {
          var first = sinon.spy();
          var second = sinon.spy();

          backend.on(el, 'open.zf.test', first);
          backend.on(el, 'click.zf.other', second);
          backend.off(el);

          backend.trigger(el, 'open.zf.test');
          click(el);

          sinon.assert.notCalled(first);
          sinon.assert.notCalled(second);
        });
      });

      describe('one()', function() {
        it('fires the handler exactly once across several triggers', function() {
          var spy = sinon.spy();

          backend.one(el, 'open.zf.test', spy);
          backend.trigger(el, 'open.zf.test');
          backend.trigger(el, 'open.zf.test');

          sinon.assert.calledOnce(spy);
        });

        it('does not fire after the handler was unbound', function() {
          var spy = sinon.spy();

          backend.one(el, 'open.zf.test', spy);
          backend.off(el, 'open.zf.test', spy);
          backend.trigger(el, 'open.zf.test');

          sinon.assert.notCalled(spy);
        });
      });

      describe('trigger()', function() {
        it('bubbles to the parent element', function() {
          var parentSpy = sinon.spy();

          backend.on($container[0], 'open.zf.toggler', parentSpy);
          backend.trigger(el, 'open.zf.toggler');

          sinon.assert.calledOnce(parentSpy);
        });

        it('bubbles to the document', function() {
          var docSpy = sinon.spy();

          backend.on(document, 'open.zf.diff', docSpy);
          backend.trigger(el, 'open.zf.diff');
          backend.off(document, 'open.zf.diff', docSpy);

          sinon.assert.calledOnce(docSpy);
        });

        it('passes extra parameters to the handler in order', function() {
          var spy = sinon.spy();
          var payload = { key: 'value' };

          backend.on(el, 'close.zf.reveal', spy);
          backend.trigger(el, 'close.zf.reveal', [42, 'two', payload]);

          sinon.assert.calledOnce(spy);
          spy.firstCall.args[1].should.equal(42);
          spy.firstCall.args[2].should.equal('two');
          spy.firstCall.args[3].should.equal(payload);
        });

        it('carries a jQuery-style sorted namespace string on the event', function() {
          var spy = sinon.spy();

          backend.on(el, 'closeme.zf.reveal', spy);
          backend.trigger(el, 'closeme.zf.reveal');

          spy.firstCall.args[0].namespace.should.equal('reveal.zf');
        });

        it('calls the same-named native method for trigger("focus")', function() {
          var input = document.createElement('input');
          $container[0].appendChild(input);
          var focusSpy = sinon.spy(input, 'focus');
          var handler = sinon.spy();

          try {
            backend.on(input, 'focus.zf.test', handler);
            backend.trigger(input, 'focus');

            sinon.assert.calledOnce(focusSpy);
            sinon.assert.calledOnce(handler);
          } finally {
            focusSpy.restore();
          }
        });
      });

      describe('triggerHandler()', function() {
        it('returns the handler return value', function() {
          backend.on(el, 'toggle.zf.test', function() {
            return 'the-result';
          });

          backend.triggerHandler(el, 'toggle.zf.test').should.equal('the-result');
        });

        it('does not bubble', function() {
          var parentSpy = sinon.spy();

          backend.on($container[0], 'toggle.zf.trigger', parentSpy);
          backend.triggerHandler(el, 'toggle.zf.trigger');

          sinon.assert.notCalled(parentSpy);
        });

        it('only runs handlers on the target element itself', function() {
          var childSpy = sinon.spy();
          var child = document.createElement('span');
          el.appendChild(child);

          backend.on(child, 'toggle.zf.trigger', childSpy);
          backend.triggerHandler(el, 'toggle.zf.trigger');

          sinon.assert.notCalled(childSpy);
        });
      });

      describe('delegate()', function() {
        it('fires for a descendant matching the selector, with this set to the match', function() {
          var delegated = sinon.spy();
          el.setAttribute('data-open', 'x');

          backend.delegate($container[0], 'click.zf.trigger', '[data-open]', delegated);
          click(el);

          sinon.assert.calledOnce(delegated);
          delegated.firstCall.thisValue.should.equal(el);
        });

        it('fires when the event target is the matching element itself', function() {
          var delegated = sinon.spy();
          var target = document.createElement('a');
          target.setAttribute('data-open', 'x');
          $container[0].appendChild(target);

          backend.delegate($container[0], 'click.zf.trigger', '[data-open]', delegated);
          click(target);

          sinon.assert.calledOnce(delegated);
          delegated.firstCall.thisValue.should.equal(target);
        });

        it('walks up with closest through intermediate elements', function() {
          var delegated = sinon.spy();
          var button = document.createElement('button');
          button.setAttribute('data-toggle', 'y');
          var span = document.createElement('span');
          button.appendChild(span);
          $container[0].appendChild(button);

          backend.delegate($container[0], 'click.zf.trigger', '[data-toggle]', delegated);
          click(span);

          sinon.assert.calledOnce(delegated);
          delegated.firstCall.thisValue.should.equal(button);
        });
      });

      describe('registry point queries', function() {
        it('starts empty, stores, and reads back an instance', function() {
          var instance = { name: 'probe' };

          backend.registry.has(el).should.be.false;

          backend.registry.setInstance(el, instance);

          backend.registry.has(el).should.be.true;
          backend.registry.getInstance(el).should.equal(instance);
        });

        it('overwrites a previous instance on the same element', function() {
          var first = { name: 'first' };
          var second = { name: 'second' };

          backend.registry.setInstance(el, first);
          backend.registry.setInstance(el, second);

          backend.registry.getInstance(el).should.equal(second);
        });

        it('removes the entry and reports the removal', function() {
          backend.registry.setInstance(el, { name: 'probe' });

          backend.registry.removeInstance(el);

          backend.registry.has(el).should.be.false;
        });
      });

      describe('datasetOptions()', function() {
        it('collects data-* attributes as a camelCased object', function() {
          el.setAttribute('data-foo-bar', 'hello');
          el.setAttribute('data-simple', 'world');

          backend.helpers.datasetOptions(el).should.deep.equal({
            fooBar: 'hello',
            simple: 'world'
          });
        });

        it('does not convert value types', function() {
          el.setAttribute('data-flag', 'true');
          el.setAttribute('data-num', '42');
          el.setAttribute('data-empty', '');

          var options = backend.helpers.datasetOptions(el);

          options.flag.should.equal('true');
          options.num.should.equal('42');
          options.empty.should.equal('');
        });
      });

      describe('visible()', function() {
        it('is true for a rendered element', function() {
          backend.helpers.visible(el).should.be.true;
        });

        it('is false for an element with display:none', function() {
          el.style.display = 'none';

          backend.helpers.visible(el).should.be.false;
        });

        it('is false when an ancestor is display:none', function() {
          $container.css('display', 'none');

          backend.helpers.visible(el).should.be.false;
        });
      });

      describe('q()', function() {
        it('finds the first match inside the context', function() {
          $container.append('<span id="diff-q-a"></span><span id="diff-q-b"></span>');

          backend.helpers.q('span', $container[0]).id.should.equal('diff-q-a');
        });

        it('returns null when nothing matches', function() {
          chai.expect(backend.helpers.q('span', $container[0])).to.not.exist;
        });
      });
    });
  }

  // eventLayer.backends.js sorts before this file in the concatenated test
  // bundle, so the factories are defined by the time this runs.
  Object.keys(global.FoundationEventBackends).forEach(function(key) {
    spec(key, global.FoundationEventBackends[key]);
  });
})(window);
