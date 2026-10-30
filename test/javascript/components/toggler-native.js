// S3 contract pins (7.0 line A): Toggler's internals moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// These tests pin that contract from the outside.
// S4 update: the toggle.zf.trigger seam was closed on both sides - the two
// mixed-state cases below were flipped and re-pinned accordingly.
// S15 update: the suite itself runs on the native test stack - native
// fixtures, native events, no jQuery.
describe('Toggler (native layer contract)', function() {
  var plugin;
  var html;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    html.remove();
  });

  function appendTriggers() {
    var scope = fixture(`<div>
      <a data-open="toggler">Open</a>
      <a data-close="toggler">Close</a>
      <a data-toggle="toggler">Toggle</a>
      <a data-toggle="toggler other">Multi</a>
    </div>`);
    document.body.appendChild(scope);
    return scope;
  }

  function findTrigger(scope, label) {
    return Array.from(scope.querySelectorAll('a')).find(function(a) {
      return a.textContent === label;
    });
  }

  describe('state events', function() {
    it('fires on.zf.toggler and off.zf.toggler through the native event layer', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      var onSpy = sinon.spy();
      var offSpy = sinon.spy();
      FoundationNext.Events.on(html, 'on.zf.toggler', onSpy);
      FoundationNext.Events.on(html, 'off.zf.toggler', offSpy);

      plugin._toggleClass();
      sinon.assert.calledOnce(onSpy);
      sinon.assert.notCalled(offSpy);

      plugin._toggleClass();
      sinon.assert.calledOnce(onSpy);
      sinon.assert.calledOnce(offSpy);
    });

    it('fires the state events with the zf.toggler namespace and no extra parameters', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      var onSpy = sinon.spy();
      var offSpy = sinon.spy();
      FoundationNext.Events.on(html, 'on.zf.toggler', onSpy);
      FoundationNext.Events.on(html, 'off.zf.toggler', offSpy);

      plugin._toggleClass();
      plugin._toggleClass();

      onSpy.firstCall.args.length.should.equal(1);
      // jQuery normalizes event namespaces into sorted order; so does the
      // native event layer.
      onSpy.firstCall.args[0].namespace.should.equal('toggler.zf');
      onSpy.firstCall.args[0].type.should.equal('on');
      offSpy.firstCall.args.length.should.equal(1);
      offSpy.firstCall.args[0].namespace.should.equal('toggler.zf');
      offSpy.firstCall.args[0].type.should.equal('off');
    });
  });

  describe('toggle.zf.trigger consumption', function() {
    // S4: the Triggers util dispatches 'toggle.zf.trigger' on the native
    // event layer and the consumer listens there too - the S3 seam is closed
    // on both sides in one move.
    it('toggles through toggle.zf.trigger fired on the native event layer', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      // The consumer listens on the native event layer now. FoundationNext
      // carries its own copy of the Events module, so the proof crosses the
      // bundles the way every cross-bundle pin here does: through a real
      // event (Events.trigger), which the Toggler's own listener receives.
      FoundationNext.Events.trigger(html, 'toggle.zf.trigger', [html]);
      html.classList.contains('is-visible').should.be.true;

      FoundationNext.Events.trigger(html, 'toggle.zf.trigger');
      html.classList.contains('is-visible').should.be.false;
    });

    it('triggerHandler deliveries are real but never bubble (7.0 transport)', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      var wrap = document.createElement('div');
      wrap.appendChild(html);
      document.body.appendChild(wrap);
      plugin = new Foundation.Toggler(html, {});

      // 7.0 semantics: triggerHandler dispatches a real NON-BUBBLING event
      // (the shared transport between the per-bundle Events tables). The
      // same-element consumer receives it...
      FoundationNext.Events.triggerHandler(html, 'toggle.zf.trigger');
      html.classList.contains('is-visible').should.be.true;

      // ...and an ancestor listener never does (the jQuery no-bubble form).
      var ancestorHeard = 0;
      FoundationNext.Events.one(wrap, 'toggle.zf.trigger', function() { ancestorHeard++; });
      FoundationNext.Events.triggerHandler(html, 'toggle.zf.trigger');
      ancestorHeard.should.equal(0);

      wrap.remove();
    });
  });

  describe('ARIA writes', function() {
    it('updates aria-expanded on the exact-match triggers with native attributes', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      plugin._updateARIA(true);
      findTrigger(scope, 'Open').getAttribute('aria-expanded').should.equal('true');
      findTrigger(scope, 'Close').getAttribute('aria-expanded').should.equal('true');
      findTrigger(scope, 'Toggle').getAttribute('aria-expanded').should.equal('true');
      // "toggler other" matches the ~= scan in _init() but not the exact
      // selector _updateARIA() uses.
      findTrigger(scope, 'Multi').getAttribute('aria-expanded').should.equal('false');

      plugin._updateARIA(false);
      findTrigger(scope, 'Open').getAttribute('aria-expanded').should.equal('false');

      scope.remove();
    });
  });

  describe('mutateme forwarding', function() {
    it('fires mutateme.zf.trigger on every [data-mutate] descendant', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"><div data-mutate></div><div data-mutate></div></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});
      var mutateEl = html.querySelector('[data-mutate]');

      var spy = sinon.spy();
      FoundationNext.Events.on(mutateEl, 'mutateme.zf.trigger', spy);

      plugin._toggleClass();

      sinon.assert.calledOnce(spy);
      spy.firstCall.thisValue.should.equal(mutateEl);
      spy.firstCall.args.length.should.equal(1);
      spy.firstCall.args[0].namespace.should.equal('trigger.zf');
    });
  });

  describe('re-init', function() {
    it('re-parses the toggler state and re-syncs the trigger ARIA through reInit', function() {
      html = fixture('<div id="toggler" class="is-visible" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      findTrigger(scope, 'Toggle').getAttribute('aria-expanded').should.equal('true');

      // Knock the class off the element, then let the public reflow path
      // re-parse data-toggler and re-derive the ARIA state.
      html.classList.remove('is-visible');
      Foundation.reInit('Toggler');

      plugin.className.should.equal('is-visible');
      findTrigger(scope, 'Toggle').getAttribute('aria-expanded').should.equal('false');

      scope.remove();
    });

    it('merges converted data attribute values into the plugin options', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible" data-delay="42"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin.options.delay.should.equal(42);
      plugin.options.delay.should.be.a('number');
    });
  });

  describe('destroy', function() {
    it('clears the registry entry, so the element can host a fresh instance', function() {
      html = fixture('<div id="toggler" data-toggler="is-visible"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin.toggle();
      html.classList.contains('is-visible').should.be.true;

      plugin.destroy();
      plugin = null;

      // no stale registry entry in the way: the same element hosts a fresh
      // instance and it drives the element (this is what the cleared entry
      // protects; the toggled class itself survives destroy by design, so
      // reset it first)
      html.classList.remove('is-visible');
      plugin = new Foundation.Toggler(html, {});
      plugin.toggle();
      html.classList.contains('is-visible').should.be.true;
      plugin.toggle();
      html.classList.contains('is-visible').should.be.false;
    });
  });
});
