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
  var html;

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
    if (html) { html.remove(); html = null; }
    document.activeElement.blur();
  });

  function build(options) {
    html = document.body.appendChild(fixture(template));
    plugin = new Foundation.AccordionMenu(html, Object.assign({slideSpeed: 0}, options));
    return plugin;
  }

  describe('state events', function() {
    it('fires down.zf.accordionMenu through the native event layer once the fx tween finished', function(done) {
      build({});
      var el = html;
      var sub = el.querySelector('#accNativeSub1');
      var downSpy = sinon.spy();
      FoundationNext.Events.on(el, 'down.zf.accordionMenu', downSpy);

      plugin.down(sub);

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { sinon.assert.calledOnce(downSpy); },
        then: () => {
          downSpy.firstCall.args[0].type.should.equal('down');
          downSpy.firstCall.args[0].namespace.should.equal('accordionMenu.zf');
          // the forwarded target collection rides as the event parameter
          downSpy.firstCall.args[1][0].should.equal(sub);
          done();
        }
      });
    });

    it('fires up.zf.accordionMenu after the fx tween; the ARIA state flips synchronously', function(done) {
      // a real tween duration makes the after-the-tween event timing visible
      build({slideSpeed: 200});
      var el = html;
      var sub = el.querySelector('#accNativeSub1');
      var upSpy = sinon.spy();
      FoundationNext.Events.on(el, 'up.zf.accordionMenu', upSpy);
      plugin.down(sub);

      plugin.up(sub);
      // fx seam: the class/ARIA state is already flipped, the event waits
      sub.classList.contains('is-active').should.be.false;
      sub.getAttribute('aria-hidden').should.equal('true');
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
      $(html).on('down.zf.accordionMenu', spy);

      plugin.down(html.querySelector('#accNativeSub1'));

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
      var sub = html.querySelector('#accNativeSub1');
      var parentLink = html.querySelector(':scope > li:nth-child(1)');

      plugin.down(sub);

      sub.classList.contains('is-active').should.be.true;
      sub.getAttribute('aria-hidden').should.equal('false');
      parentLink.getAttribute('aria-expanded').should.equal('true');
    });

    it('closes other submenus on down when multiOpen is false', function() {
      build({multiOpen: false});
      var sub1 = html.querySelector('#accNativeSub1');
      var sub2 = html.querySelector('#accNativeSub2');

      plugin.down(sub1);
      plugin.down(sub2);

      sub2.classList.contains('is-active').should.be.true;
      sub1.classList.contains('is-active').should.be.false;
      sub1.getAttribute('aria-hidden').should.equal('true');
    });
  });

  describe('click consumers', function() {
    it('toggles on a real click on the parent link and prevents the default', function() {
      build({});
      var parentA = html.querySelector(':scope > li:nth-child(1) > a');
      var sub = html.querySelector('#accNativeSub1');

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      parentA.dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      sub.classList.contains('is-active').should.be.true;

      parentA.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
      sub.classList.contains('is-active').should.be.false;
    });

    it('toggles from a jQuery-synthesized click on an inner element (the .click() native shortcut bridges the layers)', function() {
      build({});
      var span = html.querySelector(':scope > li:nth-child(2) > a > span');
      var sub = html.querySelector('#accNativeSub2');

      // jQuery-synthesized click stays the instrument on purpose: the pin
      // is the jQuery->native bridge (jQuery's .click() shortcut for
      // non-link elements), not the native dispatch.
      $(span).trigger('click');

      sub.classList.contains('is-active').should.be.true;
    });

    it('toggles through the submenu-toggle button when the option is on', function() {
      build({submenuToggle: true});
      var button = html.querySelector(':scope > li:nth-child(1) > .submenu-toggle');
      var sub = html.querySelector('#accNativeSub1');

      button.click();

      sub.classList.contains('is-active').should.be.true;
      button.getAttribute('aria-expanded').should.equal('true');

      // the button is a non-link element: the jQuery synthetic bridges
      // (jQuery trigger IS the instrument here, same as above)
      $(button).trigger('click');
      sub.classList.contains('is-active').should.be.false;
      button.getAttribute('aria-expanded').should.equal('false');
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('opens the submenu on ARROW_RIGHT from a real keydown and focuses its first link (white absorption)', function() {
      build({});
      var parentA = html.querySelector(':scope > li:nth-child(1) > a');
      parentA.focus();

      parentA.dispatchEvent(new KeyboardEvent('keydown', {which: 39, keyCode: 39, bubbles: true}));

      html.querySelector('#accNativeSub1').classList.contains('is-active').should.be.true;
      document.activeElement.should.equal(html.querySelector('#accNativeSub1 > li:nth-child(1) > a'));
    });

    it('opens the submenu on ARROW_RIGHT from the synthetic jQuery mock (the pinned keydown seam)', function() {
      build({});
      html.querySelector(':scope > li:nth-child(1) > a').focus();
      html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      html.querySelector('#accNativeSub1').classList.contains('is-active').should.be.true;
    });

    it('closes all submenus on ESC from a real keydown', function() {
      build({});
      plugin.down(html.querySelector('#accNativeSub1'));
      plugin.down(html.querySelector('#accNativeSub2'));
      var someLink = html.querySelector(':scope > li:nth-child(3) > a');
      someLink.focus();

      someLink.dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));

      html.querySelectorAll('ul[data-submenu].is-active').length.should.equal(0);
    });
  });

  describe('destroy', function() {
    it('drops the click and keydown consumers on both layers', function() {
      build({});
      var parentA = html.querySelector(':scope > li:nth-child(1) > a');
      var sub = html.querySelector('#accNativeSub1');
      plugin.destroy();
      plugin = null;

      parentA.click();
      sub.classList.contains('is-active').should.be.false;

      parentA.focus();

      parentA.dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));
      sub.classList.contains('is-active').should.be.false;

      // Nest.Burn ran
      html.querySelectorAll('[data-submenu]').length.should.equal(0);
    });
  });
});
