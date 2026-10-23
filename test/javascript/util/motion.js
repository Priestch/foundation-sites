// S5 contract pins (7.0 line A): Motion runs the motion-ui class lifecycle
// on the native class/style/event layer, and Move() flips
// 'finished.zf.animate' to one real bubbling dispatch. The baseline here was
// recorded by probing the 6.x implementation (which inlines motion-ui's
// animate()) and the vendored motion-ui source
// (node_modules/motion-ui/motion-ui.js); see the S5 report for the deltas.
describe('Motion util', function() {
  var realRaf, realCancel;

  // The class lifecycle runs over two animation frames; a manual clock makes
  // the frame order observable. Real CSS transitions never complete in the
  // headless runner, so the end event is dispatched manually - exactly what
  // the 6.x implementation depended on (it listened for the prefixed
  // webkitTransitionEnd, which headless Chrome resolves but never fires).
  function installFakeClock() {
    realRaf = window.requestAnimationFrame;
    realCancel = window.cancelAnimationFrame;
    window.mFrames = [];
    window.mTs = 1000;
    window.requestAnimationFrame = function(fn) {
      window.mFrames.push(fn);
      return window.mFrames.length - 1;
    };
    window.cancelAnimationFrame = function() {};
  }

  function tick() {
    var fn = window.mFrames.shift();
    if (!fn) { return false; }
    window.mTs += 50;
    fn(window.mTs);
    return true;
  }

  function drain() {
    var n = 0;
    while (tick()) { n++; }
    return n;
  }

  function classesOf(el) {
    return Array.prototype.slice.call(el.classList).sort();
  }

  beforeEach(installFakeClock);

  afterEach(function() {
    window.requestAnimationFrame = realRaf;
    window.cancelAnimationFrame = realCancel;
    delete window.mFrames;
    delete window.mTs;
  });

  describe('class lifecycle (motion-ui parity)', function() {
    it('runs the motion-ui class sequence for animateIn', function() {
      var $el = $('<div></div>').appendTo('body');
      var el = $el[0];
      var cb = sinon.spy(function() {
        // the callback still arrives with jQuery conventions
        this.should.have.property('jquery');
        this[0].should.be.equal(el);
      });

      Foundation.Motion.animateIn($el, 'fade-in', cb);

      // setup: animation class on, transitions off, transition duration zeroed
      classesOf(el).should.deep.equal(['fade-in']);
      // The shorthand's exact serialization drifts across Chrome versions
      // ('none 0s ease 0s' on older Blink, 'none' on newer), so pin the
      // longhands the code actually means.
      el.style.transitionProperty.should.equal('none');
      el.style.transitionDuration.should.equal('0s');

      // frame 1: init class (and the element is shown for in animations)
      tick().should.be.true;
      classesOf(el).should.deep.equal(['fade-in', 'mui-enter']);
      el.style.display.should.equal('');

      // frame 2: reflow, transition released, active class
      tick().should.be.true;
      classesOf(el).should.deep.equal(['fade-in', 'mui-enter', 'mui-enter-active']);
      el.style.transition.should.equal('');

      drain().should.equal(0);

      // completion: everything reset, callback exactly once
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));
      classesOf(el).should.deep.equal([]);
      // v6 quirk kept: the bare `= 0` duration assignment is an invalid
      // <time> and is discarded, so the shorthand-cleared value stays ''
      el.style.transitionDuration.should.equal('');
      sinon.assert.calledOnce(cb);

      // a late second end event is inert
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));
      sinon.assert.calledOnce(cb);

      $el.remove();
    });

    it('completes on the prefixed webkitTransitionEnd too', function() {
      var $el = $('<div></div>').appendTo('body');
      var cb = sinon.spy();

      Foundation.Motion.animateIn($el, 'fade-in', cb);
      drain();

      // headless Chrome resolves the transitionend() probe to the prefixed
      // name (util/triggers.js pins that), so both spellings must complete
      $el[0].dispatchEvent(new Event('webkitTransitionEnd', { bubbles: true }));
      sinon.assert.calledOnce(cb);
      classesOf($el[0]).should.deep.equal([]);

      $el.remove();
    });

    it('completes at most once when both end events fire', function() {
      var $el = $('<div></div>').appendTo('body');
      var cb = sinon.spy();

      Foundation.Motion.animateIn($el, 'fade-in', cb);
      drain();

      $el[0].dispatchEvent(new Event('transitionend', { bubbles: true }));
      $el[0].dispatchEvent(new Event('webkitTransitionEnd', { bubbles: true }));

      sinon.assert.calledOnce(cb);

      $el.remove();
    });

    it('runs the motion-ui class sequence for animateOut and hides on finish', function() {
      var $el = $('<div></div>').appendTo('body');
      var el = $el[0];
      var cb = sinon.spy(function() {
        this.should.have.property('jquery');
      });

      Foundation.Motion.animateOut($el, 'fade-out', cb);

      classesOf(el).should.deep.equal(['fade-out']);
      tick();
      classesOf(el).should.deep.equal(['fade-out', 'mui-leave']);
      tick();
      classesOf(el).should.deep.equal(['fade-out', 'mui-leave', 'mui-leave-active']);

      el.dispatchEvent(new Event('transitionend', { bubbles: true }));

      // out animations end hidden and reset
      classesOf(el).should.deep.equal([]);
      el.style.display.should.equal('none');
      sinon.assert.calledOnce(cb);

      $el.remove();
    });

    it('shows an inline-hidden element for in animations', function() {
      var $el = $('<div style="display: none;"></div>').appendTo('body');
      var el = $el[0];

      Foundation.Motion.animateIn($el, 'fade-in', function() {});
      tick();

      el.style.display.should.equal('');

      // finish cleanly so the armed listener does not leak
      drain();
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));
      $el.remove();
    });

    it('resets only its own classes', function() {
      // multi-class coexistence edge: a foreign mui token on the element is
      // not ours to remove - same as motion-ui/v6, whose reset drops exactly
      // the init, active and animation classes it applied
      var $el = $('<div class="mui-enter is-open"></div>').appendTo('body');
      var el = $el[0];

      Foundation.Motion.animateOut($el, 'fade-out', function() {});
      drain();
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));

      classesOf(el).sort().should.deep.equal(['is-open', 'mui-enter']);

      $el.remove();
    });

    it('ignores empty collections', function() {
      var cb = sinon.spy();

      Foundation.Motion.animateIn($(), 'fade-in', cb);
      Foundation.Motion.animateOut($(), 'fade-out', cb);

      drain();
      sinon.assert.notCalled(cb);
    });
  });

  describe('Move()', function() {
    var $wrap, el, $el, wrapEl;

    beforeEach(function() {
      $wrap = $('<div id="move-wrap"><div id="move-el"></div></div>').appendTo('body');
      el = document.getElementById('move-el');
      $el = $(el);
      wrapEl = $wrap[0];
    });

    afterEach(function() {
      $wrap.remove();
    });

    // The slider chain: Move() runs on the handle, the container listens
    // with jQuery `.one('finished.zf.animate')` and re-fires 'moved.zf.slider'
    // when it arrives. v6 delivered it through jQuery's synthetic bubbling;
    // the flip delivers a real bubbling event that the jQuery listener still
    // absorbs (S3/S4), with the extra parameters on originalEvent.detail.
    it('bubbles finished.zf.animate to a jQuery container listener (slider chain pin)', function() {
      var moved = 0;
      var seen = [];

      $wrap.one('finished.zf.animate', function(e, $param) {
        moved++;
        seen.push({
          type: e.type,
          hasOriginalEvent: !!(e.originalEvent),
          detail: e.originalEvent && e.originalEvent.detail,
          paramUndefined: $param === undefined
        });
        // the exact downstream shape of slider: re-fire from the container
        $wrap.trigger('moved.zf.slider-marker');
      });

      $wrap.one('moved.zf.slider-marker', function() { moved++; });

      Foundation.Move(0, $el, function() {});

      moved.should.equal(2);
      seen[0].type.should.equal('finished');
      seen[0].hasOriginalEvent.should.be.true;
      // mixed-state convention: extra params reach jQuery consumers through
      // event.originalEvent.detail, not as handler arguments
      seen[0].paramUndefined.should.be.true;
      seen[0].detail.length.should.equal(1);
      // v6 passed the jQuery object Move() was called with - unchanged
      seen[0].detail[0].should.equal($el);
    });

    it('delivers the event once per listener while bubbling', function() {
      var counts = { jqOnEl: 0, jqOnParent: 0, nativeEl: 0, nativeParent: 0 };

      $el.on('finished.zf.animate', function() { counts.jqOnEl++; });
      $wrap.on('finished.zf.animate', function() { counts.jqOnParent++; });
      el.addEventListener('finished', function() { counts.nativeEl++; });
      wrapEl.addEventListener('finished', function() { counts.nativeParent++; });

      Foundation.Move(0, $el, function() {});

      counts.should.deep.equal({ jqOnEl: 1, jqOnParent: 1, nativeEl: 1, nativeParent: 1 });
    });

    it('fires synchronously for duration 0 with the v6 rapid-chain shape', function() {
      var order = [];

      // round 1: the container registers .one AFTER Move returned - the
      // synchronous event is gone, exactly like v6
      Foundation.Move(0, $el, function() { order.push('fn1'); });
      $wrap.one('finished.zf.animate', function() { order.push('one-round1'); });

      order.should.deep.equal(['fn1']);

      // round 2: round 1's pending .one catches this event once
      Foundation.Move(0, $el, function() { order.push('fn2'); });

      order.should.deep.equal(['fn1', 'fn2', 'one-round1']);
    });

    it('applies fn with the given element and fires on the completion frame', function() {
      var fnThis = null;
      var fnRuns = 0;
      var finished = 0;

      $wrap.on('finished.zf.animate', function() { finished++; });

      Foundation.Move(250, $el, function() {
        fnRuns++;
        if (!fnThis) { fnThis = this; }
      });

      drain(); // 50ms per fake frame; the first frame sets start (prog 0),
               // so duration 250 completes on the 6th frame

      fnRuns.should.equal(6);
      finished.should.equal(1);
      fnThis.should.equal($el);
    });
  });
});
