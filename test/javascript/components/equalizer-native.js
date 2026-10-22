// S8 contract pins (7.0 line A): Equalizer's resizeme consumer and the
// equalizer lifecycle events moved to the native Events layer while the
// public contract stays byte-identical. Known seams: the changed.zf.mediaquery
// consumer stays on jQuery (MediaQuery still synthesizes it) and the mutateme
// consumer stays on jQuery (the mutateme ecosystem still carries
// jQuery-synthesized producers). These tests pin that contract from the
// outside; the pre-existing equalizer.js suite is untouched on purpose and
// stays green.
describe('Equalizer (native layer contract)', function() {
  var plugin;
  var $html;

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
    if ($html) { $html.remove(); $html = null; }
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
    $html = $(template).appendTo('body');
    plugin = new Foundation.Equalizer($html, options);
    return plugin;
  }

  function watched() {
    return $html[0].querySelectorAll('[data-equalizer-watch]');
  }

  describe('equalization', function() {
    it('equalizes the watched heights at init and writes the state attributes natively', function() {
      build({});
      var elements = watched();

      elements[0].style.height.should.equal('40px');
      elements[1].style.height.should.equal('40px');
      $html[0].getAttribute('data-resize').should.be.a('string');
      $html[0].getAttribute('data-mutate').should.be.a('string');
    });

    it('fires preequalized/postequalized through the native event layer in order', function() {
      $html = $(template).appendTo('body');
      var order = [];
      FoundationNext.Events.on($html[0], 'preequalized.zf.equalizer', function() { order.push('pre'); });
      FoundationNext.Events.on($html[0], 'postequalized.zf.equalizer', function() { order.push('post'); });
      plugin = new Foundation.Equalizer($html, {});

      // the init reflow already produced the pair, in order, as real events
      order.should.deep.equal(['pre', 'post']);
      plugin.isOn.should.be.true;
    });

    it('reflows through the native resizeme.zf.trigger (S4 producer, S8 consumer)', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      sinon.assert.calledOnce(reflow);
      reflow.restore();
    });

    it('re-equalizes when a watched element grows, on a native resizeme', function() {
      build({});
      var elements = watched();
      elements[1].style.minHeight = '90px';

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      elements[0].style.height.should.equal('90px');
      elements[1].style.height.should.equal('90px');
    });
  });

  describe('seams', function() {
    it('keeps answering the jQuery-synthesized mutateme.zf.trigger (the mutateme seam stays jQuery-side)', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');

      $html.trigger('mutateme.zf.trigger');

      sinon.assert.calledOnce(reflow);
      reflow.restore();
    });

    it('keeps the changed.zf.mediaquery consumer on the jQuery side (the MediaQuery seam)', function() {
      // the headless viewport sits between 'small' and 'xxlarge', so 'small'
      // is active and 'xxlarge' is not (responsive-toggle-native precedent)
      build({equalizeOn: 'small'});
      plugin.isOn.should.be.true;

      // the consumer is registered in the jQuery event registry, exactly
      // where the pre-existing equalizer.js suite probes for it
      var events = $._data(window, 'events') || {};
      var mqHandlers = (events.changed || []).filter(function(ev) {
        return ev.handler === plugin._bindHandler.onCheckMQBound;
      });
      mqHandlers.length.should.equal(1);

      // the jQuery-synthesized broadcast is answered through that listener
      $(window).trigger('changed.zf.mediaquery');
      plugin.isOn.should.be.true;
    });
  });

  describe('destroy', function() {
    it('drops the native resizeme listener and the jQuery mutateme listener', function() {
      build({});
      var reflow = sinon.spy(plugin, '_reflow');
      plugin.destroy();
      plugin = null;

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');
      $html.trigger('mutateme.zf.trigger');

      sinon.assert.notCalled(reflow);
      reflow.restore();
    });
  });
});
