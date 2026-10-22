// S4 pins (7.0 line A): the Triggers util produces its events on the native
// Events layer while many consumers are still jQuery listeners. Real events
// (resize/scroll broadcast, closeme forwarding) reach those jQuery listeners
// through "white absorption" - jQuery applies no namespace filtering to real
// DOM events. The element-local open/toggle dispatches instead use a dual
// transport (native + namespace-filtered jQuery triggerHandler), because a
// real event there would over-deliver to same-type handlers under other
// namespaces. The window-level resize/scroll/closeme listeners stay
// jQuery-registered on purpose: a jQuery-synthesized trigger() only reaches
// jQuery listeners, and real events arrive at the very same listener from
// the native side.
describe('Triggers (native dispatch)', function() {
  var plugins = [];
  var $fixtures = [];

  afterEach(function() {
    plugins.forEach(function(plugin) {
      if (plugin && plugin.$element) {
        plugin.destroy();
      }
    });
    plugins = [];
    $fixtures.forEach(function($el) {
      FoundationNext.Events.off($el[0]);
      $el.remove();
    });
    $fixtures = [];
  });

  function append(html) {
    var $el = $(html).appendTo('body');
    $fixtures.push($el);
    return $el;
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

      var $el = append('<div id="s4-toggle-target" data-toggler="is-visible"></div>');
      var $anchor = append('<span><a data-toggle="s4-toggle-target">Toggle</a></span>');
      var plugin = track(new Foundation.Toggler($el, {}));

      // The anchor sits nested, so the delegated walk through closest() is
      // part of the pin.
      click($anchor.find('a')[0]);

      $el.should.have.class('is-visible');
      $anchor.find('a').should.have.attr('aria-expanded', 'true');

      click($anchor.find('a')[0]);

      $el.should.not.have.class('is-visible');
      $anchor.find('a').should.have.attr('aria-expanded', 'false');
    });

    it('keeps repeated Initializer calls idempotent: one click, one dispatch', function() {
      // Third parties (or Foundation.IHearYou) may call these again at any
      // time; the former off-then-on guard is a module-level flag now.
      Foundation.Triggers.Initializers.addSimpleListeners();
      Foundation.Triggers.Initializers.addSimpleListeners();
      Foundation.Triggers.Initializers.addToggleListener();
      Foundation.Triggers.Initializers.addToggleListener();

      var $el = append('<div id="s4-toggle-idem" data-toggler="is-visible"></div>');
      var $anchor = append('<a data-toggle="s4-toggle-idem">Toggle</a>');
      var plugin = track(new Foundation.Toggler($el, {}));

      var onSpy = sinon.spy();
      FoundationNext.Events.on($el[0], 'on.zf.toggler', onSpy);

      click($anchor[0]);
      $el.should.have.class('is-visible');
      sinon.assert.calledOnce(onSpy);

      click($anchor[0]);
      $el.should.not.have.class('is-visible');
      sinon.assert.calledOnce(onSpy);
    });

    it('opens an un-migrated Reveal through [data-open]: its jQuery listener keeps receiving', function() {
      Foundation.Triggers.Initializers.addSimpleListeners();

      var $modal = append('<div class="reveal" id="s4-reveal" data-reveal>Modal content</div>');
      var $open = append('<a data-open="s4-reveal">Open</a>');
      var plugin = track(new Foundation.Reveal($modal, {}));

      // openListener dispatches 'open.zf.trigger' as a dual transport: native
      // for migrated consumers, namespace-filtered jQuery for this un-migrated
      // one. A real event here would over-deliver to same-type handlers like
      // open.zf.reveal (jQuery cannot namespace-filter real events).
      click($open[0]);

      plugin.isActive.should.be.true;
    });
  });

  describe('closeme broadcast', function() {
    it('forwards closeme.zf.<plugin> natively so un-migrated jQuery consumers still close', function() {
      var $a = append('<div class="dropdown-pane" data-dropdown id="s4-dd-a">A</div>');
      var $b = append('<div class="dropdown-pane" data-dropdown id="s4-dd-b">B</div>');
      append('<button type="button" data-toggle="s4-dd-a">A</button>');
      append('<button type="button" data-toggle="s4-dd-b">B</button>');
      var pluginA = track(new Foundation.Dropdown($a, {}));
      var pluginB = track(new Foundation.Dropdown($b, {}));
      // The window listener only registers when [data-yeti-box] elements
      // exist, so the (plugin-initialized) fixtures come first - the same
      // existence condition as the 6.x code.
      Foundation.Triggers.Initializers.addClosemeListener();

      var nativeSpy = sinon.spy();
      FoundationNext.Events.on($b[0], 'close.zf.trigger', nativeSpy);

      pluginB.open();
      $b.should.have.class('is-open');

      // pluginA.open() fires 'closeme.zf.dropdown' through jQuery (the
      // producer is un-migrated); the window listener forwards it as a real
      // event, and B - a jQuery consumer - must close while A stays open.
      pluginA.open();

      $b.should.not.have.class('is-open');
      $a.should.have.class('is-open');

      // The broadcast also reaches native listeners, with the final-form
      // native element as parameter.
      sinon.assert.calledOnce(nativeSpy);
      nativeSpy.firstCall.args[1].should.equal($b[0]);
    });

    it('builds the closeme listener names dynamically from plugNames', function() {
      var $source = append('<div id="s4-magic-source" data-magic data-yeti-box="s4-magic-source"></div>');
      var $target = append('<div id="s4-magic-target" data-magic></div>');

      // Same existence condition as 6.x: no [data-yeti-box], no listener.
      Foundation.Triggers.Initializers.addClosemeListener('magic');

      var spy = sinon.spy();
      $target.on('close.zf.trigger', spy);

      $source.trigger('closeme.zf.magic', 's4-magic-source');

      sinon.assert.calledOnce(spy);
      // jQuery passes real events without extra parameters: the forwarded
      // element rides in the event detail.
      spy.firstCall.args[0].originalEvent.detail[0].should.equal($target[0]);
    });
  });

  describe('resize/scroll broadcast', function() {
    it('dispatches resizeme.zf.trigger directly to [data-resize] elements, jQuery listeners included', function(done) {
      var $el = append('<div id="s4-resize" data-resize="s4-resize"></div>');

      var jqSpy = sinon.spy();
      $el.on('resizeme.zf.trigger', jqSpy);

      var nativeSpy = sinon.spy();
      FoundationNext.Events.on($el[0], 'resizeme.zf.trigger', nativeSpy);

      Foundation.Triggers.Initializers.addResizeListener(10);
      $(window).trigger('resize');

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
          jqSpy.firstCall.args[0].originalEvent.detail[0].should.equal($el[0]);
          nativeSpy.firstCall.args[1].should.equal($el[0]);
          // The MutationObserver signal attribute is gone.
          chai.expect($el[0].hasAttribute('data-events')).to.be.false;
          done();
        }
      });
    });

    it('dispatches scrollme.zf.trigger directly to [data-scroll] elements', function(done) {
      var $el = append('<div id="s4-scroll" data-scroll="s4-scroll"></div>');

      var jqSpy = sinon.spy();
      $el.on('scrollme.zf.trigger', jqSpy);

      Foundation.Triggers.Initializers.addScrollListener(10);
      $(window).trigger('scroll');

      tryInterval({
        interval: 10,
        timeout: 1000,
        try: () => {
          sinon.assert.calledOnce(jqSpy);
        },
        then: () => {
          jqSpy.firstCall.args[0].originalEvent.detail[0].should.equal($el[0]);
          jqSpy.firstCall.args[0].originalEvent.detail[1].should.equal(window.pageYOffset);
          done();
        }
      });
    });
  });

  describe('core utils', function() {
    it('onLoad runs its handler exactly once through the native layer', function(done) {
      var spy = sinon.spy();
      var eventType = Foundation.onLoad($(window), spy);

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
      Foundation.transitionend($('<div></div>')).should.match(/transitionend$/i);
    });
  });
});
