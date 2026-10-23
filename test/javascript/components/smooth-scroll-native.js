// S7 contract pins (7.0 line A): SmoothScroll's internals moved to the
// native Registry/Events layer and the page scroll became a rAF tween in
// the Move shape (duration 0 synchronous, one animation at a time) instead
// of the jQuery fx queue, while the public contract stays byte-identical.
// These tests pin that contract from the outside; no pre-existing
// smoothScroll suite exists.
describe('SmoothScroll (native layer contract)', function() {
  var plugin;
  var $scratch = [];

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    $scratch.forEach(function($el) { $el.remove(); });
    $scratch = [];
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  });

  function appendContent() {
    var $content = $(`<div>
      <div id="ss-start">start</div>
      <div style="height: 1500px">spacer</div>
      <div id="ss-target" style="height: 100px">target</div>
      <div style="height: 1500px">tail</div>
    </div>`).appendTo('body');
    $scratch.push($content);
    return $content;
  }

  // The absolute page position of an element, whatever the current scroll
  // and whatever mocha rendered above the fixtures.
  function absoluteTop(el) {
    return Math.round(el.getBoundingClientRect().top + window.pageYOffset);
  }

  function shortOptions() {
    return {animationDuration: 100, animationEasing: 'linear', threshold: 0, offset: 0};
  }

  describe('scrollToLoc()', function() {
    it('scrolls to the target over the given duration and fires the completion callback exactly once', function(done) {
      appendContent();
      var expected = absoluteTop(document.getElementById('ss-target'));
      var spy = sinon.spy();

      Foundation.SmoothScroll.scrollToLoc('#ss-target', shortOptions(), spy);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          window.pageYOffset.should.equal(expected);
          sinon.assert.calledOnce(spy);
        },
        then: done
      });
    });

    it('jumps synchronously at duration 0 and fires the callback in the same tick', function() {
      appendContent();
      var expected = absoluteTop(document.getElementById('ss-target'));
      var spy = sinon.spy();

      Foundation.SmoothScroll.scrollToLoc('#ss-target', Object.assign(shortOptions(), {animationDuration: 0}), spy);

      window.pageYOffset.should.equal(expected);
      sinon.assert.calledOnce(spy);
    });

    it('returns false and never fires the callback when the target does not exist', function() {
      var spy = sinon.spy();

      var result = Foundation.SmoothScroll.scrollToLoc('#ss-missing', Object.assign(shortOptions(), {animationDuration: 0}), spy);

      result.should.be.false;
      sinon.assert.notCalled(spy);
    });

    it('cancels a running scroll when a new one starts (the stop(true) shape)', function(done) {
      appendContent();
      var firstCallback = sinon.spy();
      var farTarget = absoluteTop(document.getElementById('ss-target'));

      Foundation.SmoothScroll.scrollToLoc('#ss-target', Object.assign(shortOptions(), {animationDuration: 800}), firstCallback);

      setTimeout(function() {
        // mid-flight, redirect to the top anchor synchronously
        Foundation.SmoothScroll.scrollToLoc('#ss-start', Object.assign(shortOptions(), {animationDuration: 0}));
        var redirected = window.pageYOffset;
        redirected.should.be.below(farTarget);

        setTimeout(function() {
          // the first tween was stopped where it stood: the page never
          // reaches the far target and the first callback never fires
          window.pageYOffset.should.equal(redirected);
          sinon.assert.notCalled(firstCallback);
          done();
        }, 1000);
      }, 100);
    });
  });

  describe('click consumption', function() {
    function buildNav(options) {
      appendContent();
      var $nav = $('<ul id="ss-nav"><li><a href="#ss-target">go</a></li></ul>').appendTo('body');
      $scratch.push($nav);
      plugin = new Foundation.SmoothScroll($nav, options);
      return $nav;
    }

    it('scrolls and prevents the default hash jump on a real click through the delegation', function(done) {
      var $nav = buildNav(shortOptions());
      var link = $nav.find('a')[0];

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      link.dispatchEvent(click);
      click.defaultPrevented.should.be.true;

      var expected = absoluteTop(document.getElementById('ss-target'));
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { window.pageYOffset.should.equal(expected); },
        then: done
      });
    });

    it('still scrolls on a programmatic click (the element\'s native .click() drives the layers)', function(done) {
      var $nav = buildNav(shortOptions());
      var link = $nav.find('a')[0];

      // jQuery's `.trigger('click')` cannot drive this input anymore:
      // since jQuery 3.6.3 its special.click._default suppresses the native
      // .click() shortcut on links, and a jQuery-synthesized event never
      // reaches the native listener layer (same ledger as the "synthetic
      // events no longer bridge" announcement). The programmatic click the
      // contract needs is the element's own DOM .click() method.
      link.click();

      var expected = absoluteTop(document.getElementById('ss-target'));
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { window.pageYOffset.should.equal(expected); },
        then: done
      });
    });

    it('does not scroll when the click lands on the container itself', function(done) {
      var $nav = buildNav(shortOptions());
      var before = window.pageYOffset;

      $nav[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));

      setTimeout(function() {
        window.pageYOffset.should.equal(before);
        done();
      }, 150);
    });

    it('unbinds the click listeners on destroy: the browser default takes over', function(done) {
      var $nav = buildNav(shortOptions());
      plugin.destroy();
      plugin = null;

      // let any straggler animation frame of the previous tests land first
      setTimeout(function() {
        // the native .click() method is the trusted-equivalent activation: a
        // real click nobody prevents anymore, so the browser performs the
        // default anchor action (hash + jump onto the anchor); a live plugin
        // would have prevented both and landed threshold/2+offset pixels
        // high instead
        $nav.find('a')[0].click();

        setTimeout(function() {
          try {
            window.location.hash.should.equal('#ss-target');
            // the browser rounds its own jump to the anchor, possibly one
            // pixel off Math.round's result
            Math.abs(window.pageYOffset - absoluteTop(document.getElementById('ss-target'))).should.be.at.most(1);
            done();
          } catch (err) {
            done(err);
          }
        }, 50);
      }, 50);
    });
  });
});
