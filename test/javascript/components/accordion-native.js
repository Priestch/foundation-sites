// S8 contract pins (7.0 line A): Accordion's events, state/ARIA and the
// deep-link hashchange moved to the native Registry/Events/DOM layer while
// the public contract stays byte-identical. Known seams: the height tween
// stays on jQuery fx (the down/up events stay timed by its callback) and the
// keydown binding stays on jQuery (the coarse suite feeds jQuery-synthesized
// mock keydowns). These tests pin that contract from the outside; the
// pre-existing accordion.js suite is untouched on purpose and stays green.
describe('Accordion (native layer contract)', function() {
  var plugin;
  var $html;

  var template = (id) => `<ul class="accordion" data-accordion id="${id}">
  <li class="accordion-item" data-accordion-item>
    <a href="#${id}-c0" class="accordion-title">Accordion 1</a>
    <div class="accordion-content" data-tab-content id="${id}-c0">Panel 1</div>
  </li>
  <li class="accordion-item" data-accordion-item>
    <a href="#${id}-c1" class="accordion-title">Accordion 2</a>
    <div class="accordion-content" data-tab-content id="${id}-c1">Panel 2</div>
  </li>
  <li class="accordion-item" data-accordion-item>
    <a href="#${id}-c2" class="accordion-title">Accordion 3</a>
    <div class="accordion-content" data-tab-content id="${id}-c2">Panel 3</div>
  </li>
</ul>`;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) { $html.remove(); $html = null; }
    if (window.location.hash) {
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
    document.activeElement.blur();
  });

  function build(id, options) {
    $html = $(template(id)).appendTo('body');
    plugin = new Foundation.Accordion($html, options);
    return plugin;
  }

  describe('state events', function() {
    it('fires down.zf.accordion through the native event layer with the forwarded pane in detail', function(done) {
      build('accN1', {});
      var el = $html[0];
      var contents = el.querySelectorAll('.accordion-content');
      var downSpy = sinon.spy();
      FoundationNext.Events.on(el, 'down.zf.accordion', downSpy);

      plugin.down($(contents[1]));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(downSpy); },
        then: () => {
          downSpy.firstCall.args[0].type.should.equal('down');
          downSpy.firstCall.args[0].namespace.should.equal('accordion.zf');
          // the forwarded $target collection rides as the event parameter
          // (its final native-element form is the wrap-up slice's uniform move)
          downSpy.firstCall.args[1][0].should.equal(contents[1]);
          done();
        }
      });
    });

    it('fires up.zf.accordion through the native event layer once the fx tween finished', function(done) {
      build('accN2', {allowAllClosed: true});
      var el = $html[0];
      var contents = el.querySelectorAll('.accordion-content');
      var upSpy = sinon.spy();
      FoundationNext.Events.on(el, 'up.zf.accordion', upSpy);
      plugin.down($(contents[0]));

      // fx seam: aria/class state flips synchronously, the up event waits
      // for the jQuery fx callback
      plugin.up($(contents[0]));
      contents[0].getAttribute('aria-hidden').should.equal('true');
      sinon.assert.notCalled(upSpy);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(upSpy); },
        then: () => {
          upSpy.firstCall.args[0].type.should.equal('up');
          upSpy.firstCall.args[0].namespace.should.equal('accordion.zf');
          done();
        }
      });
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function(done) {
      build('accN3', {});
      var contents = $html[0].querySelectorAll('.accordion-content');
      var spy = sinon.spy();
      $html.on('down.zf.accordion', spy);

      plugin.down($(contents[0]));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(spy); },
        then: () => {
          // real events carry no jQuery namespace (jQuery leaves it undefined)
          chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
          done();
        }
      });
    });
  });

  describe('state and ARIA', function() {
    it('flips is-active, aria-hidden and aria-expanded natively on down', function(done) {
      build('accN4', {});
      var items = $html[0].querySelectorAll('[data-accordion-item]');
      var contents = $html[0].querySelectorAll('.accordion-content');
      var labels = $html[0].querySelectorAll('.accordion-title');

      plugin.down($(contents[1]));

      items[1].classList.contains('is-active').should.be.true;
      contents[1].getAttribute('aria-hidden').should.equal('false');
      labels[1].getAttribute('aria-expanded').should.equal('true');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { items[0].classList.contains('is-active').should.be.false; },
        then: done
      });
    });

    it('closes every active pane natively when allowAllClosed lets up() run on all of them', function(done) {
      build('accN5', {multiExpand: true, allowAllClosed: true});
      var items = $html[0].querySelectorAll('[data-accordion-item]');
      var contents = $html[0].querySelectorAll('.accordion-content');

      plugin.down($(contents[0]));
      plugin.down($(contents[1]));
      plugin.down($(contents[2]));

      var upCount = 0;
      FoundationNext.Events.on($html[0], 'up.zf.accordion', function() {
        upCount++;
      });
      plugin.up($(contents));

      items.forEach((item) => { item.classList.contains('is-active').should.be.false; });
      contents.forEach((content) => { content.getAttribute('aria-hidden').should.equal('true'); });

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { upCount.should.equal(3); },
        then: done
      });
    });
  });

  describe('keyboard', function() {
    it('opens the next panel from a real keydown (ARROW_DOWN) and moves focus', function(done) {
      build('accN6', {});
      var titles = $html[0].querySelectorAll('.accordion-title');
      var contents = $html[0].querySelectorAll('.accordion-content');

      titles[0].focus();
      titles[0].dispatchEvent(new KeyboardEvent('keydown', {which: 40, keyCode: 40, bubbles: true, cancelable: true}));

      document.activeElement.should.equal(titles[1]);
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { contents[1].parentElement.classList.contains('is-active').should.be.true; },
        then: done
      });
    });

    it('opens the previous panel from a real keydown (ARROW_UP)', function(done) {
      build('accN7', {});
      var titles = $html[0].querySelectorAll('.accordion-title');
      var contents = $html[0].querySelectorAll('.accordion-content');

      titles[2].focus();
      titles[2].dispatchEvent(new KeyboardEvent('keydown', {which: 38, keyCode: 38, bubbles: true, cancelable: true}));

      document.activeElement.should.equal(titles[1]);
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { contents[1].getAttribute('aria-hidden').should.equal('false'); },
        then: done
      });
    });

    it('toggles the related panel from a real keydown (ENTER)', function(done) {
      build('accN8', {});
      var titles = $html[0].querySelectorAll('.accordion-title');
      var contents = $html[0].querySelectorAll('.accordion-content');

      titles[1].focus();
      titles[1].dispatchEvent(new KeyboardEvent('keydown', {which: 13, keyCode: 13, bubbles: true, cancelable: true}));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { contents[1].getAttribute('aria-hidden').should.equal('false'); },
        then: done
      });
    });

    it('keeps answering jQuery-synthesized mock keydowns (the keydown seam stays jQuery-side)', function(done) {
      build('accN9', {});
      var titles = $html[0].querySelectorAll('.accordion-title');
      var contents = $html[0].querySelectorAll('.accordion-content');

      $html.find('.accordion-title').eq(0).focus().trigger(window.mockKeyboardEvent('ARROW_DOWN'));

      document.activeElement.should.equal(titles[1]);
      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { contents[1].getAttribute('aria-hidden').should.equal('false'); },
        then: done
      });
    });
  });

  describe('deep link', function() {
    it('opens the pane for the hash through a real hashchange', function(done) {
      build('accN10', {deepLink: true});
      var contents = $html[0].querySelectorAll('.accordion-content');

      window.history.replaceState('', document.title, '#accN10-c1');
      window.dispatchEvent(new Event('hashchange'));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          contents[1].parentElement.classList.contains('is-active').should.be.true;
        },
        then: () => {
          contents[1].getAttribute('aria-hidden').should.equal('false');
          var deeplinkSpy = sinon.spy();
          FoundationNext.Events.on($html[0], 'deeplink.zf.accordion', deeplinkSpy);

          window.history.replaceState('', document.title, '#accN10-c2');
          window.dispatchEvent(new Event('hashchange'));
          tryInterval({
            interval: 10,
            timeout: 2000,
            try: () => { sinon.assert.calledOnce(deeplinkSpy); },
            then: () => {
              deeplinkSpy.firstCall.args[0].type.should.equal('deeplink');
              deeplinkSpy.firstCall.args[0].namespace.should.equal('accordion.zf');
              done();
            }
          });
        }
      });
    });

    it('stops following the hash after destroy', function(done) {
      build('accN11', {deepLink: true});
      var contents = $html[0].querySelectorAll('.accordion-content');

      setTimeout(function() {
        plugin.destroy();
        plugin = null;

        window.history.replaceState('', document.title, '#accN11-c2');
        window.dispatchEvent(new Event('hashchange'));

        setTimeout(function() {
          contents[2].getAttribute('aria-hidden').should.equal('true');
          done();
        }, 50);
      }, 50);
    });
  });

  describe('post-destroy load callback', function() {
    it('does not throw when the deepLinkSmudge load callback lands after destroy', function(done) {
      build('accN12', {deepLink: true, deepLinkSmudge: true, deepLinkSmudgeDelay: 0});
      plugin.destroy();
      plugin = null;

      // the onLoad callback fires on the next macrotask; the S6 slider guard
      // must absorb it silently
      setTimeout(done, 60);
    });
  });
});
