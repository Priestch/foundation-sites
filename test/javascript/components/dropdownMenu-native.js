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
  var $html;

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
    if ($html) { $html.remove(); $html = null; }
    document.activeElement.blur();
  });

  function build(options) {
    $html = $(template).appendTo('body');
    plugin = new Foundation.DropdownMenu($html, options);
    return plugin;
  }

  describe('state events', function() {
    it('fires show/hide.zf.dropdownMenu through the native event layer with the submenu in detail', function() {
      build({});
      var el = $html[0];
      var $sub = $html.find('> li:nth-child(1) > ul');
      var showSpy = sinon.spy();
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.dropdownMenu', showSpy);
      FoundationNext.Events.on(el, 'hide.zf.dropdownMenu', hideSpy);

      plugin._show($sub);

      sinon.assert.calledOnce(showSpy);
      showSpy.firstCall.args[0].type.should.equal('show');
      showSpy.firstCall.args[0].namespace.should.equal('dropdownMenu.zf');
      showSpy.firstCall.args[1][0].should.equal($sub[0]);
      // the class state flipped synchronously, before the event
      $sub.should.have.class('js-dropdown-active');
      $sub[0].parentElement.classList.contains('is-active').should.be.true;

      plugin._hide();

      sinon.assert.calledOnce(hideSpy);
      hideSpy.firstCall.args[0].type.should.equal('hide');
      hideSpy.firstCall.args[0].namespace.should.equal('dropdownMenu.zf');
      $html.find('ul.js-dropdown-active').length.should.equal(0);
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function() {
      build({});
      var spy = sinon.spy();
      $html.on('show.zf.dropdownMenu', spy);

      plugin._show($html.find('> li:nth-child(1) > ul'));

      sinon.assert.calledOnce(spy);
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('click consumers', function() {
    it('opens on a real click on a submenu parent and marks the click state natively', function() {
      build({clickOpen: true});
      var $parentA = $html.find('> li:nth-child(1) > a');

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      $parentA[0].dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      $html.find('> li:nth-child(1)').should.have.class('is-active');
      $html.find('> li:nth-child(1) > ul').should.have.class('js-dropdown-active');
      $html.find('> li:nth-child(1)')[0].getAttribute('data-is-click').should.equal('true');
    });

    it('opens from a jQuery-synthesized click on an inner element (the .click() native shortcut bridges the layers)', function() {
      build({clickOpen: true});

      // the shortcut bridges for non-link elements: jQuery calls
      // span.click(), the real click bubbles to the li carrying the
      // consumer
      $html.find('> li:nth-child(1) > a > span').trigger('click');

      $html.find('> li:nth-child(1)').should.have.class('is-active');
      $html.find('> li:nth-child(1) > ul').should.have.class('js-dropdown-active');
    });

    it('does not deliver a jQuery-synthesized click on a link anchor (jQuery suppresses the native .click() on links - known mixed-state boundary)', function() {
      build({clickOpen: true});

      $html.find('> li:nth-child(1) > a').trigger('click');

      $html.find('> li:nth-child(1)').should.not.have.class('is-active');
    });

    it('closes open submenus on a real leaf click (closeOnClickInside)', function() {
      build({clickOpen: true});
      // open through a real parent click so the data-is-click state is set
      $html.find('> li:nth-child(1) > a')[0].click();

      $html.find('> li:nth-child(1) > ul > li:nth-child(1) > a')[0].click();

      $html.find('ul.js-dropdown-active').length.should.equal(0);
      $html.find('> li:nth-child(1)').should.not.have.class('is-active');
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('opens the submenu on ARROW_DOWN from a real keydown and focuses its first link (white absorption)', function() {
      build({});
      var $tabA = $html.find('> li:nth-child(1) > a');
      $tabA[0].focus();

      var keydown = new KeyboardEvent('keydown', {which: 40, keyCode: 40, bubbles: true, cancelable: true});
      $tabA[0].dispatchEvent(keydown);

      keydown.defaultPrevented.should.be.true;
      $html.find('> li:nth-child(1)').should.have.class('is-active');
      document.activeElement.should.equal($html.find('> li:nth-child(1) > ul > li:nth-child(1) > a')[0]);
    });

    it('closes on ESC from a real keydown, refocusing the first menu item', function() {
      build({});
      var $sub = $html.find('> li:nth-child(1) > ul');
      plugin._show($sub);
      var $firstSubA = $sub.find('> li:nth-child(1) > a');
      $firstSubA[0].focus();

      var keydown = new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true, cancelable: true});
      $firstSubA[0].dispatchEvent(keydown);

      keydown.defaultPrevented.should.be.true;
      $sub.should.not.have.class('js-dropdown-active');
      document.activeElement.should.equal($html.find('> li:nth-child(1) > a')[0]);
    });

    it('closes on ESC from the synthetic jQuery mock keydown (the pinned jQuery-side keydown seam)', function() {
      build({});
      var $sub = $html.find('> li:nth-child(1) > ul');
      plugin._show($sub);
      var $firstSubA = $sub.find('> li:nth-child(1) > a');

      $firstSubA.focus().trigger(window.mockKeyboardEvent('ESCAPE'));

      $sub.should.not.have.class('js-dropdown-active');
    });
  });

  describe('hover (jQuery seam)', function() {
    it('opens from a jQuery-synthesized mouseenter (the hover seam stays jQuery-side)', function(done) {
      build({hoverDelay: 0});
      var $li = $html.find('> li:nth-child(1)');

      $li.trigger('mouseenter');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          $li.should.have.class('is-active');
          $li.children('ul').should.have.class('js-dropdown-active');
        },
        then: () => { done(); }
      });
    });
  });

  describe('body closeOnClick', function() {
    it('closes on a real click outside the menu', function() {
      build({clickOpen: true});
      $html.find('> li:nth-child(1) > a')[0].click();
      $html.find('> li:nth-child(1)').should.have.class('is-active');

      document.body.click();

      $html.find('> li:nth-child(1)').should.not.have.class('is-active');
    });

    it('does not close on clicks inside the menu (the body handler ignores them)', function() {
      build({clickOpen: true, closeOnClickInside: false});
      $html.find('> li:nth-child(1) > a')[0].click();
      $html.find('> li:nth-child(1)').should.have.class('is-active');

      // a click on another tab is inside the menu element: the body handler
      // must ignore it and nothing else may hide the open submenu
      $html.find('> li:nth-child(2) > a')[0].click();

      $html.find('> li:nth-child(1)').should.have.class('is-active');
    });

    it('closes on a real synthesized tap (the Touch tap flips to the native layer in S13)', function() {
      build({clickOpen: true});
      $html.find('> li:nth-child(1) > a')[0].click();
      $html.find('> li:nth-child(1)').should.have.class('is-active');

      FoundationNext.Events.trigger(document.body, 'tap');

      $html.find('> li:nth-child(1)').should.not.have.class('is-active');
    });
  });

  describe('positioning (Box seam)', function() {
    it('keeps the jQuery-object positioning block untouched: no collision, no class churn', function() {
      build({});
      plugin._show($html.find('> li:nth-child(1) > ul'));

      // the submenu opens without collision (0-height in the test document),
      // so Box.ImNotTouchingYou cleared and the alignment class is untouched
      plugin.changed.should.be.false;
      $html.find('> li:nth-child(1)').should.have.class('opens-right');
    });
  });

  describe('destroy', function() {
    it('drops the flipped listeners on both layers and burns the nest markup', function() {
      build({clickOpen: true});
      var $parentA = $html.find('> li:nth-child(1) > a');
      var $parentLi = $html.find('> li:nth-child(1)');
      plugin.destroy();
      plugin = null;

      $parentA[0].click();
      $parentLi.should.not.have.class('is-active');
      FoundationNext.Events.trigger($parentLi[0], 'click.zf.dropdownMenu');
      $($parentLi[0]).trigger('click');
      $parentLi.should.not.have.class('is-active');

      // Nest.Burn ran: the feather data/role classes are gone
      $html.find('[data-submenu]').length.should.equal(0);
      $html.find('.is-dropdown-submenu-parent').length.should.equal(0);
    });
  });
});
