// S9 contract pins (7.0 line A): Drilldown's click consumers (submenu
// anchors, back buttons, body close handler), the scrollTop self-consumer
// and the open/hide/close/closed/scrollme state production moved to the
// native Registry/Events/DOM layer while the public contract stays
// byte-identical. Known seams: the keydown binding and the transitionend
// `.one()` follow-ups stay on jQuery (the coarse suite feeds mock keydowns
// and drives transitionend through jQuery triggerHandler), the scroll tween
// stays on jQuery fx, and the selector-filtered collection class writes
// keep their jQuery form. The mutateme consumer joined the native layer in
// the S10 group flip (together with its last jQuery-synthesized producers).
// These tests pin that contract from the outside; the pre-existing
// drilldown.js suite is untouched on purpose and stays green.
describe('Drilldown (native layer contract)', function() {
  var plugin;
  var html;

  var template = `<ul class="menu" data-drilldown style="width: 200px" id="drilldownNative">
    <li>
      <a href="#">Item 1</a>
      <ul id="drilldownNativeMenu-1" class="menu">
        <li>
          <a href="#">Item 1A</a>
          <ul id="drilldownNativeMenu-1A" class="menu">
            <li><a href="#Item-1Aa">Item 1Aa</a></li>
          </ul>
        </li>
        <li><a href="#Item-1B">Item 1B</a></li>
      </ul>
    </li>
    <li>
      <a href="#">Item 2</a>
      <ul id="drilldownNativeMenu-2" class="menu">
        <li><a href="#Item-2A">Item 2A</a></li>
      </ul>
    </li>
    <li><a href="#Item-3"> Item 3</a></li>
  </ul>`;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if (html) { html.remove(); html = null; }
    document.activeElement.blur();
  });

  function build(options) {
    html = document.body.appendChild(fixture(template));
    plugin = new Foundation.Drilldown(html, options);
    return plugin;
  }

  describe('state events', function() {
    it('fires open.zf.drilldown through the native event layer with the li in detail', function() {
      build({});
      var el = html;
      var li = html.querySelector(':scope > li:nth-child(1)');
      var openSpy = sinon.spy();
      FoundationNext.Events.on(el, 'open.zf.drilldown', openSpy);

      plugin._show(li);

      sinon.assert.calledOnce(openSpy);
      openSpy.firstCall.args[0].type.should.equal('open');
      openSpy.firstCall.args[0].namespace.should.equal('drilldown.zf');
      openSpy.firstCall.args[1][0].should.equal(li);
      // class/ARIA state flipped synchronously, before the event
      li.querySelector(':scope > ul').classList.contains('is-active').should.be.true;
      li.getAttribute('aria-expanded').should.equal('true');
      li.querySelector(':scope > ul').getAttribute('aria-hidden').should.equal('false');
    });

    it('fires hide.zf.drilldown on the submenu and close.zf.drilldown on the root', function() {
      build({});
      var el = html;
      var li = html.querySelector(':scope > li:nth-child(1)');
      var sub = li.querySelector(':scope > ul');
      var hideSpy = sinon.spy();
      var closeSpy = sinon.spy();
      // hide is produced on the submenu itself and bubbles to the root
      FoundationNext.Events.on(el, 'hide.zf.drilldown', hideSpy);
      FoundationNext.Events.on(el, 'close.zf.drilldown', closeSpy);

      plugin._show(li);
      plugin._hide(sub);

      sinon.assert.calledOnce(hideSpy);
      hideSpy.firstCall.args[0].type.should.equal('hide');
      hideSpy.firstCall.args[1][0].should.equal(sub);
      sub.classList.contains('is-closing').should.be.true;
      sub.getAttribute('aria-hidden').should.equal('true');

      plugin._hideAll();
      sinon.assert.calledOnce(closeSpy);
      closeSpy.firstCall.args[0].type.should.equal('close');
    });

    it('fires closed.zf.drilldown once the transitionend wait fires (fx seam keeps the wait on jQuery)', function() {
      build({});
      var el = html;
      plugin._show(html.querySelector(':scope > li:nth-child(1)'));
      var closedSpy = sinon.spy();
      FoundationNext.Events.on(el, 'closed.zf.drilldown', closedSpy);

      plugin._hideAll();
      sinon.assert.notCalled(closedSpy);

      // the .one(transitionend) wait sits on the active submenu, jQuery
      // side; drive it through the same helper the coarse suite uses (the
      // helper resolves to 'webkitTransitionEnd' in Chrome). The jQuery
      // triggerHandler stays the instrument: the native one never reaches
      // the jQuery .one listener.
      $(html.querySelector('#drilldownNativeMenu-1'))
        .triggerHandler(Foundation.transitionend($(html.querySelector('#drilldownNativeMenu-1'))));

      sinon.assert.calledOnce(closedSpy);
      closedSpy.firstCall.args[0].type.should.equal('closed');
      html.querySelector('#drilldownNativeMenu-1').classList.contains('is-closing').should.be.false;
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function() {
      build({});
      plugin._show(html.querySelector(':scope > li:nth-child(1)'));
      var spy = sinon.spy();
      $(html).on('close.zf.drilldown', spy);

      plugin._hideAll();

      sinon.assert.calledOnce(spy);
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('opens the submenu on ARROW_RIGHT from a real keydown (white absorption)', function() {
      build({});
      var anchor = html.querySelector(':scope > li:nth-child(1) > a');
      anchor.focus();

      var keydown = new KeyboardEvent('keydown', {which: 39, keyCode: 39, bubbles: true, cancelable: true});
      anchor.dispatchEvent(keydown);

      keydown.defaultPrevented.should.be.true;
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.true;
    });

    it('opens the submenu on ARROW_RIGHT from the synthetic jQuery mock (the pinned keydown seam)', function() {
      build({});
      html.querySelector(':scope > li:nth-child(1) > a').focus();
      html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.true;
    });

    it('closes on ESC from a real keydown', function() {
      build({});
      plugin._show(html.querySelector(':scope > li:nth-child(1)'));
      var subAnchor = html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a');
      subAnchor.focus();

      subAnchor.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-closing').should.be.true;
    });
  });

  describe('click consumers', function() {
    it('opens on a real click on a submenu anchor and prevents the default', function() {
      build({});
      var anchor = html.querySelector(':scope > li:nth-child(1) > a');

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      anchor.dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.true;
    });

    it('handles the back button from a jQuery-synthesized click (the .click() native shortcut bridges the layers)', function() {
      build({});
      plugin._show(html.querySelector(':scope > li:nth-child(1)'));
      var backLi = html.querySelector('#drilldownNativeMenu-1 > .js-drilldown-back');

      FoundationNext.Events.trigger(backLi, 'click');

      html.querySelector('#drilldownNativeMenu-1').classList.contains('is-closing').should.be.true;
    });

    it('closes from a real body click when closeOnClick is set', function() {
      build({closeOnClick: true});
      // the body handler is installed by the anchor click path
      html.querySelector(':scope > li:nth-child(1) > a').click();
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.true;

      document.body.click();

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-closing').should.be.true;
    });
  });

  describe('mutateme (S10 group flip)', function() {
    it('resizes through the native mutateme.zf.trigger; the jQuery-synthesized form finds nothing', function() {
      build({});
      var getDimensions = sinon.spy(Foundation.Box, 'GetDimensions');

      FoundationNext.Events.trigger(plugin.$element[0], 'mutateme.zf.trigger');
      sinon.assert.called(getDimensions);
      var count = getDimensions.callCount;

      // the mixed-state boundary: a jQuery-synthesized dispatch never
      // produces a real event, so the flipped consumer cannot hear it.
      // jQuery trigger stays the instrument on purpose (the pin is the
      // nothing-found half of the S10 group flip).
      $(plugin.$element).trigger('mutateme.zf.trigger');
      getDimensions.callCount.should.equal(count);
      getDimensions.restore();
    });
  });

  describe('scrollTop (fx seam)', function() {
    it('fires scrollme.zf.drilldown from the jQuery fx callback', function(done) {
      build({scrollTop: true, animationDuration: 5});
      var scrollmeSpy = sinon.spy();
      FoundationNext.Events.on(html, 'scrollme.zf.drilldown', scrollmeSpy);

      // the flipped native self-consumer hears the real open event and
      // starts the jQuery fx scroll tween
      plugin._show(html.querySelector(':scope > li:nth-child(1)'));

      tryInterval({
        interval: 10,
        timeout: 3000,
        try: () => { sinon.assert.calledOnce(scrollmeSpy); },
        then: () => {
          scrollmeSpy.firstCall.args[0].type.should.equal('scrollme');
          scrollmeSpy.firstCall.args[0].namespace.should.equal('drilldown.zf');
          done();
        }
      });
    });
  });

  describe('destroy', function() {
    it('drops the flipped listeners on both layers', function() {
      build({closeOnClick: true});
      var anchor = html.querySelector(':scope > li:nth-child(1) > a');
      var el = html;
      plugin.destroy();
      plugin = null;

      anchor.click();
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.false;
      FoundationNext.Events.trigger(el, 'open.zf.drilldown');
      FoundationNext.Events.trigger(el, 'open.zf.drilldown');
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.false;

      // the body handler is gone from both transports: no error, no state
      document.body.click();
      FoundationNext.Events.trigger(document.body, 'click');
    });
  });
});
