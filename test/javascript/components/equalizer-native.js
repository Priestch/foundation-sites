// S8 contract pins (7.0 line A): Equalizer's resizeme consumer and the
// equalizer lifecycle events moved to the native Events layer while the
// public contract stays byte-identical. The mutateme consumer joined the
// native layer in the S10 group flip (together with its last
// jQuery-synthesized producers, the Tabs forward and the ResponsiveToggle
// animated half); the changed.zf.mediaquery consumer followed in the S13
// MediaQuery flip and answers the real broadcast. These tests pin that
// contract from the outside; the pre-existing equalizer.js suite is
// untouched on purpose and stays green.
describe('Equalizer (native layer contract)', function() {
  var plugin;
  var html;

  // The main test page loads its stylesheets AFTER the foundation bundle, so
  // the breakpoint list is garbage on this page - re-parse now that the CSS
  // is applied (responsive-toggle-native precedent) before any equalizeOn
  // assertion.
  beforeEach(function() {
    Foundation.MediaQuery._reInit();
  });

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if (html) { html.remove(); html = null; }
  });

  // min-height (not height) on the watched children, so the measurement
  // survives the style.height = 'auto' reset in getHeights(); the flex
  // display keeps both children on one row (_reflow skips stacked rows)
  var template = `
    <div data-equalizer style="display: flex">
      <div data-equalizer-watch style="min-height: 40px">One</div>
      <div data-equalizer-watch style="min-height: 10px">Two</div>
    </div>`;

  function build(options) {
    html = document.body.appendChild(fixture(template));
    plugin = new Foundation.Equalizer(html, options);
    return plugin;
  }

  function watched() {
    return html.querySelectorAll('[data-equalizer-watch]');
  }

  describe('equalization', function() {
    it('equalizes the watched heights at init and writes the state attributes natively', function() {
      build({});
      var elements = watched();

      elements[0].style.height.should.equal('40px');
      elements[1].style.height.should.equal('40px');
      html.getAttribute('data-resize').should.be.a('string');
      html.getAttribute('data-mutate').should.be.a('string');
    });

    it('fires preequalized/postequalized through the native event layer in order', function() {
      html = document.body.appendChild(fixture(template));
      var order = [];
      FoundationNext.Events.on(html, 'preequalized.zf.equalizer', function() { order.push('pre'); });
      FoundationNext.Events.on(html, 'postequalized.zf.equalizer', function() { order.push('post'); });
      plugin = new Foundation.Equalizer(html, {});

      // the init reflow already produced the pair, in order, as real events
      order.should.deep.equal(['pre', 'post']);
      plugin.isOn.should.be.true;
    });

    it('reflows through the native resizeme.zf.trigger (S4 producer, S8 consumer)', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');

      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');

      sinon.assert.calledOnce(reflow);
      reflow.restore();
    });

    it('re-equalizes when a watched element grows, on a native resizeme', function() {
      build({});
      var elements = watched();
      elements[1].style.minHeight = '90px';

      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');

      elements[0].style.height.should.equal('90px');
      elements[1].style.height.should.equal('90px');
    });
  });

  describe('seams', function() {
    it('answers the native mutateme.zf.trigger since the S10 group flip; the jQuery-synthesized form finds nothing', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');

      FoundationNext.Events.trigger(html, 'mutateme.zf.trigger');
      sinon.assert.calledOnce(reflow);

      // the mixed-state boundary: a jQuery-synthesized dispatch never
      // produces a real event, so the flipped consumer cannot hear it.
      // jQuery trigger stays the instrument for the nothing-found half
      $(html).trigger('mutateme.zf.trigger');
      sinon.assert.calledOnce(reflow);
      reflow.restore();
    });

    it('answers the real changed.zf.mediaquery broadcast on the native layer (the S13 MediaQuery flip)', function() {
      // the headless viewport sits between 'small' and 'xxlarge', so 'small'
      // is active and 'xxlarge' is not (responsive-toggle-native precedent)
      build({equalizeOn: 'small'});
      plugin.isOn.should.be.true;

      // the consumer is registered on the native event layer now: the real
      // broadcast re-runs _checkMQ (isOn stays true at this viewport) and
      // the jQuery registry holds no handler anymore
      FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
      plugin.isOn.should.be.true;

      var events = $._data(window, 'events') || {};
      var mqHandlers = (events.changed || []).filter(function(ev) {
        return ev.handler === plugin._bindHandler.onCheckMQBound;
      });
      mqHandlers.length.should.equal(0);
    });
  });

  describe('destroy', function() {
    it('drops the native resizeme and mutateme listeners', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');
      plugin.destroy();
      plugin = null;

      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');
      FoundationNext.Events.trigger(html, 'mutateme.zf.trigger');

      sinon.assert.notCalled(reflow);
      reflow.restore();
    });
  });

  describe('mutateme ecosystem (S10 group flip proof)', function() {
    // The panel content holds the equalizer element carrying [data-mutate],
    // so the Tabs forward of the switch onto its panel lands on it. Before
    // the flip the delivery went to the jQuery listener only (probe on the
    // S9 tip: jQuery 1 / native 0 per delivery); after the flip the same
    // forward is one real bubbling event: the native consumer receives it
    // once and a third-party jQuery listener still absorbs it once - one
    // delivery per listener, no duplicates.
    var tabsTemplate = `<div>
      <ul class="tabs" data-tabs id="eqFlipTabs">
        <li class="tabs-title is-active"><a href="#eqFlipPanel1" aria-selected="true">Tab 1</a></li>
        <li class="tabs-title"><a href="#eqFlipPanel2">Tab 2</a></li>
      </ul>
      <div class="tabs-content" data-tabs-content="eqFlipTabs">
        <div class="tabs-panel is-active" id="eqFlipPanel1">
          <div data-equalizer data-mutate style="display: flex">
            <div data-equalizer-watch style="min-height: 40px">One</div>
          </div>
        </div>
        <div class="tabs-panel" id="eqFlipPanel2"><p>Two</p></div>
      </div>
    </div>`;

    var tabs;
    var wrap;

    afterEach(function() {
      if (tabs) { tabs.destroy(); tabs = null; }
      if (wrap) { wrap.remove(); wrap = null; }
    });

    it('receives the Tabs forward exactly once per delivery, on both transports', function() {
      Foundation.MediaQuery._reInit();
      wrap = document.body.appendChild(fixture(tabsTemplate));
      tabs = new Foundation.Tabs(wrap.querySelector('[data-tabs]'), {});
      var eqEl = wrap.querySelector('[data-equalizer]');
      var eq = new Foundation.Equalizer(eqEl, {});

      // the counters sit on the wrapper: every mutateme of the ecosystem
      // bubbles through it exactly once per producer dispatch
      var nativeCount = 0;
      var jqCount = 0;
      FoundationNext.Events.on(wrap, 'mutateme.zf.trigger', function() { nativeCount++; });
      FoundationNext.Events.on(wrap, 'mutateme.zf.trigger', function() { jqCount++; });

      tabs.selectTab('#eqFlipPanel2'); // no [data-mutate] on the incoming panel
      tabs.selectTab('#eqFlipPanel1'); // one forward onto the equalizer element

      // the flipped consumer hears the native forward, and the third-party
      // jQuery listener absorbs the same single real event - no duplicates
      nativeCount.should.equal(1);
      jqCount.should.equal(1);

      eq.destroy();
    });

    it('receives the native Toggler production exactly once per delivery, on both transports', function() {
      Foundation.MediaQuery._reInit();
      wrap = document.body.appendChild(fixture(`
        <div>
          <button data-toggle="eqFlipMutate">Toggle</button>
          <div id="eqFlipMutate" data-toggler="is-open">
            <div data-mutate data-equalizer style="display: flex">
              <div data-equalizer-watch style="min-height: 40px">One</div>
            </div>
          </div>
        </div>`));
      var eqEl = wrap.querySelector('[data-equalizer]');
      var eq = new Foundation.Equalizer(eqEl, {});
      var tog = new Foundation.Toggler(wrap.querySelector('[data-toggler]'), {});

      // The document-level [data-toggle] delegation arms on window load
      // (Triggers.init); a fast grep-scoped run can finish before that, so
      // arm it explicitly - the triggers-suite determinism precedent.
      Foundation.Triggers.Initializers.addSimpleListeners();

      var nativeCount = 0;
      var jqCount = 0;
      FoundationNext.Events.on(wrap, 'mutateme.zf.trigger', function() { nativeCount++; });
      FoundationNext.Events.on(wrap, 'mutateme.zf.trigger', function() { jqCount++; });

      wrap.querySelector('[data-toggle]').click();

      // the S4-era native production reaches the flipped consumer once; a
      // jQuery listener absorbs the same single real event once
      nativeCount.should.equal(1);
      jqCount.should.equal(1);

      eq.destroy();
      tog.destroy();
    });
  });
});
