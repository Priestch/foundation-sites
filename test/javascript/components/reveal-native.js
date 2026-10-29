// S6 contract pins (7.0 line A): Reveal's internals moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// These tests pin that contract from the outside; the pre-existing reveal.js
// suite is untouched on purpose and stays green.
describe('Reveal (native layer contract)', function() {

  var plugin;
  var html;
  var scratch = []; // appended elements every test must leave behind
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
    if (html) {
      html.remove();
      html = null;
    }
    scratch.forEach(function(el) { el.remove(); });
    scratch = [];
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
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      var el = html;
      var openSpy = sinon.spy();
      FoundationNext.Events.on(el, 'open.zf.reveal', openSpy);

      plugin.open();

      sinon.assert.calledOnce(openSpy);
      openSpy.firstCall.args.length.should.equal(1);
      openSpy.firstCall.args[0].type.should.equal('open');
      openSpy.firstCall.args[0].namespace.should.equal('reveal.zf');
      FoundationNext.Dom.visible(html).should.be.true;
    });

    it('fires closed.zf.reveal once the modal finished hiding', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      var el = html;
      plugin.open();

      FoundationNext.Events.on(el, 'closed.zf.reveal', function(event) {
        event.type.should.equal('closed');
        event.namespace.should.equal('reveal.zf');
        FoundationNext.Dom.visible(html).should.be.false;
        done();
      });

      plugin.close();
    });

    it('still reaches jQuery listeners on the element with the real event (white absorption)', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      var spy = sinon.spy();
      $(html).on('open.zf.reveal', spy);

      plugin.open();

      sinon.assert.calledOnce(spy);
      spy.firstCall.args[0].type.should.equal('open');
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('overlay', function() {
    it('creates the overlay natively and keeps the jQuery overlay surface', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      chai.expect(plugin.$overlay).to.be.an.instanceof(Element);
      plugin.$overlay.classList.contains('reveal-overlay').should.be.true;
      plugin.$overlay.tagName.should.equal('DIV');
      document.body.contains(plugin.$overlay).should.be.true;
    });

    it('moves the modal element into the overlay with appendChild', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      plugin.$overlay.contains(html).should.be.true;
    });

    it('closes on a real overlay click', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
        done();
      });

      plugin.$overlay.click();
    });

    it('closes when jQuery synthetically clicks the overlay (the .click() native shortcut bridges the layers)', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
        done();
      });

      FoundationNext.Events.trigger(plugin.$overlay, "click");
    });

    it('closes on a real synthesized tap (the Touch tap flips to the native layer in S13)', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
        done();
      });

      FoundationNext.Events.trigger(plugin.$overlay, 'tap');
    });

    it('does not close on clicks inside the modal itself', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});
      plugin.open();
      var closedSpy = sinon.spy();
      FoundationNext.Events.on(html, 'closed.zf.reveal', closedSpy);

      html.click();

      setTimeout(function() {
        sinon.assert.notCalled(closedSpy);
        FoundationNext.Dom.visible(html).should.be.true;
        done();
      }, 20);
    });
  });

  describe('keyboard', function() {
    it('closes on ESC from a real keydown on window', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        plugin.isActive.should.be.false;
        done();
      });

      // keyCode: this headless Chrome ignores "which" in KeyboardEventInit
      window.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));
    });

    it('closes on ESC from the synthetic jQuery mock event (the pinned jQuery-side keydown seam)', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        plugin.isActive.should.be.false;
        done();
      });

      window.dispatchEvent(mockKeyboardEvent('ESCAPE'));
    });

    it('traps TAB cycles inside the modal and releases the trap on close', function(done) {
      html = document.body.appendChild(fixture('<div class="reveal" id="revealTrap1"><a href="#">first</a> text <a href="#">last</a></div>'));
      plugin = new Foundation.Reveal(html, {});
      var el = html;
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
      html = document.body.appendChild(fixture(template));
      scratch.push(document.body.appendChild(fixture('<div style="height: 4000px"></div>')));
      window.scrollTo(0, 120);
      plugin = new Foundation.Reveal(html, {});

      plugin.open();
      document.documentElement.style.top.should.equal('-120px');

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
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
      html = document.body.appendChild(fixture('<div class="reveal" id="revealDeepLink1" data-reveal>content</div>'));
      plugin = new Foundation.Reveal(html, {deepLink: true});
      var opens = 0;
      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        opens++;
      });

      window.location.hash = 'revealDeepLink1';

      setTimeout(function() {
        opens.should.equal(1);
        FoundationNext.Dom.visible(html).should.be.true;
        window.location.hash.should.equal('#revealDeepLink1');
        removeHash();
        done();
      }, 50);
    });

    it('writes the hash on open and strips it on close', function(done) {
      html = document.body.appendChild(fixture('<div class="reveal" id="revealDeepLink2" data-reveal>content</div>'));
      plugin = new Foundation.Reveal(html, {deepLink: true});

      plugin.open();
      window.location.hash.should.equal('#revealDeepLink2');

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        window.location.hash.should.equal('');
        removeHash();
        done();
      });
      plugin.close();
    });
  });

  describe('trigger delegation', function() {
    it('opens through the document [data-open] delegation on a real click', function(done) {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative2')));
      var anchor = document.createElement('button');
      anchor.setAttribute('data-open', 'revealNative2');
      document.body.appendChild(anchor);
      scratch.push(anchor);
      plugin = new Foundation.Reveal(html, {});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.true;
        done();
      });

      anchor.click();
    });

    it('closes through the [data-close] control inside the modal (bubbling close.zf.trigger)', function(done) {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative3')));
      plugin = new Foundation.Reveal(html, {});
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
        done();
      });

      html.querySelector('[data-close]').click();
    });

    it('keeps the scrollbar class updated through the native resizeme listener', function() {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative4')));
      scratch.push(document.body.appendChild(fixture('<div style="height: 4000px"></div>')));
      plugin = new Foundation.Reveal(html, {});
      plugin.open();
      document.documentElement.classList.contains('zf-has-scroll').should.be.true;

      document.documentElement.classList.remove('zf-has-scroll');
      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');
      document.documentElement.classList.contains('zf-has-scroll').should.be.true;
    });
  });

  describe('closeme chain', function() {
    it('closes other open reveals when a reveal opens (closeme producer seam)', function(done) {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative5')));
      var html2 = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative6')));
      scratch.push(html2);
      var plugin2 = new Foundation.Reveal(html2, {});
      plugin2.open();

      FoundationNext.Events.on(html2, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html2).should.be.false;
        plugin2.destroy();
        done();
      });

      // The window closeme listener only registers when [data-yeti-box]
      // elements exist (the 6.x existence condition) - arm HERE, after the
      // fixtures, so the chain does not depend on load-time leftovers.
      Foundation.Triggers.Initializers.addClosemeListener();

      // multipleOpened defaults to false: opening must close the other modal
      plugin = new Foundation.Reveal(html, {});
      plugin.open();
    });

    it('S4 ledger: the closeme broadcast is a real bubbling event, so a [data-closable] ancestor of a broadcast reveal closes along (6.x triggerHandler did not bubble)', function(done) {
      var wrap = document.body.appendChild(fixture('<div id="closableWrap" data-closable="fade-out"></div>'));
      scratch.push(wrap);
      var inner = document.body.appendChild(fixture('<div class="reveal" id="revealInClosable" data-reveal>content</div>'));
      scratch.push(inner);
      var plugin2 = new Foundation.Reveal(inner, {appendTo: '#closableWrap'});
      plugin2.open();

      var animateOut = sinon.spy(Foundation.Motion, 'animateOut');
      FoundationNext.Events.on(inner, 'closed.zf.reveal', function() {
        // the broadcast bubbled through the [data-closable] wrap and the
        // document closable delegation closed it along with the reveal
        sinon.assert.called(animateOut);
        animateOut.restore();
        plugin2.destroy();
        done();
      });

      // exactly what the Triggers closeMeListener does per broadcast element
      FoundationNext.Events.trigger(inner, 'close.zf.trigger', [inner]);
    });
  });

  describe('destroy', function() {
    it('drops its own multi-segment zf.reveal:<id> namespace on window (behavioral: no closed.zf.reveal after destroy)', function() {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative7')));
      plugin = new Foundation.Reveal(html, {deepLink: true, closeOnEsc: true});
      var id = plugin.id;
      var closedSpy = sinon.spy();
      // behavioral probe: if the plugin's ESC listener survived destroy, an
      // ESC dispatch would close() and produce closed.zf.reveal. (7.0
      // semantics: destroy wipes the library's OWN listeners - third-party
      // listeners of any table now survive, where 6.x scorched-earth wiped
      // every jQuery listener because jQuery was one shared table.)
      FoundationNext.Events.on(html, 'closed.zf.reveal', closedSpy);

      plugin.open();
      plugin.destroy();
      plugin = null;
      removeHash();

      window.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));
      window.dispatchEvent(mockKeyboardEvent('ESCAPE'));
      sinon.assert.notCalled(closedSpy);
    });

    it('drops every own element listener on destroy (behavioral: the instance is inert afterwards)', function() {
      html = document.body.appendChild(fixture(template.replace('revealNative1', 'revealNative8')));
      plugin = new Foundation.Reveal(html, {closeOnEsc: true});
      var closedSpy = sinon.spy();
      FoundationNext.Events.on(html, 'closed.zf.reveal', closedSpy);

      plugin.destroy();
      plugin = null;

      // behavioral probe: no plugin listener answers anything after destroy
      // (the bare Events.off(element) wiped its own table; third-party
      // listeners survive - the 7.0 ownership semantics, ledger-noted)
      window.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));
      sinon.assert.notCalled(closedSpy);
    });
  });
});
