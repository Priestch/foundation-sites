// S10 contract pins (7.0 line A): Orbit's resizeme/click consumers, the
// state attribute writes and the beforeslidechange/slidechange production
// moved to the native Events/DOM layer while the public contract stays
// byte-identical; the Timer namespace is now passed explicitly ('orbit') and
// the S2 data-key probe is retired. The swipe consumers joined the native
// layer with the Touch util's real synthesized swipes (S13). Known seams:
// the keydown binding stays on jQuery (the coarse suite feeds
// jQuery-synthesized mock keydowns), mouseenter/mouseleave stay on jQuery
// (hover synthesis) and the slide show/hide tweens stay on jQuery. These
// tests pin that contract from the outside; the pre-existing orbit.js suite
// is untouched on purpose and
// stays green.
describe('Orbit (native layer contract)', function() {
  var plugin;
  var $html;

  var template = `<div class="orbit" role="region" aria-label="Favorite Space Pictures" data-orbit>
    <ul class="orbit-container">
      <button class="orbit-previous"><span class="show-for-sr">Previous Slide</span>&#9664;&#xFE0E;</button>
      <button class="orbit-next"><span class="show-for-sr">Next Slide</span>&#9654;&#xFE0E;</button>
      <li class="is-active orbit-slide">
        Slide #1 content.
      </li>
      <li class="orbit-slide">
        Slide #2 content.
      </li>
      <li class="orbit-slide">
        Slide #3 content.
      </li>
      <li class="orbit-slide">
        Slide #4 content.
      </li>
    </ul>
    <nav class="orbit-bullets">
      <button class="is-active" data-slide="0">
        <span class="show-for-sr">First slide details.</span>
        <span class="show-for-sr" data-slide-active-label>Current Slide</span>
      </button>
      <button data-slide="1"><span class="show-for-sr">Second slide details.</span></button>
      <button data-slide="2"><span class="show-for-sr">Third slide details.</span></button>
      <button data-slide="3"><span class="show-for-sr">Fourth slide details.</span></button>
    </nav>
  </div>`;

  afterEach(function() {
    // destroy() nulls instance properties, so skip if the test destroyed it already
    if (plugin.$element) {
      plugin.destroy();
    }
    $html.remove();
  });

  function build(options) {
    $html = $(template).appendTo('body');
    plugin = new Foundation.Orbit($html, Object.assign({useMUI: false}, options));
    return plugin;
  }

  describe('state events', function() {
    it('fires slidechange.zf.orbit through the native event layer with the forwarded slide as parameter', function() {
      build({});
      var el = $html[0];
      var spy = sinon.spy();
      FoundationNext.Events.on(el, 'slidechange.zf.orbit', spy);

      plugin.changeSlide(true);

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('slidechange');
      spy.firstCall.args[0].namespace.should.equal('orbit.zf');
      // the forwarded $newSlide collection rides as the event parameter
      spy.firstCall.args[1][0].should.equal(el.querySelectorAll('.orbit-slide')[1]);
    });

    it('fires beforeslidechange.zf.orbit before the slide flip, then slidechange.zf.orbit', function() {
      build({});
      var el = $html[0];
      var order = [];
      FoundationNext.Events.on(el, 'beforeslidechange.zf.orbit', function() {
        order.push('before');
        // the old slide is still the active one at "before" time
        el.querySelectorAll('.orbit-slide')[0].classList.contains('is-active').should.be.true;
      });
      FoundationNext.Events.on(el, 'slidechange.zf.orbit', function() { order.push('change'); });

      plugin.changeSlide(true);

      order.should.deep.equal(['before', 'change']);
    });

    it('still reaches jQuery listeners with the real event (white absorption), params in originalEvent.detail', function() {
      build({});
      var el = $html[0];
      var spy = sinon.spy();
      $html.on('slidechange.zf.orbit', spy);

      plugin.changeSlide(true);

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('slidechange');
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
      spy.firstCall.args[0].originalEvent.detail[0][0].should.equal(el.querySelectorAll('.orbit-slide')[1]);
    });
  });

  describe('timer', function() {
    it('carries the explicitly passed orbit namespace on timerstart/timerpaused', function() {
      build({});
      var startSpy = sinon.spy();
      var pauseSpy = sinon.spy();
      $html.on('timerstart.zf.orbit', startSpy);
      $html.on('timerpaused.zf.orbit', pauseSpy);

      plugin.timer.start();
      plugin.timer.pause();

      sinon.assert.calledOnce(startSpy);
      sinon.assert.calledOnce(pauseSpy);
      startSpy.firstCall.args[0].type.should.equal('timerstart');
      // jQuery sorts the namespace segments of triggered events
      startSpy.firstCall.args[0].namespace.should.equal('orbit.zf');
      pauseSpy.firstCall.args[0].type.should.equal('timerpaused');
      pauseSpy.firstCall.args[0].namespace.should.equal('orbit.zf');
    });
  });

  describe('resize', function() {
    it('recomputes the wrapper height through the native resizeme.zf.trigger (S4 producer, S10 consumer)', function() {
      build({});
      var el = $html[0];
      // the active slide is the only one with a measured box
      el.querySelectorAll('.orbit-slide')[0].style.height = '120px';

      FoundationNext.Events.trigger(el, 'resizeme.zf.trigger');

      plugin.$wrapper[0].style.height.should.equal('120px');
    });
  });

  describe('click consumers', function() {
    it('changes slides on a real nav-button click', function() {
      build({pauseOnHover: false});

      $html[0].querySelector('.orbit-next').click();

      $html.find('.orbit-slide').eq(0).should.be.hidden;
      $html.find('.orbit-slide').eq(1).should.be.visible;
    });

    it('changes slides on a jQuery-synthesized bullet click (the .click() native shortcut bridges the layers)', function() {
      build({pauseOnHover: false});

      // the shortcut bridges for non-link elements: jQuery calls
      // button.click(), the real click reaches the native listener
      $html.find('.orbit-bullets [data-slide]').eq(2).trigger('click');

      $html.find('.orbit-slide').eq(2).should.be.visible;
      $html.find('.orbit-bullets [data-slide]').eq(2).should.have.class('is-active');
    });

    it('pauses and restarts the timer on real slide clicks', function() {
      build({pauseOnHover: false});

      plugin.$slides[0].click();
      plugin.timer.isPaused.should.be.true;

      plugin.$slides[0].click();
      plugin.timer.isPaused.should.be.false;
    });
  });

  describe('seams', function() {
    it('changes slides on a real synthesized swipeleft (the S13 Touch flip)', function() {
      build({pauseOnHover: false});

      FoundationNext.Events.trigger($html.find('.orbit-slide')[0], 'swipeleft');

      $html.find('.orbit-slide').eq(1).should.be.visible;
    });

    it('changes slides on the synthetic jQuery mock keydown (the keyboard seam stays jQuery-side)', function() {
      build({pauseOnHover: false});

      plugin.$wrapper.focus()
        .trigger(window.mockKeyboardEvent('ARROW_RIGHT'));

      $html.find('.orbit-slide').eq(1).should.be.visible;
    });
  });

  describe('destroy', function() {
    it('stops the timer on destroy (M1 fix, kept)', function() {
      build({pauseOnHover: false});
      var pause = sinon.spy(plugin.timer, 'pause');

      plugin.destroy();

      sinon.assert.calledOnce(pause);
    });

    it('does not throw when no timer exists (single slide, S14 guard)', function() {
      var template = `<div class="orbit" role="region" data-orbit>
        <ul class="orbit-container">
          <li class="is-active orbit-slide">
            Only slide.
          </li>
        </ul>
      </div>`;
      $html = $(template).appendTo('body');
      plugin = new Foundation.Orbit($html, {useMUI: false});
      // geoSync never ran: autoPlay requires more than one slide
      chai.expect(plugin.timer).to.be.undefined;

      chai.expect(function() { plugin.destroy(); }).to.not.throw();
    });

    it('drops every click listener on destroy, against both transports', function() {
      build({pauseOnHover: false});
      plugin.destroy();

      // a real click and a synthesized one must both find nothing: the
      // wipe covered the element and all descendants on both layers
      $html[0].querySelector('.orbit-next').click();
      $html.find('.orbit-bullets [data-slide]').eq(2).trigger('click');

      $html.find('.orbit-slide').eq(2).should.be.hidden;
    });
  });
});
