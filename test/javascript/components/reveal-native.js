// S6 contract pins (7.0 line A): Reveal's internals moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// These tests pin that contract from the outside; the pre-existing reveal.js
// suite is untouched on purpose and stays green.
describe('Reveal (native layer contract)', function() {

  var plugin;
  var $html;
  var $scratch = []; // appended elements every test must leave behind
  var template = `<div class="reveal" id="revealNative1" data-reveal>
    Modal content
    <button class="close-button" data-close aria-label="Close modal" type="button">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  afterEach(function() {
    // destroy() nulls instance properties, so skip if the test destroyed it already
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    plugin = null;
    if ($html) {
      $html.remove();
      $html = null;
    }
    $scratch.forEach(function($el) { $el.remove(); });
    $scratch = [];
    document.activeElement.blur();
    document.documentElement.style.top = '';
    document.documentElement.classList.remove('is-reveal-open');
    document.documentElement.classList.remove('zf-has-scroll');
  });

  function removeHash() {
    window.history.replaceState('', document.title, window.location.pathname + window.location.search);
  }

  describe('state events', function() {
    it('fires open.zf.reveal through the native event layer with the zf.reveal namespace and no extra parameters', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      var el = $html[0];
      var openSpy = sinon.spy();
      FoundationNext.Events.on(el, 'open.zf.reveal', openSpy);

      plugin.open();

      sinon.assert.calledOnce(openSpy);
      openSpy.firstCall.args.length.should.equal(1);
      openSpy.firstCall.args[0].type.should.equal('open');
      openSpy.firstCall.args[0].namespace.should.equal('reveal.zf');
      $html.should.be.visible;
    });

    it('fires closed.zf.reveal once the modal finished hiding', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      var el = $html[0];
      plugin.open();

      FoundationNext.Events.on(el, 'closed.zf.reveal', function(event) {
        event.type.should.equal('closed');
        event.namespace.should.equal('reveal.zf');
        $html.should.be.hidden;
        done();
      });

      plugin.close();
    });

    it('still reaches jQuery listeners on the element with the real event (white absorption)', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      var spy = sinon.spy();
      $html.on('open.zf.reveal', spy);

      plugin.open();

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('open');
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('overlay', function() {
    it('creates the overlay natively and keeps the jQuery $overlay surface', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});

      plugin.$overlay.should.be.an('object');
      plugin.$overlay.should.have.class('reveal-overlay');
      plugin.$overlay[0].tagName.should.equal('DIV');
      document.body.contains(plugin.$overlay[0]).should.be.true;
    });

    it('moves the modal element into the overlay with appendChild', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});

      plugin.$overlay[0].contains($html[0]).should.be.true;
    });

    it('closes on a real overlay click', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        $html.should.be.hidden;
        done();
      });

      plugin.$overlay[0].click();
    });

    it('closes when jQuery synthetically clicks the overlay (the .click() native shortcut bridges the layers)', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        $html.should.be.hidden;
        done();
      });

      plugin.$overlay.trigger('click');
    });

    it('closes on a jQuery-synthesized tap (the Touch seam keeps the tap half on jQuery)', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        $html.should.be.hidden;
        done();
      });

      plugin.$overlay.trigger('tap');
    });

    it('does not close on clicks inside the modal itself', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {overlay: true});
      plugin.open();
      var closedSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'closed.zf.reveal', closedSpy);

      $html[0].click();

      setTimeout(function() {
        sinon.assert.notCalled(closedSpy);
        $html.should.be.visible;
        done();
      }, 20);
    });
  });

  describe('keyboard', function() {
    it('closes on ESC from a real keydown on window', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        plugin.isActive.should.be.false;
        done();
      });

      // keyCode: this headless Chrome ignores "which" in KeyboardEventInit
      window.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));
    });

    it('closes on ESC from the synthetic jQuery mock event (the pinned jQuery-side keydown seam)', function(done) {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        plugin.isActive.should.be.false;
        done();
      });

      $(window).trigger(mockKeyboardEvent('ESCAPE'));
    });

    it('traps TAB cycles inside the modal and releases the trap on close', function(done) {
      $html = $('<div class="reveal" id="revealTrap1"><a href="#">first</a> text <a href="#">last</a></div>').appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      var el = $html[0];
      var links = el.querySelectorAll('a');
      plugin.open();

      // TAB on the last focusable wraps to the first
      links[links.length - 1].focus();
      var tabAtLast = new KeyboardEvent('keydown', {which: 9, keyCode: 9, bubbles: true, cancelable: true});
      links[links.length - 1].dispatchEvent(tabAtLast);
      tabAtLast.defaultPrevented.should.be.true;
      document.activeElement.should.equal(links[0]);

      // SHIFT+TAB on the first focusable wraps to the last
      links[0].focus();
      var shiftTabAtFirst = new KeyboardEvent('keydown', {which: 9, keyCode: 9, shiftKey: true, bubbles: true, cancelable: true});
      links[0].dispatchEvent(shiftTabAtFirst);
      shiftTabAtFirst.defaultPrevented.should.be.true;
      document.activeElement.should.equal(links[links.length - 1]);

      plugin.close();
      setTimeout(function() {
        // the trap listener is gone: a TAB on the element is no longer hijacked
        var tabAfter = new KeyboardEvent('keydown', {which: 9, keyCode: 9, bubbles: true, cancelable: true});
        el.dispatchEvent(tabAfter);
        tabAfter.defaultPrevented.should.be.false;
        done();
      }, 0);
    });
  });

  describe('body scroll lock', function() {
    it('locks the html offset with an explicit px unit and restores scroll on close', function(done) {
      $html = $(template).appendTo('body');
      $scratch.push($('<div style="height: 4000px"></div>').appendTo('body'));
      window.scrollTo(0, 120);
      plugin = new Foundation.Reveal($html, {});

      plugin.open();
      document.documentElement.style.top.should.equal('-120px');

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        document.documentElement.style.top.should.equal('');
        window.scrollY.should.equal(120);
        window.scrollTo(0, 0);
        done();
      });

      plugin.close();
    });
  });

  describe('deepLink', function() {
    it('opens through a real hashchange', function(done) {
      $html = $('<div class="reveal" id="revealDeepLink1" data-reveal>content</div>').appendTo('body');
      plugin = new Foundation.Reveal($html, {deepLink: true});
      var opens = 0;
      FoundationNext.Events.on($html[0], 'open.zf.reveal', function() {
        opens++;
      });

      window.location.hash = 'revealDeepLink1';

      setTimeout(function() {
        opens.should.equal(1);
        $html.should.be.visible;
        window.location.hash.should.equal('#revealDeepLink1');
        removeHash();
        done();
      }, 50);
    });

    it('writes the hash on open and strips it on close', function(done) {
      $html = $('<div class="reveal" id="revealDeepLink2" data-reveal>content</div>').appendTo('body');
      plugin = new Foundation.Reveal($html, {deepLink: true});

      plugin.open();
      window.location.hash.should.equal('#revealDeepLink2');

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        window.location.hash.should.equal('');
        removeHash();
        done();
      });
      plugin.close();
    });
  });

  describe('trigger delegation', function() {
    it('opens through the document [data-open] delegation on a real click', function(done) {
      $html = $(template.replace('revealNative1', 'revealNative2')).appendTo('body');
      var anchor = document.createElement('button');
      anchor.setAttribute('data-open', 'revealNative2');
      document.body.appendChild(anchor);
      $scratch.push($(anchor));
      plugin = new Foundation.Reveal($html, {});

      FoundationNext.Events.on($html[0], 'open.zf.reveal', function() {
        $html.should.be.visible;
        done();
      });

      anchor.click();
    });

    it('closes through the [data-close] control inside the modal (bubbling close.zf.trigger)', function(done) {
      $html = $(template.replace('revealNative1', 'revealNative3')).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      plugin.open();

      FoundationNext.Events.on($html[0], 'closed.zf.reveal', function() {
        $html.should.be.hidden;
        done();
      });

      $html.find('[data-close]')[0].click();
    });

    it('keeps the scrollbar class updated through the native resizeme listener', function() {
      $html = $(template.replace('revealNative1', 'revealNative4')).appendTo('body');
      $scratch.push($('<div style="height: 4000px"></div>').appendTo('body'));
      plugin = new Foundation.Reveal($html, {});
      plugin.open();
      document.documentElement.classList.contains('zf-has-scroll').should.be.true;

      document.documentElement.classList.remove('zf-has-scroll');
      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');
      document.documentElement.classList.contains('zf-has-scroll').should.be.true;
    });
  });

  describe('closeme chain', function() {
    beforeEach(function() {
      // The window closeme listener snapshots [data-yeti-box] when it is
      // installed (at load time); re-run the initializer so the chain is
      // armed here. The jQuery off-then-on registration makes it idempotent.
      Foundation.Triggers.Initializers.addClosemeListener();
    });

    it('closes other open reveals when a reveal opens (closeme producer seam)', function(done) {
      $html = $(template.replace('revealNative1', 'revealNative5')).appendTo('body');
      var $html2 = $(template.replace('revealNative1', 'revealNative6')).appendTo('body');
      $scratch.push($html2);
      var plugin2 = new Foundation.Reveal($html2, {});
      plugin2.open();

      FoundationNext.Events.on($html2[0], 'closed.zf.reveal', function() {
        $html2.should.be.hidden;
        plugin2.destroy();
        done();
      });

      // multipleOpened defaults to false: opening must close the other modal
      plugin = new Foundation.Reveal($html, {});
      plugin.open();
    });

    it('S4 ledger: the closeme broadcast is a real bubbling event, so a [data-closable] ancestor of a broadcast reveal closes along (6.x triggerHandler did not bubble)', function(done) {
      var $wrap = $('<div id="closableWrap" data-closable="fade-out"></div>').appendTo('body');
      $scratch.push($wrap);
      var $inner = $('<div class="reveal" id="revealInClosable" data-reveal>content</div>').appendTo('body');
      $scratch.push($inner);
      var plugin2 = new Foundation.Reveal($inner, {appendTo: '#closableWrap'});
      plugin2.open();

      var animateOut = sinon.spy(Foundation.Motion, 'animateOut');
      FoundationNext.Events.on($inner[0], 'closed.zf.reveal', function() {
        // the broadcast bubbled through the [data-closable] wrap and the
        // document closable delegation closed it along with the reveal
        sinon.assert.called(animateOut);
        animateOut.restore();
        plugin2.destroy();
        done();
      });

      // exactly what the Triggers closeMeListener does per broadcast element
      FoundationNext.Events.trigger($inner[0], 'close.zf.trigger', [$inner[0]]);
    });
  });

  describe('destroy', function() {
    it('drops the whole multi-segment zf.reveal:<id> namespace on window, on both layers', function() {
      $html = $(template.replace('revealNative1', 'revealNative7')).appendTo('body');
      plugin = new Foundation.Reveal($html, {deepLink: true, closeOnEsc: true});
      var id = plugin.id;
      var escSpy = sinon.spy();
      // same-table (jQuery) probes for the namespace wipe
      $(window).on(`keydown.zf.reveal:${id}`, escSpy);
      $(window).on(`hashchange.zf.reveal:${id}`, escSpy);

      plugin.open();
      plugin.destroy();
      plugin = null;
      removeHash();

      window.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));
      $(window).trigger(mockKeyboardEvent('ESCAPE'));
      sinon.assert.notCalled(escSpy);
    });

    it('drops every element listener on destroy, against both transports', function() {
      $html = $(template.replace('revealNative1', 'revealNative8')).appendTo('body');
      plugin = new Foundation.Reveal($html, {});
      var jqSpy = sinon.spy();
      $html.on('mutateme.zf.reveal', jqSpy);

      plugin.destroy();
      plugin = null;

      // a real event (white-absorbed by jQuery listeners) and a synthetic one
      // must both find nothing: destroy wiped the element listeners
      FoundationNext.Events.trigger($html[0], 'mutateme.zf.reveal');
      $html.trigger('mutateme.zf.reveal');
      sinon.assert.notCalled(jqSpy);
    });
  });
});
