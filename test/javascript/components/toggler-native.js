// S3 contract pins (7.0 line A): Toggler's internals moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// These tests pin that contract from the outside; the pre-existing
// toggler.js suite is untouched on purpose.
// S4 update: the toggle.zf.trigger seam was closed on both sides - the two
// mixed-state cases below were flipped and re-pinned accordingly.
describe('Toggler (native layer contract)', function() {
  var plugin;
  var $html;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    $html.remove();
  });

  function appendTriggers() {
    return $(`<div>
      <a data-open="toggler">Open</a>
      <a data-close="toggler">Close</a>
      <a data-toggle="toggler">Toggle</a>
      <a data-toggle="toggler other">Multi</a>
    </div>`).appendTo('body')
  }

  function findTrigger($scope, label) {
    return $scope.find('a').filter(function() {
      return $(this).text() === label;
    });
  }

  describe('state events', function() {
    it('fires on.zf.toggler and off.zf.toggler through the native event layer', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});
      var el = $html[0];

      var onSpy = sinon.spy();
      var offSpy = sinon.spy();
      FoundationNext.Events.on(el, 'on.zf.toggler', onSpy);
      FoundationNext.Events.on(el, 'off.zf.toggler', offSpy);

      plugin._toggleClass();
      sinon.assert.calledOnce(onSpy);
      sinon.assert.notCalled(offSpy);

      plugin._toggleClass();
      sinon.assert.calledOnce(onSpy);
      sinon.assert.calledOnce(offSpy);
    });

    it('fires the state events with the zf.toggler namespace and no extra parameters', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});
      var el = $html[0];

      var onSpy = sinon.spy();
      var offSpy = sinon.spy();
      FoundationNext.Events.on(el, 'on.zf.toggler', onSpy);
      FoundationNext.Events.on(el, 'off.zf.toggler', offSpy);

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
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});

      // The consumer listens on the native event layer now. FoundationNext
      // carries its own copy of the Events module, so the proof crosses the
      // bundles the way every cross-bundle pin here does: through a real
      // event (Events.trigger), which the Toggler's own listener receives.
      FoundationNext.Events.trigger($html[0], 'toggle.zf.trigger', [$html[0]]);
      $html.should.have.class('is-visible');

      FoundationNext.Events.trigger($html[0], 'toggle.zf.trigger');
      $html.should.not.have.class('is-visible');
    });

    it('does not consume toggle.zf.trigger fired on the jQuery side anymore', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});

      // The consumer moved to the native event layer in S4; a jQuery
      // triggerHandler is purely synthetic, so nothing consumes it.
      $html.triggerHandler('toggle.zf.trigger');
      $html.should.not.have.class('is-visible');
    });
  });

  describe('ARIA writes', function() {
    it('updates aria-expanded on the exact-match triggers with native attributes', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      var $triggers = appendTriggers();
      plugin = new Foundation.Toggler($html, {});

      plugin._updateARIA(true);
      findTrigger($triggers, 'Open')[0].getAttribute('aria-expanded').should.equal('true');
      findTrigger($triggers, 'Close')[0].getAttribute('aria-expanded').should.equal('true');
      findTrigger($triggers, 'Toggle')[0].getAttribute('aria-expanded').should.equal('true');
      // "toggler other" matches the ~= scan in _init() but not the exact
      // selector _updateARIA() uses.
      findTrigger($triggers, 'Multi')[0].getAttribute('aria-expanded').should.equal('false');

      plugin._updateARIA(false);
      findTrigger($triggers, 'Open')[0].getAttribute('aria-expanded').should.equal('false');

      $triggers.remove();
    });
  });

  describe('mutateme forwarding', function() {
    it('fires mutateme.zf.trigger on every [data-mutate] descendant', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"><div data-mutate></div><div data-mutate></div></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});
      var mutateEl = $html.find('[data-mutate]')[0];

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
      $html = $('<div id="toggler" class="is-visible" data-toggler="is-visible"></div>').appendTo('body');
      var $triggers = appendTriggers();
      plugin = new Foundation.Toggler($html, {});

      findTrigger($triggers, 'Toggle')[0].getAttribute('aria-expanded').should.equal('true');

      // Knock the class off the element, then let the public reflow path
      // re-parse data-toggler and re-derive the ARIA state.
      $html.removeClass('is-visible');
      Foundation.reInit('Toggler');

      plugin.className.should.equal('is-visible');
      findTrigger($triggers, 'Toggle')[0].getAttribute('aria-expanded').should.equal('false');

      $triggers.remove();
    });

    it('merges converted data attribute values into the plugin options', function() {
      $html = $('<div id="toggler" data-toggler="is-visible" data-delay="42"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});

      plugin.options.delay.should.equal(42);
      plugin.options.delay.should.be.a('number');
    });
  });

  describe('destroy', function() {
    it('clears the registry entry, so the jQuery method resolves nothing anymore', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});

      // Instance lookup through the public surface - this is the Registry.
      $html.foundation('toggle');
      $html.should.have.class('is-visible');

      plugin.destroy();
      plugin = null;

      // With no registered instance left, the method call is rejected and
      // the element state is left untouched.
      chai.expect(function() { $html.foundation('toggle'); }).to.throw(ReferenceError);
      $html.should.have.class('is-visible');
    });

    it('unbinds the zf.toggler listeners on the bare namespace', function() {
      $html = $('<div id="toggler" data-toggler="is-visible"></div>').appendTo('body');
      plugin = new Foundation.Toggler($html, {});

      // Bare-namespace listeners in the component's namespace go with it.
      var goneSpy = sinon.spy();
      var keepSpy = sinon.spy();
      $html.on('custom.zf.toggler', goneSpy);
      $html.on('custom.zf', keepSpy);

      plugin.destroy();
      plugin = null;

      $html.trigger('custom.zf.toggler');
      sinon.assert.notCalled(goneSpy);
      $html.trigger('custom.zf');
      sinon.assert.calledOnce(keepSpy);
    });
  });
});
