// S8 contract pins (7.0 line A): Tabs' delegated clicks, the deep-link
// hashchange and the collapse production moved to the native
// Registry/Events/DOM layer while the public contract stays byte-identical.
// Known seams: the keydown binding stays on jQuery (the coarse suite feeds
// jQuery-synthesized mock keydowns), change.zf.tabs keeps its jQuery
// production (jQuery consumers read the forwarded collections as trailing
// handler arguments, which real events cannot deliver) and matchHeight's
// changed.zf.mediaquery consumer stays on jQuery (MediaQuery seam). The
// mutateme forward joined the native layer in the S10 group flip (together
// with its last jQuery-side consumers). These tests pin that contract from
// the outside; the pre-existing tabs.js suite is untouched on purpose and
// stays green.
describe('Tabs (native layer contract)', function() {
  var plugin;
  var $html;
  var counter = 0;

  var template = (id) => `
    <div>
      <ul class="tabs" data-tabs id="${id}">
        <li class="tabs-title is-active"><a href="#${id}-panel1" aria-selected="true">Tab 1</a></li>
        <li class="tabs-title"><a href="#${id}-panel2">Tab 2</a></li>
      </ul>

      <div class="tabs-content" data-tabs-content="${id}">
        <div class="tabs-panel is-active" id="${id}-panel1"><p>one</p><div data-mutate>mutates</div></div>
        <div class="tabs-panel" id="${id}-panel2"><p>two</p></div>
      </div>
    </div>`;

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

  function build(options) {
    var id = 'tabsNative' + (++counter);
    $html = $(template(id)).appendTo('body');
    plugin = new Foundation.Tabs($html.find('[data-tabs]'), options);
    return plugin;
  }

  describe('delegated clicks', function() {
    it('switches panels on a real click of a tab title and prevents the hash jump', function() {
      build({});
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      links[1].dispatchEvent(click);
      click.defaultPrevented.should.be.true;

      panels[1].classList.contains('is-active').should.be.true;
      panels[0].classList.contains('is-active').should.be.false;
    });
  });

  describe('keyboard', function() {
    it('switches to the next tab from a real keydown (ARROW_RIGHT)', function() {
      build({});
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');

      links[0].focus();
      links[0].dispatchEvent(new KeyboardEvent('keydown', {which: 39, keyCode: 39, bubbles: true, cancelable: true}));

      panels[1].classList.contains('is-active').should.be.true;
      document.activeElement.should.equal(links[1]);
    });

    it('switches to the previous tab from a real keydown (ARROW_LEFT)', function() {
      build({});
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');

      links[1].focus();
      links[1].dispatchEvent(new KeyboardEvent('keydown', {which: 37, keyCode: 37, bubbles: true, cancelable: true}));

      panels[0].classList.contains('is-active').should.be.true;
    });

    it('keeps answering jQuery-synthesized mock keydowns (the keydown seam stays jQuery-side)', function() {
      build({});
      var links = $html.find('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');

      links.eq(0).focus().trigger(window.mockKeyboardEvent('ARROW_RIGHT'));

      panels[1].classList.contains('is-active').should.be.true;
    });
  });

  describe('state events', function() {
    it('keeps change.zf.tabs on the jQuery production with trailing-argument forwarding (the pinned change seam)', function() {
      build({});
      var links = $html.find('[role="tab"]');
      var $targetArg = null;
      $html.find('[data-tabs]').one('change.zf.tabs', function(e, $target) {
        $targetArg = $target;
      });

      plugin.selectTab(`#tabsNative${counter}-panel2`);

      // the jQuery-synthesized change still carries the collections as
      // trailing arguments - what a real CustomEvent cannot do
      chai.expect($targetArg).to.not.be.null;
      $targetArg[0].should.equal(links[1].parentNode);
    });

    it('fires collapse.zf.tabs through the native event layer (activeCollapse)', function() {
      build({activeCollapse: true});
      var el = $html.find('[data-tabs]')[0];
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');
      var collapseSpy = sinon.spy();
      FoundationNext.Events.on(el, 'collapse.zf.tabs', collapseSpy);

      // clicking the active tab with activeCollapse collapses it
      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      links[0].dispatchEvent(click);

      panels[0].classList.contains('is-active').should.be.false;
      sinon.assert.calledOnce(collapseSpy);
      collapseSpy.firstCall.args[0].type.should.equal('collapse');
      collapseSpy.firstCall.args[0].namespace.should.equal('tabs.zf');
      collapseSpy.firstCall.args[1][0].should.equal(links[0].parentNode);
    });

    it('still reaches jQuery listeners with the real collapse event (white absorption)', function() {
      build({activeCollapse: true});
      var links = $html[0].querySelectorAll('[role="tab"]');
      var spy = sinon.spy();
      $html.find('[data-tabs]').on('collapse.zf.tabs', spy);

      plugin.selectTab(`#tabsNative${counter}-panel1`);

      sinon.assert.calledOnce(spy);
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('state and ARIA', function() {
    it('flips aria-selected, tabindex and aria-hidden natively on switch', function() {
      build({});
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');

      plugin.selectTab(`#tabsNative${counter}-panel2`);

      links[0].getAttribute('aria-selected').should.equal('false');
      links[0].getAttribute('tabindex').should.equal('-1');
      links[1].getAttribute('aria-selected').should.equal('true');
      links[1].getAttribute('tabindex').should.equal('0');
      panels[0].getAttribute('aria-hidden').should.equal('true');
      chai.expect(panels[1].getAttribute('aria-hidden')).to.be.null;
    });
  });

  describe('deep link', function() {
    it('selects the panel for the hash through a real hashchange', function(done) {
      build({deepLink: true});
      var id = plugin.id;
      var links = $html[0].querySelectorAll('[role="tab"]');
      var panels = $html[0].querySelectorAll('.tabs-panel');
      var deeplinkSpy = sinon.spy();
      FoundationNext.Events.on($html.find('[data-tabs]')[0], 'deeplink.zf.tabs', deeplinkSpy);

      window.history.replaceState('', document.title, `#${id}-panel2`);
      window.dispatchEvent(new Event('hashchange'));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          panels[1].classList.contains('is-active').should.be.true;
          links[1].getAttribute('aria-selected').should.equal('true');
          sinon.assert.calledOnce(deeplinkSpy);
        },
        then: () => {
          deeplinkSpy.firstCall.args[0].type.should.equal('deeplink');
          deeplinkSpy.firstCall.args[0].namespace.should.equal('tabs.zf');
          done();
        }
      });
    });

    it('stops following the hash after destroy', function(done) {
      build({deepLink: true});
      var id = plugin.id;
      var panels = $html[0].querySelectorAll('.tabs-panel');

      setTimeout(function() {
        plugin.destroy();
        plugin = null;

        window.history.replaceState('', document.title, `#${id}-panel2`);
        window.dispatchEvent(new Event('hashchange'));

        setTimeout(function() {
          panels[1].classList.contains('is-active').should.be.false;
          done();
        }, 50);
      }, 50);
    });
  });

  describe('seams', function() {
    it('forwards mutateme.zf.trigger as one real bubbling event since the S10 group flip (one delivery per listener)', function() {
      build({});
      var mutateEl = $html.find('[data-mutate]')[0];
      var jqSpy = sinon.spy();
      $(mutateEl).on('mutateme.zf.trigger', jqSpy);
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(mutateEl, 'mutateme.zf.trigger', nativeSpy);

      plugin.selectTab(`#tabsNative${counter}-panel1`);

      // the panel was already the active one: no change happens, force one
      plugin.selectTab(`#tabsNative${counter}-panel2`);
      plugin.selectTab(`#tabsNative${counter}-panel1`);

      // the native forward reaches the flipped consumers directly, and a
      // third-party jQuery listener absorbs the same single real event
      sinon.assert.calledOnce(nativeSpy);
      sinon.assert.calledOnce(jqSpy);
    });

    it('re-runs _setHeight from the jQuery-synthesized mediaquery broadcast (the MediaQuery seam stays jQuery-side)', function() {
      build({matchHeight: true});
      var panels = $html[0].querySelectorAll('.tabs-panel');
      // equalized at init: both panels carry the tallest panel's min-height
      panels[0].style.minHeight.should.not.equal('');

      panels.forEach((panel) => { panel.style.minHeight = ''; });
      $(window).trigger('changed.zf.mediaquery');

      // the jQuery-synthesized broadcast re-applied the equalized heights
      panels[0].style.minHeight.should.not.equal('');
    });
  });
});
