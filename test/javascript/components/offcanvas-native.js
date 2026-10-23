// S10 contract pins (7.0 line A): OffCanvas's open/close/toggle and
// close-on-click consumers, the state class/ARIA writes and the
// opened/openedEnd/close/closed production moved to the native Events/DOM
// layer while the public contract stays byte-identical. Known seams: the
// keydown binding stays on jQuery (the coarse suite feeds jQuery-synthesized
// mock keydowns), both transitionend waits stay on jQuery (the coarse suite
// drives them through jQuery triggerHandler, fx seam), the
// changed.zf.mediaquery consumers stay on jQuery (MediaQuery seam), the
// scrollbox touchmove chain stays on jQuery (touch seam with event.data
// delegation) and the transition-duration/body-class writes stay on jQuery
// (css seam). These tests pin that contract from the outside; the
// pre-existing offcanvas.js suite is untouched on purpose and stays green.
describe('OffCanvas (native layer contract)', function() {
  var plugin;
  var $html;

  // The main test page loads its stylesheets AFTER the foundation bundle, so
  // the breakpoint list is garbage on this page - re-parse now that the CSS
  // is applied (responsive-toggle-native precedent) before any MediaQuery
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
    document.activeElement.blur();
  });

  var template = `<div class="off-canvas-wrapper">
      <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
        <div class="off-canvas position-left" id="offCanvasNative" data-off-canvas data-content-scroll="false">

          <!-- Close button -->
          <button class="close-button" aria-label="Close menu" type="button" data-close>
            <span aria-hidden="true">&times;</span>
          </button>

          <!-- Menu -->
          <ul class="vertical menu">
            <li><a href="#">Foundation</a></li>
          </ul>

        </div>

        <div class="off-canvas-content" data-off-canvas-content>
          PAGE_CONTENT.

          <!-- Triggers -->
          <button type="button" class="button" data-toggle="offCanvasNative">Open Menu</button>
        </div>
      </div>
    </div>`;

  function build(options) {
    $html = $(template).appendTo('body');
    plugin = new Foundation.OffCanvas($html.find('[data-off-canvas]'), options);
    return plugin;
  }

  describe('state events', function() {
    it('fires opened.zf.offCanvas through the native event layer on open', function() {
      build({});
      var el = $html[0];
      var spy = sinon.spy();
      FoundationNext.Events.on(el, 'opened.zf.offCanvas', spy);

      plugin.open();

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('opened');
      spy.firstCall.args[0].namespace.should.equal('offCanvas.zf');
    });

    it('fires openedEnd.zf.offCanvas once the open transition finished', function(done) {
      build({});
      var el = plugin.$element[0];
      FoundationNext.Events.on(el, 'openedEnd.zf.offCanvas', function(event) {
        event.type.should.equal('openedEnd');
        event.namespace.should.equal('offCanvas.zf');
        el.classList.contains('is-open').should.be.true;
        done();
      });

      plugin.open();
      // the transitionend waits are a jQuery seam: drive them through the
      // jQuery triggerHandler with the util-resolved end-event name
      $(el).triggerHandler(Foundation.transitionend($(el)));
    });

    it('fires close.zf.offCanvas and closed.zf.offCanvas through the native event layer', function() {
      build({});
      var el = plugin.$element[0];
      var closeSpy = sinon.spy();
      var closedSpy = sinon.spy();
      FoundationNext.Events.on(el, 'close.zf.offCanvas', closeSpy);
      FoundationNext.Events.on(el, 'closed.zf.offCanvas', closedSpy);

      plugin.open();
      sinon.assert.notCalled(closeSpy); // only the close flow produces it

      plugin.close();
      $(el).triggerHandler(Foundation.transitionend($(el)));

      sinon.assert.calledOnce(closeSpy);
      sinon.assert.calledOnce(closedSpy);
      closedSpy.firstCall.args[0].namespace.should.equal('offCanvas.zf');
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function() {
      build({});
      var spy = sinon.spy();
      $html.on('opened.zf.offCanvas', spy);

      plugin.open();

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('opened');
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('trigger consumers (native layer)', function() {
    it('opens through a real click on the [data-toggle] trigger', function() {
      build({autoFocus: false});
      var el = plugin.$element[0];

      plugin.$triggers[0].click();

      el.classList.contains('is-open').should.be.true;
      el.getAttribute('aria-hidden').should.equal('false');
    });

    it('closes through a real click on the [data-close] control inside', function() {
      build({autoFocus: false});
      var el = plugin.$element[0];
      plugin.open();

      el.querySelector('[data-close]').click();

      el.classList.contains('is-open').should.be.false;
    });

    it('closes on a real overlay click and on a jQuery-synthesized one (the .click() native shortcut bridges the layers)', function() {
      build({autoFocus: false});
      plugin.open();

      // jQuery-synthesized click on the overlay div: the shortcut calls
      // overlay.click(), the real click reaches the native consumer
      plugin.$overlay.trigger('click');
      plugin.$element[0].classList.contains('is-open').should.be.false;

      // a real click closes the re-opened canvas the same way
      plugin.open();
      plugin.$overlay[0].click();
      plugin.$element[0].classList.contains('is-open').should.be.false;
    });
  });

  describe('seams', function() {
    it('closes on the synthetic jQuery mock ESCAPE keydown (the keyboard seam stays jQuery-side)', function() {
      build({autoFocus: false});
      plugin.open();

      plugin.$element.focus()
        .trigger(window.mockKeyboardEvent('ESCAPE'));

      plugin.$element[0].classList.contains('is-open').should.be.false;
    });

    it('keeps the changed.zf.mediaquery consumer on the jQuery side (the MediaQuery seam)', function(done) {
      var $el = $('<div><div class="off-canvas position-left reveal-for-small" id="offCanvasNativeMq" data-off-canvas></div><div class="off-canvas-content" data-off-canvas-content></div></div>').appendTo('body');
      plugin = new Foundation.OffCanvas($el.find('[data-off-canvas]'), {autoFocus: false});
      var el = plugin.$element[0];

      // 'small' is the active breakpoint in this runner: revealed on load
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          el.getAttribute('aria-hidden').should.equal('false');
          el.classList.contains('is-closed').should.be.false;
        },
        then: () => {
          // the consumer is registered in the jQuery event registry, exactly
          // where the pre-existing offcanvas.js suite probes for it
          var events = $._data(window, 'events') || {};
          var mqHandlers = (events.changed || []).filter(function(ev) {
            return ev.handler === plugin._revealMqHandler;
          });
          mqHandlers.length.should.equal(1);

          // the jQuery-synthesized broadcast is answered through that
          // listener and re-reveals the canvas
          $(window).trigger('changed.zf.mediaquery');
          el.getAttribute('aria-hidden').should.equal('false');
          $el.remove();
          done();
        }
      });
    });
  });

  describe('destroy', function() {
    it('drops the native trigger/click consumers alongside the jQuery ones', function() {
      build({autoFocus: false});
      var el = plugin.$element[0];
      var openSpy = sinon.spy();
      FoundationNext.Events.on(el, 'open.zf.trigger', openSpy);
      plugin.destroy();
      plugin = null;

      // both transports find nothing: the real broadcast and the
      // jQuery-synthesized one
      FoundationNext.Events.trigger(el, 'open.zf.trigger');
      $(el).trigger('open.zf.trigger');
      el.classList.contains('is-open').should.be.false;
    });
  });
});
