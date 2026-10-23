// S9 contract pins (7.0 line A): AccordionMenu's submenu click consumers,
// the class/ARIA state writes and the down/up state production moved to the
// native Registry/Events/DOM layer while the public contract stays
// byte-identical. Known seams: the keydown binding stays on jQuery (the
// coarse suite feeds jQuery-synthesized mock keydowns), the slide tweens
// stay on jQuery fx (the down/up events keep their after-the-tween timing,
// Accordion precedent) and the Nest feather/burn stays on jQuery objects.
// These tests pin that contract from the outside; the pre-existing
// accordionMenu.js suite is untouched on purpose and stays green.
describe('AccordionMenu (native layer contract)', function() {
  var plugin;
  var $html;

  var template = `<ul class="vertical menu" data-accordion-menu>
    <li>
      <a href="#">Item 1</a>
      <ul class="menu vertical nested" id="accNativeSub1">
        <li><a href="#">Item 1A</a></li>
        <li><a href="#">Item 1B</a></li>
      </ul>
    </li>
    <li>
      <a href="#"><span>Item 2</span></a>
      <ul class="menu vertical nested" id="accNativeSub2">
        <li><a href="#">Item 2A</a></li>
      </ul>
    </li>
    <li><a href="#">Item 3</a></li>
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
    plugin = new Foundation.AccordionMenu($html, Object.assign({slideSpeed: 0}, options));
    return plugin;
  }

  describe('state events', function() {
    it('fires down.zf.accordionMenu through the native event layer once the fx tween finished', function(done) {
      build({});
      var el = $html[0];
      var $sub = $(el.querySelector('#accNativeSub1'));
      var downSpy = sinon.spy();
      FoundationNext.Events.on(el, 'down.zf.accordionMenu', downSpy);

      plugin.down($sub);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(downSpy); },
        then: () => {
          downSpy.firstCall.args[0].type.should.equal('down');
          downSpy.firstCall.args[0].namespace.should.equal('accordionMenu.zf');
          // the forwarded $target collection rides as the event parameter
          downSpy.firstCall.args[1][0].should.equal($sub[0]);
          done();
        }
      });
    });

    it('fires up.zf.accordionMenu after the fx tween; the ARIA state flips synchronously', function(done) {
      // a real tween duration makes the after-the-tween event timing visible
      build({slideSpeed: 200});
      var el = $html[0];
      var $sub = $(el.querySelector('#accNativeSub1'));
      var upSpy = sinon.spy();
      FoundationNext.Events.on(el, 'up.zf.accordionMenu', upSpy);
      plugin.down($sub);

      plugin.up($sub);
      // fx seam: the class/ARIA state is already flipped, the event waits
      $sub[0].classList.contains('is-active').should.be.false;
      $sub[0].getAttribute('aria-hidden').should.equal('true');
      sinon.assert.notCalled(upSpy);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(upSpy); },
        then: () => {
          upSpy.firstCall.args[0].type.should.equal('up');
          upSpy.firstCall.args[0].namespace.should.equal('accordionMenu.zf');
          done();
        }
      });
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function(done) {
      build({});
      var spy = sinon.spy();
      $html.on('down.zf.accordionMenu', spy);

      plugin.down($($html[0].querySelector('#accNativeSub1')));

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
    it('flips is-active, aria-hidden and the parent aria-expanded natively on down', function() {
      build({});
      var $sub = $($html[0].querySelector('#accNativeSub1'));
      var $parentLink = $html.find('> li:nth-child(1)');

      plugin.down($sub);

      $sub.should.have.class('is-active');
      $sub[0].getAttribute('aria-hidden').should.equal('false');
      $parentLink[0].getAttribute('aria-expanded').should.equal('true');
    });

    it('closes other submenus on down when multiOpen is false', function() {
      build({multiOpen: false});
      var $sub1 = $($html[0].querySelector('#accNativeSub1'));
      var $sub2 = $($html[0].querySelector('#accNativeSub2'));

      plugin.down($sub1);
      plugin.down($sub2);

      $sub2.should.have.class('is-active');
      $sub1.should.not.have.class('is-active');
      $sub1[0].getAttribute('aria-hidden').should.equal('true');
    });
  });

  describe('click consumers', function() {
    it('toggles on a real click on the parent link and prevents the default', function() {
      build({});
      var $parentA = $html.find('> li:nth-child(1) > a');
      var $sub = $($html[0].querySelector('#accNativeSub1'));

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      $parentA[0].dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      $sub.should.have.class('is-active');

      $parentA[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
      $sub.should.not.have.class('is-active');
    });

    it('toggles from a jQuery-synthesized click on an inner element (the .click() native shortcut bridges the layers)', function() {
      build({});
      var $span = $html.find('> li:nth-child(2) > a > span');
      var $sub = $($html[0].querySelector('#accNativeSub2'));

      $span.trigger('click');

      $sub.should.have.class('is-active');
    });

    it('toggles through the submenu-toggle button when the option is on', function() {
      build({submenuToggle: true});
      var $button = $html.find('> li:nth-child(1) > .submenu-toggle');
      var $sub = $($html[0].querySelector('#accNativeSub1'));

      $button[0].click();

      $sub.should.have.class('is-active');
      $button[0].getAttribute('aria-expanded').should.equal('true');

      // the button is a non-link element: the jQuery synthetic bridges
      $button.trigger('click');
      $sub.should.not.have.class('is-active');
      $button[0].getAttribute('aria-expanded').should.equal('false');
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('opens the submenu on ARROW_RIGHT from a real keydown and focuses its first link (white absorption)', function() {
      build({});
      var $parentA = $html.find('> li:nth-child(1) > a');
      $parentA[0].focus();

      $parentA[0].dispatchEvent(new KeyboardEvent('keydown', {which: 39, keyCode: 39, bubbles: true}));

      $($html[0].querySelector('#accNativeSub1')).should.have.class('is-active');
      document.activeElement.should.equal($html.find('#accNativeSub1 > li:nth-child(1) > a')[0]);
    });

    it('opens the submenu on ARROW_RIGHT from the synthetic jQuery mock (the pinned keydown seam)', function() {
      build({});
      $html.find('> li:nth-child(1) > a').focus()
        .trigger(window.mockKeyboardEvent('ARROW_RIGHT'));

      $($html[0].querySelector('#accNativeSub1')).should.have.class('is-active');
    });

    it('closes all submenus on ESC from a real keydown', function() {
      build({});
      plugin.down($($html[0].querySelector('#accNativeSub1')));
      plugin.down($($html[0].querySelector('#accNativeSub2')));
      var $someLink = $html.find('> li:nth-child(3) > a');
      $someLink[0].focus();

      $someLink[0].dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));

      $html.find('ul[data-submenu].is-active').length.should.equal(0);
    });
  });

  describe('destroy', function() {
    it('drops the click and keydown consumers on both layers', function() {
      build({});
      var $parentA = $html.find('> li:nth-child(1) > a');
      var $sub = $($html[0].querySelector('#accNativeSub1'));
      plugin.destroy();
      plugin = null;

      $parentA[0].click();
      $sub.should.not.have.class('is-active');

      $parentA.focus().trigger(window.mockKeyboardEvent('ARROW_RIGHT'));
      $sub.should.not.have.class('is-active');

      // Nest.Burn ran
      $html.find('[data-submenu]').length.should.equal(0);
    });
  });
});
