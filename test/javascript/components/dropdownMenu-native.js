// S9 contract pins (7.0 line A): DropdownMenu's click/touchstart consumers,
// the body close-on-outside-click handler and the show/hide state production
// moved to the native Registry/Events/DOM layer while the public contract
// stays byte-identical. Known seams: the whole positioning block stays on
// jQuery objects (Box util, tooltip precedent), the hover-intent listeners
// stay on jQuery (delay timers ride jQuery data, hover synthesizes only
// through jQuery) and the keydown binding stays on jQuery (the coarse suite
// feeds jQuery-synthesized mock keydowns). The tap half of the body handler
// joined the native layer with the Touch util's real synthesized tap (S13).
// The selector-filtered collection class writes keep their jQuery form.
// These tests pin that contract from the outside; the pre-existing
// dropdownMenu.js suite is untouched on purpose and stays green.
describe('DropdownMenu (native layer contract)', function() {
  var plugin;
  var html;

  var template = `<ul class="dropdown menu" data-dropdown-menu>
    <li>
      <a href="#Item-1"><span>Item 1</span></a>
      <ul class="menu">
        <li><a href="#Item-1A">Item 1A</a></li>
        <li><a href="#Item-1B">Item 1B</a></li>
      </ul>
    </li>
    <li><a href="#Item-2">Item 2</a></li>
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
    plugin = new Foundation.DropdownMenu(html, options);
    return plugin;
  }

  describe('state events', function() {
    it('fires show/hide.zf.dropdownMenu through the native event layer with the submenu in detail', function() {
      build({});
      var el = html;
      var sub = html.querySelector(':scope > li:nth-child(1) > ul');
      var showSpy = sinon.spy();
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.dropdownMenu', showSpy);
      FoundationNext.Events.on(el, 'hide.zf.dropdownMenu', hideSpy);

      plugin._show(sub);

      sinon.assert.calledOnce(showSpy);
      showSpy.firstCall.args[0].type.should.equal('show');
      showSpy.firstCall.args[0].namespace.should.equal('dropdownMenu.zf');
      showSpy.firstCall.args[1][0].should.equal(sub);
      // the class state flipped synchronously, before the event
      sub.classList.contains('js-dropdown-active').should.be.true;
      sub.parentElement.classList.contains('is-active').should.be.true;

      plugin._hide();

      sinon.assert.calledOnce(hideSpy);
      hideSpy.firstCall.args[0].type.should.equal('hide');
      hideSpy.firstCall.args[0].namespace.should.equal('dropdownMenu.zf');
      html.querySelectorAll('ul.js-dropdown-active').length.should.equal(0);
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function() {
      build({});
      var spy = sinon.spy();
      $(html).on('show.zf.dropdownMenu', spy);

      plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

      sinon.assert.calledOnce(spy);
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('click consumers', function() {
    it('opens on a real click on a submenu parent and marks the click state natively', function() {
      build({clickOpen: true});
      var parentA = html.querySelector(':scope > li:nth-child(1) > a');

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      parentA.dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('js-dropdown-active').should.be.true;
      html.querySelector(':scope > li:nth-child(1)').getAttribute('data-is-click').should.equal('true');
    });

    it('opens from a jQuery-synthesized click on an inner element (the .click() native shortcut bridges the layers)', function() {
      build({clickOpen: true});

      // the shortcut bridges for non-link elements: jQuery calls
      // span.click(), the real click bubbles to the li carrying the
      // consumer
      FoundationNext.Events.trigger(html.querySelector(':scope > li:nth-child(1) > a > span'), 'click');

      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('js-dropdown-active').should.be.true;
    });

    it('does not deliver a jQuery-synthesized click on a link anchor (jQuery suppresses the native .click() on links - known mixed-state boundary)', function() {
      build({clickOpen: true});

      // jQuery-synthesized click stays the instrument: the pin is the
      // mixed-state boundary (jQuery suppresses .click() on links, so the
      // flipped native consumer hears nothing)
      $(html.querySelector(':scope > li:nth-child(1) > a')).trigger('click');

      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.false;
    });

    it('closes open submenus on a real leaf click (closeOnClickInside)', function() {
      build({clickOpen: true});
      // open through a real parent click so the data-is-click state is set
      html.querySelector(':scope > li:nth-child(1) > a').click();

      html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a').click();

      html.querySelectorAll('ul.js-dropdown-active').length.should.equal(0);
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.false;
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('opens the submenu on ARROW_DOWN from a real keydown and focuses its first link (white absorption)', function() {
      build({});
      var tabA = html.querySelector(':scope > li:nth-child(1) > a');
      tabA.focus();

      var keydown = new KeyboardEvent('keydown', {which: 40, keyCode: 40, bubbles: true, cancelable: true});
      tabA.dispatchEvent(keydown);

      keydown.defaultPrevented.should.be.true;
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
      document.activeElement.should.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a'));
    });

    it('closes on ESC from a real keydown, refocusing the first menu item', function() {
      build({});
      var sub = html.querySelector(':scope > li:nth-child(1) > ul');
      plugin._show(sub);
      var firstSubA = sub.querySelector(':scope > li:nth-child(1) > a');
      firstSubA.focus();

      var keydown = new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true, cancelable: true});
      firstSubA.dispatchEvent(keydown);

      keydown.defaultPrevented.should.be.true;
      sub.classList.contains('js-dropdown-active').should.be.false;
      document.activeElement.should.equal(html.querySelector(':scope > li:nth-child(1) > a'));
    });

    it('closes on ESC from the synthetic jQuery mock keydown (the pinned jQuery-side keydown seam)', function() {
      build({});
      var sub = html.querySelector(':scope > li:nth-child(1) > ul');
      plugin._show(sub);
      var firstSubA = sub.querySelector(':scope > li:nth-child(1) > a');

      firstSubA.focus();

      firstSubA.dispatchEvent(window.mockKeyboardEvent('ESCAPE'));

      sub.classList.contains('js-dropdown-active').should.be.false;
    });
  });

  describe('hover (jQuery seam)', function() {
    it('opens from a jQuery-synthesized mouseenter (the hover seam stays jQuery-side)', function(done) {
      build({hoverDelay: 0});
      var li = html.querySelector(':scope > li:nth-child(1)');

      FoundationNext.Events.trigger(li, 'mouseover');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          li.classList.contains('is-active').should.be.true;
          li.querySelector(':scope > ul').classList.contains('js-dropdown-active').should.be.true;
        },
        then: () => { done(); }
      });
    });
  });

  describe('body closeOnClick', function() {
    it('closes on a real click outside the menu', function() {
      build({clickOpen: true});
      html.querySelector(':scope > li:nth-child(1) > a').click();
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;

      document.body.click();

      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.false;
    });

    it('does not close on clicks inside the menu (the body handler ignores them)', function() {
      build({clickOpen: true, closeOnClickInside: false});
      html.querySelector(':scope > li:nth-child(1) > a').click();
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;

      // a click on another tab is inside the menu element: the body handler
      // must ignore it and nothing else may hide the open submenu
      html.querySelector(':scope > li:nth-child(2) > a').click();

      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
    });

    it('closes on a real synthesized tap (the Touch tap flips to the native layer in S13)', function() {
      build({clickOpen: true});
      html.querySelector(':scope > li:nth-child(1) > a').click();
      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;

      FoundationNext.Events.trigger(document.body, 'tap');

      html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.false;
    });
  });

  describe('positioning (Box seam)', function() {
    it('keeps the jQuery-object positioning block untouched: no collision, no class churn', function() {
      build({});
      plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

      // the submenu opens without collision (0-height in the test document),
      // so Box.ImNotTouchingYou cleared and the alignment class is untouched
      plugin.changed.should.be.false;
      html.querySelector(':scope > li:nth-child(1)').classList.contains('opens-right').should.be.true;
    });
  });

  describe('destroy', function() {
    it('drops the flipped listeners on both layers and burns the nest markup', function() {
      build({clickOpen: true});
      var parentA = html.querySelector(':scope > li:nth-child(1) > a');
      var parentLi = html.querySelector(':scope > li:nth-child(1)');
      plugin.destroy();
      plugin = null;

      parentA.click();
      parentLi.classList.contains('is-active').should.be.false;
      FoundationNext.Events.trigger(parentLi, 'click.zf.dropdownMenu');
      FoundationNext.Events.trigger(parentLi, 'click');
      parentLi.classList.contains('is-active').should.be.false;

      // Nest.Burn ran: the feather data/role classes are gone
      html.querySelectorAll('[data-submenu]').length.should.equal(0);
      html.querySelectorAll('.is-dropdown-submenu-parent').length.should.equal(0);
    });
  });
});
