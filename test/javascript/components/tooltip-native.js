// S8 contract pins (7.0 line A): Tooltip's open/close events, the
// hover/focus/click consumers and the template creation moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// Known seams: the whole positioning block stays on jQuery objects (the Box
// util consumes/produces jQuery collections and is self-consistent), the
// fade in/out tweens stay on jQuery fx and the closeme production stays on
// jQuery until the S13 Triggers flip. The tap/touchend binding joined the
// native layer with the Touch util's real synthesized tap (S13). These tests
// pin that contract from the outside; the pre-existing tooltip.js suite is
// untouched on purpose and stays green.
describe('Tooltip (native layer contract)', function() {
  var plugin;
  var $html;
  var $scratch = [];
  var counter = 0;

  var template = () => `
    <span data-tooltip aria-haspopup="true" class="has-tip" tabindex="1" title="TOOLTIP_CONTENT">
      TEXT
    </span>`;
  var templateNoTabindex = () => `
    <span data-tooltip aria-haspopup="true" class="has-tip" title="TOOLTIP_CONTENT">
      TEXT
    </span>`;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) { $html.remove(); $html = null; }
    $scratch.forEach(function($el) { $el.remove(); });
    $scratch = [];
    document.activeElement.blur();
    if (window.location.hash) {
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  });

  function build(options, markup) {
    $html = $(markup || template()).appendTo('body');
    plugin = new Foundation.Tooltip($html, Object.assign(
      {showOn: 'all', fadeInDuration: 0, fadeOutDuration: 0}, options));
    return plugin;
  }

  describe('template', function() {
    it('creates the tip element natively and keeps the jQuery template surface', function() {
      build({});
      var tip = plugin.template[0];

      plugin.template.should.have.class('tooltip'); // jQuery collection surface
      tip.tagName.should.equal('DIV');
      tip.getAttribute('role').should.equal('tooltip');
      tip.getAttribute('aria-hidden').should.equal('true');
      tip.getAttribute('data-is-active').should.equal('false');
      tip.getAttribute('id').should.match(/-tooltip$/);
      document.body.contains(tip).should.be.true;
    });
  });

  describe('state events', function() {
    it('fires show.zf.tooltip / hide.zf.tooltip through the native event layer', function() {
      build({});
      var el = $html[0];
      var showSpy = sinon.spy();
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.tooltip', showSpy);
      FoundationNext.Events.on(el, 'hide.zf.tooltip', hideSpy);

      plugin.show();
      sinon.assert.calledOnce(showSpy);
      showSpy.firstCall.args[0].type.should.equal('show');
      showSpy.firstCall.args[0].namespace.should.equal('tooltip.zf');
      plugin.template[0].getAttribute('aria-hidden').should.equal('false');
      plugin.template[0].getAttribute('data-is-active').should.equal('true');

      plugin.hide();
      sinon.assert.calledOnce(hideSpy);
      hideSpy.firstCall.args[0].type.should.equal('hide');
      hideSpy.firstCall.args[0].namespace.should.equal('tooltip.zf');
      plugin.template[0].getAttribute('aria-hidden').should.equal('true');
    });

    it('still reaches jQuery listeners with the real events (white absorption)', function() {
      build({});
      var spy = sinon.spy();
      $html.on('show.zf.tooltip', spy);

      plugin.show();

      sinon.assert.calledOnce(spy);
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('positioning (Box seam)', function() {
    it('keeps the jQuery-object positioning block untouched: the tip gets its position class and inline offset', function() {
      build({});
      plugin.show();

      // Positionable._setPosition ran through Box on jQuery objects and
      // applied the collision-resolved position class plus an inline offset
      plugin.template.should.have.class('top');
      plugin.template[0].style.top.should.not.equal('');
      plugin.template[0].style.left.should.not.equal('');
    });
  });

  describe('closeme chain', function() {
    it('produces closeme.zf.tooltip as a real event with the id on the detail (the S13 Triggers flip)', function() {
      build({});
      // The window closeme listener only registers when [data-yeti-box]
      // elements exist (the 6.x existence condition) - arm HERE, after the
      // fixtures (reveal-native precedent).
      Foundation.Triggers.Initializers.addClosemeListener();
      var closemeSpy = sinon.spy();
      FoundationNext.Events.on(window, 'closeme.zf.tooltip', closemeSpy);
      $scratch.push({remove: () => FoundationNext.Events.off(window, 'closeme.zf.tooltip', closemeSpy)});

      plugin.show();

      sinon.assert.calledOnce(closemeSpy);
      closemeSpy.firstCall.args[0].type.should.equal('closeme');
      closemeSpy.firstCall.args[0].namespace.should.equal('tooltip.zf');
      // the id rides the detail, where the 6.x second trigger parameter sat
      closemeSpy.firstCall.args[1].should.equal(plugin.template.attr('id'));
    });

    it('closes other open tooltips through the real close.zf.trigger broadcast', function() {
      build({}, template().replace('has-tip', 'has-tip tt-anchor-a'));
      var pluginA = plugin;
      var elA = $html[0];
      var hideSpyA = sinon.spy();
      FoundationNext.Events.on(elA, 'hide.zf.tooltip', hideSpyA);

      $html = null;
      build({}, template().replace('has-tip', 'has-tip tt-anchor-b'));
      pluginA.show();

      // showing B broadcasts closeme; A's native close.zf.trigger listener
      // must hide it. The window listener's existence condition needs
      // [data-yeti-box] fixtures in the document, so the chain is armed
      // HERE, after the fixtures (same existence condition as 6.x).
      Foundation.Triggers.Initializers.addClosemeListener();
      plugin.show();

      sinon.assert.calledOnce(hideSpyA);
      pluginA.isActive.should.be.false;
    });
  });

  describe('hover and focus consumers', function() {
    it('opens from a real mouseenter and closes from a real mouseleave (hoverDelay 0)', function(done) {
      build({hoverDelay: 0});
      var el = $html[0];
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'hide.zf.tooltip', hideSpy);

      el.dispatchEvent(new MouseEvent('mouseenter'));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { plugin.isActive.should.be.true; },
        then: () => {
          el.dispatchEvent(new MouseEvent('mouseleave', {relatedTarget: document.body}));
          sinon.assert.calledOnce(hideSpy);
          done();
        }
      });
    });

    it('opens from a real focus and closes from a real focusout', function() {
      build({});
      var el = $html[0];
      var showSpy = sinon.spy();
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.tooltip', showSpy);
      FoundationNext.Events.on(el, 'hide.zf.tooltip', hideSpy);

      el.focus();
      sinon.assert.calledOnce(showSpy);

      el.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
      sinon.assert.calledOnce(hideSpy);
    });

    it('opens from a real mousedown when the anchor has no tabindex', function() {
      build({}, templateNoTabindex());
      var el = $html[0];
      var showSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.tooltip', showSpy);

      el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));

      sinon.assert.calledOnce(showSpy);
      plugin.isActive.should.be.true;
    });

    it('repositions through the native resizeme.zf.trigger while active', function() {
      build({});
      plugin.show();
      var setPosition = sinon.spy(plugin, '_setPosition');

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      sinon.assert.calledOnce(setPosition);
      setPosition.restore();
    });

    it('toggles through a real synthesized tap (the Touch tap flips to the native layer in S13)', function() {
      // hasTouch is checked at _events time: fake the touch capability, then
      // restore it
      Object.defineProperty(window, 'ontouchstart', {configurable: true, value: {}});
      try {
        build({});
        var el = $html[0];

        FoundationNext.Events.trigger(el, 'tap');
        plugin.template[0].getAttribute('data-is-active').should.equal('true');

        FoundationNext.Events.trigger(el, 'tap');
        plugin.template[0].getAttribute('data-is-active').should.equal('false');
      } finally {
        delete window.ontouchstart;
      }
    });
  });

  describe('destroy', function() {
    it('drops the native listeners, the anchor attributes and the template', function() {
      build({});
      var el = $html[0];
      var tip = plugin.template[0];
      plugin.destroy();
      plugin = null;

      var tipsBefore = document.querySelectorAll('.tooltip').length;
      // the flipped consumers are gone: a real hover opens nothing
      el.dispatchEvent(new MouseEvent('mouseenter'));
      document.querySelectorAll('.tooltip').length.should.equal(tipsBefore);
      document.body.contains(tip).should.be.false;
      chai.expect(el.getAttribute('aria-describedby')).to.be.null;
      el.classList.contains('has-tip').should.be.false;
    });
  });
});
