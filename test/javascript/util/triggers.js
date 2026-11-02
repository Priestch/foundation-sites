// S4/S13 pins (7.0 line A): the Triggers util produces its events on the
// native Events layer while many consumers are still jQuery listeners. Real
// events (resize/scroll broadcast, closeme forwarding) reach those jQuery
// listeners through "white absorption" - jQuery applies no namespace
// filtering to real DOM events. The element-local open/toggle dispatches use
// a dual transport (native + namespace-filtered jQuery triggerHandler),
// because a real event there would over-deliver to same-type handlers under
// other namespaces. Since S13 the window-level resize/scroll/closeme
// listeners are native too: they hear the real window events directly, and
// the closeme producers fire real events through Events.trigger in the same
// slice (the listener is registered per plugin name, so the name is an
// explicit parameter instead of the 6.x namespace derivation).
describe('Triggers (native dispatch)', function() {
  var plugins = [];
  var fixtures = [];

  afterEach(function() {
    plugins.forEach(function(plugin) {
      if (plugin && plugin.$element) {
        plugin.destroy();
      }
    });
    plugins = [];
    fixtures.forEach(function(el) {
      FoundationNext.Events.off(el);
      el.remove();
    });
    fixtures = [];
  });

  function append(html) {
    var el = document.body.appendChild(fixture(html));
    fixtures.push(el);
    return el;
  }

  function track(plugin) {
    plugins.push(plugin);
    return plugin;
  }

  function click(el) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  describe('document delegation', function() {
    it('delegates a click on [data-toggle] to Toggler through the native layer', function() {
      // Delegates are flag-guarded; the explicit call keeps this suite
      // deterministic no matter when the load-time init ran.
      Foundation.Triggers.Initializers.addSimpleListeners();

      var el = append('<div id="s4-toggle-target" data-toggler="is-visible"></div>');
      var anchor = append('<span><a data-toggle="s4-toggle-target">Toggle</a></span>');
      var plugin = track(new Foundation.Toggler(el, {}));

      // The anchor sits nested, so the delegated walk through closest() is
      // part of the pin.
      click(anchor.querySelector('a'));

      el.classList.contains('is-visible').should.be.true;
      anchor.querySelector('a').getAttribute('aria-expanded').should.equal('true');

      click(anchor.querySelector('a'));

      el.classList.contains('is-visible').should.be.false;
      anchor.querySelector('a').getAttribute('aria-expanded').should.equal('false');
    });

    it('arms the delegation exactly once across repeated init() calls: the window flag dedupes module copies (8x toggle storm regression)', function() {
      // The docs layout loads the foundation.js monolith next to the
      // per-plugin chain; each Triggers module copy used to arm its own
      // delegation set, so one click ran toggle N times - which nets to
      // "closed" for every open/close style interaction. The armed flag
      // lives on window precisely so copies dedupe each other.
      (window.zfTriggersArmed === true).should.be.true;

      var el = append('<div id="s4-toggle-dedup" data-toggler="is-visible"></div>');
      var anchor2 = append('<a data-toggle="s4-toggle-dedup">Toggle</a>');
      var plugin = track(new Foundation.Toggler(el, {}));

      var onSpy = sinon.spy();
      FoundationNext.Events.on(el, 'on.zf.toggler', onSpy);

      // A second init (another copy, or a re-init after the flag was lost)
      // must not install a second delegation set.
      Foundation.Triggers.init();
      Foundation.Triggers.init();

      click(anchor2);
      el.classList.contains('is-visible').should.be.true;
      sinon.assert.calledOnce(onSpy);

      // With the flag removed the next init() legitimately re-arms (the
      // self-healing contract) - but then exactly one set exists again:
      // close (fires 'off', not 'on'), then open fires 'on' exactly once
      // more. A duplicate delegation set would double-fire both.
      delete window.zfTriggersArmed;
      Foundation.Triggers.init();
      click(anchor2);
      el.classList.contains('is-visible').should.be.false;
      sinon.assert.calledOnce(onSpy);
      click(anchor2);
      el.classList.contains('is-visible').should.be.true;
      sinon.assert.calledTwice(onSpy);
    });

    it('keeps repeated Initializer calls idempotent: one click, one dispatch', function() {
      // Third parties (or Foundation.IHearYou) may call these again at any
      // time; the former off-then-on guard is a module-level flag now.
      Foundation.Triggers.Initializers.addSimpleListeners();
      Foundation.Triggers.Initializers.addSimpleListeners();
      Foundation.Triggers.Initializers.addToggleListener();
      Foundation.Triggers.Initializers.addToggleListener();

      var el = append('<div id="s4-toggle-idem" data-toggler="is-visible"></div>');
      var anchor = append('<a data-toggle="s4-toggle-idem">Toggle</a>');
      var plugin = track(new Foundation.Toggler(el, {}));

      var onSpy = sinon.spy();
      FoundationNext.Events.on(el, 'on.zf.toggler', onSpy);

      click(anchor);
      el.classList.contains('is-visible').should.be.true;
      sinon.assert.calledOnce(onSpy);

      click(anchor);
      el.classList.contains('is-visible').should.be.false;
      sinon.assert.calledOnce(onSpy);
    });

    it('opens an un-migrated Reveal through [data-open]: its jQuery listener keeps receiving', function() {
      Foundation.Triggers.Initializers.addSimpleListeners();

      var modal = append('<div class="reveal" id="s4-reveal" data-reveal>Modal content</div>');
      var open = append('<a data-open="s4-reveal">Open</a>');
      var plugin = track(new Foundation.Reveal(modal, {}));

      // openListener dispatches 'open.zf.trigger' as a dual transport: native
      // for migrated consumers, namespace-filtered jQuery for this un-migrated
      // one. A real event here would over-deliver to same-type handlers like
      // open.zf.reveal (jQuery cannot namespace-filter real events).
      click(open);

      plugin.isActive.should.be.true;
    });
  });

  describe('closeme broadcast', function() {
    it('forwards closeme.zf.<plugin> natively so jQuery consumers still close (S13: native producer, native listener)', function() {
      var a = append('<div class="dropdown-pane" data-dropdown id="s4-dd-a">A</div>');
      var b = append('<div class="dropdown-pane" data-dropdown id="s4-dd-b">B</div>');
      append('<button type="button" data-toggle="s4-dd-a">A</button>');
      append('<button type="button" data-toggle="s4-dd-b">B</button>');
      var pluginA = track(new Foundation.Dropdown(a, {}));
      var pluginB = track(new Foundation.Dropdown(b, {}));
      // The window listener only registers when [data-yeti-box] elements
      // exist, so the (plugin-initialized) fixtures come first - the same
      // existence condition as the 6.x code.
      Foundation.Triggers.Initializers.addClosemeListener();

      var nativeSpy = sinon.spy();
      // native listener on purpose: the pinned contract is the extra-param
      // shape (forwarded element as args[1]) only the Events layer delivers
      FoundationNext.Events.on(b, 'close.zf.trigger', nativeSpy);

      pluginB.open();
      b.classList.contains('is-open').should.be.true;

      // pluginA.open() fires 'closeme.zf.dropdown' as a real, bubbling
      // event (S13 producer flip); the native window listener forwards it as
      // a real event, and B - a jQuery consumer - must close while A stays
      // open.
      pluginA.open();

      b.classList.contains('is-open').should.be.false;
      a.classList.contains('is-open').should.be.true;

      // The broadcast also reaches native listeners, with the final-form
      // native element as parameter.
      sinon.assert.calledOnce(nativeSpy);
      nativeSpy.firstCall.args[1].should.equal(b);
    });

    it('keeps the native chain armed across re-initialization and reads the id from the detail (S13)', function() {
      var a = append('<div class="dropdown-pane" data-dropdown id="s13-dd-a">A</div>');
      var b = append('<div class="dropdown-pane" data-dropdown id="s13-dd-b">B</div>');
      append('<button type="button" data-toggle="s13-dd-a">A</button>');
      append('<button type="button" data-toggle="s13-dd-b">B</button>');
      var pluginA = track(new Foundation.Dropdown(a, {}));
      var pluginB = track(new Foundation.Dropdown(b, {}));
      Foundation.Triggers.Initializers.addClosemeListener();
      // third parties / plugin inits re-run the initializer freely: the
      // per-name flags keep exactly one window listener (one broadcast)
      Foundation.Triggers.Initializers.addClosemeListener();

      // round one: opening A closes B
      pluginB.open();
      pluginA.open();
      b.classList.contains('is-open').should.be.false;
      a.classList.contains('is-open').should.be.true;

      // close both, then round two through a fresh broadcast
      pluginA.close();
      pluginB.open();
      pluginA.open();

      // B closed again and A stayed open: the id comparison used the
      // detail-carried plugin id (A's id), not a stale or shared value
      b.classList.contains('is-open').should.be.false;
      a.classList.contains('is-open').should.be.true;
    });

    it('builds the closeme listener names dynamically from plugNames', function() {
      var source = append('<div id="s4-magic-source" data-magic data-yeti-box="s4-magic-source"></div>');
      var target = append('<div id="s4-magic-target" data-magic></div>');

      // Same existence condition as 6.x: no [data-yeti-box], no listener.
      Foundation.Triggers.Initializers.addClosemeListener('magic');

      var spy = sinon.spy();
      // jQuery listener on purpose: the pinned contract is the white-absorption
      // shape (forwarded element via originalEvent.detail), which only a
      // jQuery listener sees
      $(target).on('close.zf.trigger', spy);

      // S13: the window listener is native, so the producer drives the real
      // event through the Events layer (a jQuery trigger would not reach it).
      FoundationNext.Events.trigger(source, 'closeme.zf.magic', ['s4-magic-source']);

      sinon.assert.calledOnce(spy);
      // jQuery passes real events without extra parameters: the forwarded
      // element rides in the event detail.
      spy.firstCall.args[0].originalEvent.detail[0].should.equal(target);
    });
  });

  describe('resize/scroll broadcast', function() {
    it('dispatches resizeme.zf.trigger directly to [data-resize] elements, jQuery listeners included', function(done) {
      var el = append('<div id="s4-resize" data-resize="s4-resize"></div>');

      var jqSpy = sinon.spy();
      $(el).on('resizeme.zf.trigger', jqSpy);

      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(el, 'resizeme.zf.trigger', nativeSpy);

      Foundation.Triggers.Initializers.addResizeListener(10);
      // S13: the window listener is native - a real resize event drives it
      window.dispatchEvent(new Event('resize'));

      tryInterval({
        interval: 10,
        timeout: 1000,
        try: () => {
          sinon.assert.calledOnce(jqSpy);
          sinon.assert.calledOnce(nativeSpy);
        },
        then: () => {
          // The mixed-state proof: the jQuery listener received the native
          // dispatch. jQuery passes real events without extra parameters, so
          // the forwarded element rides in the event detail.
          jqSpy.firstCall.args[0].originalEvent.detail[0].should.equal(el);
          nativeSpy.firstCall.args[1].should.equal(el);
          // The MutationObserver signal attribute is gone.
          chai.expect(el.hasAttribute('data-events')).to.be.false;
          done();
        }
      });
    });

    it('dispatches scrollme.zf.trigger directly to [data-scroll] elements', function(done) {
      var el = append('<div id="s4-scroll" data-scroll="s4-scroll"></div>');

      var jqSpy = sinon.spy();
      $(el).on('scrollme.zf.trigger', jqSpy);

      Foundation.Triggers.Initializers.addScrollListener(10);
      // S13: the window listener is native - a real scroll event drives it
      window.dispatchEvent(new Event('scroll'));

      tryInterval({
        interval: 10,
        timeout: 1000,
        try: () => {
          sinon.assert.calledOnce(jqSpy);
        },
        then: () => {
          jqSpy.firstCall.args[0].originalEvent.detail[0].should.equal(el);
          jqSpy.firstCall.args[0].originalEvent.detail[1].should.equal(window.pageYOffset);
          done();
        }
      });
    });
  });

  describe('core utils', function() {
    it('onLoad runs its handler exactly once through the native layer', function(done) {
      var spy = sinon.spy();
      var eventType = Foundation.onLoad(window, spy);

      eventType.should.match(/^(_didLoad|load)\.zf\.util\.onLoad$/);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          sinon.assert.calledOnce(spy);
        },
        then: () => {
          // Namespaces stay jQuery-style sorted on the dispatched event.
          spy.firstCall.args[0].namespace.should.equal('onLoad.util.zf');
          done();
        }
      });
    });

    it('transitionend returns the event type for the current browser', function() {
      // The trigger fallback below this return only runs on engines without
      // CSS transition support, which the baseline browsers no longer have.
      // Headless Chrome resolves the prefixed webkitTransitionEnd, since
      // WebkitTransition is the last supported key in the lookup table.
      Foundation.transitionend(document.createElement("div")).should.match(/transitionend$/i);
    });
  });
});
