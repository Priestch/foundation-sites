// S10 contract pins (7.0 line A): Sticky's window scroll, resizeme and
// mutateme consumers (element + anchor), the transitionend-family consumer,
// the stuckto/unstuckfrom/pause production and the state class/attribute
// writes moved to the native Events/DOM layer while the public contract
// stays byte-identical; the anchor/容器 calculations read
// getBoundingClientRect + pageYOffset instead of offset() (S7 SmoothScroll
// precedent). The mutateme consumers joined the native layer in this
// slice's group flip, together with the last jQuery-synthesized producers
// (Tabs forward, ResponsiveToggle animated half). Known seams: the css
// writes stay on jQuery (css seam) and the MediaQuery reads stay (MediaQuery
// not migrated). These tests pin that contract from the outside; the
// pre-existing sticky.js suite is a placeholder and stays untouched.
describe('Sticky (native layer contract)', function() {
  var plugin;
  var html;

  // The main test page loads its stylesheets AFTER the foundation bundle, so
  // the breakpoint list is garbage on this page - re-parse now that the CSS
  // is applied (responsive-toggle-native precedent) before any MediaQuery
  // assertion.
  beforeEach(function() {
    Foundation.MediaQuery._reInit();
  });

  afterEach(function() {
    // destroy() nulls instance properties, so skip if the test destroyed it
    // already
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    plugin = null;
    if (html) { html.remove(); html = null; }
    window.scrollTo(0, 0);
  });

  var template = `<div id="stickyNativeAnchor" style="height: 120px">Anchor</div>
    <div data-sticky data-anchor="stickyNativeAnchor" style="height: 50px">Sticky content</div>`;

  function build(options) {
    html = document.body.appendChild(fixture(template));
    plugin = new Foundation.Sticky(html.querySelector('[data-sticky]'), Object.assign({stickyOn: 'small'}, options));
    return plugin;
  }

  // The init flow is deferred through onLoad (setTimeout once the page is
  // loaded), so the listeners only exist after a tick.
  function waitReady(then) {
    tryInterval({
      interval: 10,
      timeout: 2000,
      try: () => { plugin.isOn.should.be.true; },
      then: then
    });
  }

  describe('init()', function() {
    it('wraps the element, writes the state attributes natively and sizes the container', function(done) {
      build({});

      waitReady(() => {
        var el = plugin.$element;
        el.getAttribute('data-resize').should.be.a('string');
        el.getAttribute('data-mutate').should.equal(el.getAttribute('data-resize'));
        el.classList.contains('sticky').should.be.true;
        // the anchor carries the same mutate handle
        document.getElementById('stickyNativeAnchor').getAttribute('data-mutate').should.equal(el.getAttribute('data-mutate'));
        // the auto-created container holds the place with the element height
        el.parentElement.hasAttribute('data-sticky-container').should.be.true;
        el.parentElement.style.height.should.equal('50px');
        done();
      });
    });
  });

  describe('consumers (native layer)', function() {
    it('runs _calc on a real window scroll event (the per-instance namespace filter matches namespace-less real events)', function(done) {
      build({});

      waitReady(() => {
        var calc = sinon.spy(plugin, '_calc');
        window.scrollTo(0, 30);
        window.dispatchEvent(new Event('scroll'));

        tryInterval({
          interval: 10,
          timeout: 2000,
          try: () => { sinon.assert.called(calc); },
          then: () => {
            calc.restore();
            done();
          }
        });
      });
    });

    it('runs _setSizes through the native resizeme.zf.trigger (S4 producer, S10 consumer)', function(done) {
      build({});

      waitReady(() => {
        var setSizes = sinon.spy(plugin, '_setSizes');

        FoundationNext.Events.trigger(plugin.$element, 'resizeme.zf.trigger');

        tryInterval({
          interval: 10,
          timeout: 2000,
          try: () => { sinon.assert.called(setSizes); },
          then: () => {
            setSizes.restore();
            done();
          }
        });
      });
    });

    it('re-runs _setSizes on a real transitionend (M1 off-then-on leak fix, carried to the native layer)', function(done) {
      build({});

      waitReady(() => {
        var setSizes = sinon.spy(plugin, '_setSizes');
        plugin._setSticky();

        // one real end event: exactly one _setSizes pass (the Events.off
        // wipe before the on prevents stacking, like the M1 fix)
        plugin.$element.dispatchEvent(new Event('transitionend'));

        tryInterval({
          interval: 10,
          timeout: 2000,
          try: () => { setSizes.callCount.should.equal(1); },
          then: () => {
            setSizes.restore();
            done();
          }
        });
      });
    });
  });

  describe('seams', function() {
    it('runs _setSizes through the native mutateme on the element and the anchor (S10 group flip); the jQuery-synthesized form finds nothing', function(done) {
      build({});

      waitReady(() => {
        var setSizes = sinon.spy(plugin, '_setSizes');

        // the element and the anchor each deliver once (two listeners)
        FoundationNext.Events.trigger(plugin.$element, 'mutateme.zf.trigger');
        FoundationNext.Events.trigger(document.getElementById('stickyNativeAnchor'), 'mutateme.zf.trigger');
        setSizes.callCount.should.equal(2);

        // the mixed-state boundary: a jQuery-synthesized dispatch never
        // produces a real event, so the flipped consumers cannot hear it.
        // jQuery trigger stays the instrument for the nothing-found half
        $(plugin.$element).trigger('mutateme.zf.trigger');
        $('#stickyNativeAnchor').trigger('mutateme.zf.trigger');
        setSizes.callCount.should.equal(2);

        setSizes.restore();
        done();
      });
    });
  });

  describe('state events', function() {
    it('fires sticky.zf.stuckto:<side> and sticky.zf.unstuckfrom:<side> through the native layer with the class flips', function() {
      build({});
      var el = plugin.$element;
      var stuckSpy = sinon.spy();
      var unstuckSpy = sinon.spy();
      FoundationNext.Events.on(el, 'sticky.zf.stuckto:top', stuckSpy);
      FoundationNext.Events.on(el, 'sticky.zf.unstuckfrom:bottom', unstuckSpy);

      plugin._setSticky();
      sinon.assert.calledOnce(stuckSpy);
      stuckSpy.firstCall.args[0].namespace.should.equal('stuckto:top.zf');
      el.classList.contains('is-stuck').should.be.true;
      el.classList.contains('is-at-top').should.be.true;

      plugin._removeSticky(false);
      sinon.assert.calledOnce(unstuckSpy);
      unstuckSpy.firstCall.args[0].namespace.should.equal('unstuckfrom:bottom.zf');
      el.classList.contains('is-anchored').should.be.true;
      el.classList.contains('is-at-bottom').should.be.true;
    });

    it('fires pause.zf.sticky through the native layer and drops the scroll listener', function() {
      build({});
      var el = plugin.$element;
      var pauseSpy = sinon.spy();
      FoundationNext.Events.on(el, 'pause.zf.sticky', pauseSpy);

      plugin._pauseListeners(plugin.scrollListener);

      sinon.assert.calledOnce(pauseSpy);
      pauseSpy.firstCall.args[0].namespace.should.equal('sticky.zf');
      plugin.isOn.should.be.false;
    });
  });

  describe('destroy', function() {
    it('drops the native scroll/resizeme/mutateme listeners', function(done) {
      build({});

      waitReady(() => {
        var setSizes = sinon.spy(plugin, '_setSizes');
        var el = plugin.$element;
        plugin.destroy();
        plugin = null;

        FoundationNext.Events.trigger(el, 'resizeme.zf.trigger');
        FoundationNext.Events.trigger(el, 'mutateme.zf.trigger');
        window.dispatchEvent(new Event('scroll'));

        sinon.assert.notCalled(setSizes);
        setSizes.restore();
        done();
      });
    });
  });
});
