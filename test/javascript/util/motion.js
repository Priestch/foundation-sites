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
    window.mFrameId = 0;
    window.requestAnimationFrame = function(fn) {
      // token ids + real removal: a cancelled frame must not linger in the
      // queue and swallow later ticks (the fx stop/finish tests depend on
      // cancels actually cancelling).
      var entry = {id: ++window.mFrameId, fn: fn};
      window.mFrames.push(entry);
      return entry.id;
    };
    window.cancelAnimationFrame = function(id) {
      for (var i = 0; i < window.mFrames.length; i++) {
        if (window.mFrames[i].id === id) {
          window.mFrames.splice(i, 1);
          return;
        }
      }
    };
  }

  function tick() {
    var entry = window.mFrames.shift();
    if (!entry) { return false; }
    window.mTs += 50;
    entry.fn(window.mTs);
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
      var el = document.body.appendChild(fixture('<div></div>'));
      var cb = sinon.spy(function() {
        // S15: the callback is applied with the animation target element
        // (the jQuery convention died with Motion's jQuery import)
        this.should.be.equal(el);
      });

      Foundation.Motion.animateIn(el, 'fade-in', cb);

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

      el.remove();
    });

    it('completes on the prefixed webkitTransitionEnd too', function() {
      var el = document.body.appendChild(fixture('<div></div>'));
      var cb = sinon.spy();

      Foundation.Motion.animateIn(el, 'fade-in', cb);
      drain();

      // headless Chrome resolves the transitionend() probe to the prefixed
      // name (util/triggers.js pins that), so both spellings must complete
      el.dispatchEvent(new Event('webkitTransitionEnd', { bubbles: true }));
      sinon.assert.calledOnce(cb);
      classesOf(el).should.deep.equal([]);

      el.remove();
    });

    it('completes at most once when both end events fire', function() {
      var el = document.body.appendChild(fixture('<div></div>'));
      var cb = sinon.spy();

      Foundation.Motion.animateIn(el, 'fade-in', cb);
      drain();

      el.dispatchEvent(new Event('transitionend', { bubbles: true }));
      el.dispatchEvent(new Event('webkitTransitionEnd', { bubbles: true }));

      sinon.assert.calledOnce(cb);

      el.remove();
    });

    it('runs the motion-ui class sequence for animateOut and hides on finish', function() {
      var el = document.body.appendChild(fixture('<div></div>'));
      var cb = sinon.spy(function() {
        this.should.be.equal(el);
      });

      Foundation.Motion.animateOut(el, 'fade-out', cb);

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

      el.remove();
    });

    it('shows an inline-hidden element for in animations', function() {
      var el = document.body.appendChild(fixture('<div style="display: none;"></div>'));

      Foundation.Motion.animateIn(el, 'fade-in', function() {});
      tick();

      el.style.display.should.equal('');

      // finish cleanly so the armed listener does not leak
      drain();
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));
      el.remove();
    });

    it('resets only its own classes', function() {
      // multi-class coexistence edge: a foreign mui token on the element is
      // not ours to remove - same as motion-ui/v6, whose reset drops exactly
      // the init, active and animation classes it applied
      var el = document.body.appendChild(fixture('<div class="mui-enter is-open"></div>'));

      Foundation.Motion.animateOut(el, 'fade-out', function() {});
      drain();
      el.dispatchEvent(new Event('transitionend', { bubbles: true }));

      classesOf(el).sort().should.deep.equal(['is-open', 'mui-enter']);

      el.remove();
    });

    it('ignores empty collections', function() {
      var cb = sinon.spy();

      Foundation.Motion.animateIn([], "fade-in", cb);
      Foundation.Motion.animateOut([], "fade-out", cb);

      drain();
      sinon.assert.notCalled(cb);
    });
  });

  describe('Move()', function() {
    var wrap, el, el, wrapEl;

    beforeEach(function() {
      wrap = document.body.appendChild(fixture('<div id="move-wrap"><div id="move-el"></div></div>'));
      el = document.getElementById('move-el');
      wrapEl = wrap;
    });

    afterEach(function() {
      wrap.remove();
    });

    // The slider chain: Move() runs on the handle, the container listens
    // with jQuery `.one('finished.zf.animate')` and re-fires 'moved.zf.slider'
    // when it arrives. v6 delivered it through jQuery's synthetic bubbling;
    // the flip delivers a real bubbling event that the jQuery listener still
    // absorbs (S3/S4), with the extra parameters on originalEvent.detail.
    it('bubbles finished.zf.animate to a jQuery container listener (slider chain pin)', function() {
      var moved = 0;
      var seen = [];

      jQuery(wrap).one('finished.zf.animate', function(e, param) {
        moved++;
        seen.push({
          type: e.type,
          hasOriginalEvent: !!(e.originalEvent),
          detail: e.originalEvent && e.originalEvent.detail,
          paramUndefined: param === undefined
        });
        // the exact downstream shape of slider: re-fire from the container
        FoundationNext.Events.trigger(wrap, 'moved.zf.slider-marker');
      });

      FoundationNext.Events.one(wrap, 'moved.zf.slider-marker', function() { moved++; });

      Foundation.Move(0, el, function() {});

      moved.should.equal(2);
      seen[0].type.should.equal('finished');
      seen[0].hasOriginalEvent.should.be.true;
      // mixed-state convention: extra params reach jQuery consumers through
      // event.originalEvent.detail, not as handler arguments
      seen[0].paramUndefined.should.be.true;
      seen[0].detail.length.should.equal(1);
      // S15 (detail-to-Element ruling): the extra parameter is the
      // animation target element, not the jQuery collection Move() was
      // called with (which v6 passed)
      seen[0].detail[0].should.equal(el);
    });

    it('delivers the event once per listener while bubbling', function() {
      var counts = { jqOnEl: 0, jqOnParent: 0, nativeEl: 0, nativeParent: 0 };

      FoundationNext.Events.on(el, 'finished.zf.animate', function() { counts.jqOnEl++; });
      FoundationNext.Events.on(wrap, 'finished.zf.animate', function() { counts.jqOnParent++; });
      el.addEventListener('finished', function() { counts.nativeEl++; });
      wrapEl.addEventListener('finished', function() { counts.nativeParent++; });

      Foundation.Move(0, el, function() {});

      counts.should.deep.equal({ jqOnEl: 1, jqOnParent: 1, nativeEl: 1, nativeParent: 1 });
    });

    it('fires synchronously for duration 0 with the v6 rapid-chain shape', function() {
      var order = [];

      // round 1: the container registers .one AFTER Move returned - the
      // synchronous event is gone, exactly like v6
      Foundation.Move(0, el, function() { order.push('fn1'); });
      FoundationNext.Events.one(wrap, 'finished.zf.animate', function() { order.push('one-round1'); });

      order.should.deep.equal(['fn1']);

      // round 2: round 1's pending .one catches this event once
      Foundation.Move(0, el, function() { order.push('fn2'); });

      order.should.deep.equal(['fn1', 'fn2', 'one-round1']);
    });

    it('applies fn with the given element and fires on the completion frame', function() {
      var fnThis = null;
      var fnRuns = 0;
      var finished = 0;

      FoundationNext.Events.on(wrap, 'finished.zf.animate', function() { finished++; });

      Foundation.Move(250, el, function() {
        fnRuns++;
        if (!fnThis) { fnThis = this; }
      });

      drain(); // 50ms per fake frame; the first frame sets start (prog 0),
               // so duration 250 completes on the 6th frame

      fnRuns.should.equal(6);
      finished.should.equal(1);
      fnThis.should.equal(el);
    });
  });

  describe('fx primitives (fx 方案 A: jQuery fx parity)', function() {
    var el;

    beforeEach(function() {
      el = document.body.appendChild(document.createElement('div'));
      el.textContent = 'TEXT';
      el.style.padding = '10px';
      el.style.margin = '4px';
    });
    afterEach(function() {
      el.remove();
      el = null;
    });

    it('slideUp(0) completes synchronously leaving only display:none inline', function() {
      var called = 0;
      Foundation.Motion.slideUp(el, 0, function() { called++; });

      called.should.equal(1);
      el.style.display.should.equal('none');
      // the six tweened props are cleaned back to no inline residue
      el.style.height.should.equal('');
      el.style.paddingTop.should.equal('');
      el.style.paddingBottom.should.equal('');
      el.style.marginTop.should.equal('');
      el.style.marginBottom.should.equal('');
      el.style.opacity.should.equal('');
      el.style.overflow.should.equal('');
    });

    it('slideDown(0) shows a hidden element synchronously and clears the inline props', function() {
      el.style.display = 'none';
      var called = 0;
      Foundation.Motion.slideDown(el, 0, function() { called++; });

      called.should.equal(1);
      // a div's default display (the getDefaultDisplay fallback)
      el.style.display.should.equal('block');
      el.style.height.should.equal('');
      el.style.opacity.should.equal('');
    });

    it('restores a saved inline display across the hide/show cycle', function() {
      el.style.display = 'flex';
      Foundation.Motion.slideUp(el, 0);
      el.style.display.should.equal('none');

      Foundation.Motion.slideDown(el, 0);
      el.style.display.should.equal('flex');
    });

    it('slides through the frames with overflow hidden and completes on the last one', function() {
      var heights = [];
      Foundation.Motion.slideUp(el, 100, function() {
        el.style.display.should.equal('none');
      });
      el.style.overflow.should.equal('hidden');

      tick(); // origin frame: progress 0
      heights.push(el.offsetHeight);
      tick(); // progress 0.5
      heights.push(el.offsetHeight);
      heights[1].should.be.below(heights[0]);
      tick(); // progress 1: completion

      el.style.display.should.equal('none');
      el.style.overflow.should.equal('');
    });

    it('serializes two animations on one element, completing them in order', function() {
      var order = [];
      Foundation.Motion.slideUp(el, 100, function() { order.push('up'); });
      Foundation.Motion.slideDown(el, 100, function() { order.push('down'); });

      // the second animation only starts once the first completed
      drain();
      order.should.deep.equal(['up', 'down']);
      el.style.display.should.equal('block');
    });

    it('finish() jumps the running and queued animations to their ends', function() {
      var order = [];
      Foundation.Motion.slideUp(el, 100, function() { order.push('up'); });
      Foundation.Motion.slideDown(el, 100, function() { order.push('down'); });

      Foundation.Motion.finish(el);

      order.should.deep.equal(['up', 'down']);
      el.style.display.should.equal('block');
      el.style.height.should.equal('');
    });

    it('stop(el, clearQueue) drops the pending animation without its complete', function() {
      var order = [];
      Foundation.Motion.slideUp(el, 100, function() { order.push('up'); });
      Foundation.Motion.slideDown(el, 100, function() { order.push('down'); });

      Foundation.Motion.stop(el, true, false); // .stop(true) shape
      drain();

      // .stop(true) clears the queue and halts the running animation where
      // it stands - neither complete fires
      order.should.deep.equal([]);
    });

    it('stop(el, false, true) jumps the running animation to its end and completes it', function() {
      var order = [];
      Foundation.Motion.slideUp(el, 100, function() { order.push('up'); });
      tick();

      Foundation.Motion.stop(el, false, true); // .stop(false, true) shape

      order.should.deep.equal(['up']);
      el.style.display.should.equal('none');
    });

    it('completes without touching anything when animating toward the current state', function() {
      var called = 0;
      el.style.display = 'flex';
      Foundation.Motion.slideDown(el, 50, function() { called++; });

      called.should.equal(1);
      el.style.display.should.equal('flex');
      el.style.height.should.equal('');
    });

    it('fadeOut(0) hides and clears the opacity; fadeIn(0) brings it back visible', function() {
      var called = 0;
      Foundation.Motion.fadeOut(el, 0, function() { called++; });

      called.should.equal(1);
      el.style.display.should.equal('none');
      el.style.opacity.should.equal('');

      var shown = 0;
      Foundation.Motion.fadeIn(el, 0, function() { shown++; });

      shown.should.equal(1);
      el.style.display.should.equal('block');
      el.style.opacity.should.equal('');
    });

    it('fadeOut on a hidden element completes instantly without breaking the queue', function() {
      var order = [];
      el.style.display = 'none';
      Foundation.Motion.fadeOut(el, 100, function() { order.push('out'); });
      Foundation.Motion.fadeIn(el, 0, function() { order.push('in'); });

      order.should.deep.equal(['out', 'in']);
      el.style.display.should.equal('block');
    });

    it('animates scrollTop on a scrollable element and fires the callback once', function() {
      var scroller = document.body.appendChild(document.createElement('div'));
      try {
        scroller.style.height = '50px';
        scroller.style.overflow = 'auto';
        var inner = document.createElement('div');
        inner.style.height = '500px';
        scroller.appendChild(inner);

        var called = 0;
        Foundation.Motion.animate(scroller, {scrollTop: 200}, 0, null, function() { called++; });

        called.should.equal(1);
        scroller.scrollTop.should.equal(200);
      } finally {
        scroller.remove();
      }
    });

    it('animates scrollTop on the scroll root through the page viewport', function() {
      var spacer = document.body.appendChild(document.createElement('div'));
      try {
        spacer.style.height = '5000px';
        var called = 0;
        Foundation.Motion.animate(document.documentElement, {scrollTop: 1200}, 0, null, function() { called++; });

        called.should.equal(1);
        window.pageYOffset.should.equal(1200);
        // restore the runner viewport position
        window.scrollTo(0, 0);
      } finally {
        spacer.remove();
      }
    });

    it('resolves linear to the identity easing and unknown names to swing', function() {
      // at progress 0.25 (duration 200, second 50ms frame): linear paints
      // from + 0.25 * delta; swing paints from + delta * swing(0.25) where
      // swing(p) = 0.5 - cos(p*PI)/2. The swing run's from is 0 (setting
      // the marginTop longhand expanded the margin shorthand, clearing it
      // left the UA margin - the CSSOM behavior jQuery read too).
      var linearMid, swingMid;
      Foundation.Motion.animate(el, {marginTop: 104}, 200, 'linear');
      tick(); // origin frame (progress 0)
      tick(); // progress 0.25
      linearMid = parseFloat(el.style.marginTop);
      Foundation.Motion.stop(el, false, true);
      el.style.marginTop = '';

      Foundation.Motion.animate(el, {marginTop: 104}, 200, 'definitely-not-a-name');
      tick();
      tick();
      swingMid = parseFloat(el.style.marginTop);
      Foundation.Motion.stop(el, false, true);
      el.style.marginTop = '';

      linearMid.should.equal(29);
      swingMid.should.be.approximately(104 * (0.5 - Math.cos(0.25 * Math.PI) / 2), 1e-4);
    });
  });
});
