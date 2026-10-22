// S9 contract pins (7.0 line A): Dropdown's zf.trigger consumers, the anchor
// click consumer, the body close-on-outside-click handler and the show/hide
// state production moved to the native Registry/Events/DOM layer while the
// public contract stays byte-identical. Known seams: the whole positioning
// block stays on jQuery objects (Box util, tooltip precedent), hover stays on
// jQuery (the coarse suite drives a jQuery-synthesized mouseenter, which
// cannot reach a native listener), the keydown binding stays on jQuery (the
// coarse suite feeds jQuery-synthesized mock keydowns) and the closeme
// production stays on jQuery (the Triggers closeMeListener reads the plugin
// name from the jQuery event namespace). The body handler's tap half stays on
// jQuery (the Touch util synthesizes tap). These tests pin that contract from
// the outside; the pre-existing dropdown.js suite is untouched on purpose and
// stays green.
describe('Dropdown (native layer contract)', function() {
  var plugin;
  var $html;
  var $scratch = [];
  var counter = 0;

  afterEach(function() {
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    plugin = null;
    if ($html) { $html.remove(); $html = null; }
    $scratch.forEach(function($el) { $el.remove(); });
    $scratch = [];
    document.activeElement.blur();
  });

  function build(options, opts) {
    opts = opts || {};
    var id = opts.id || (`dropdownNative${++counter}`);
    var anchorMarkup = opts.href
      ? `<a href="${opts.href}" data-toggle="${id}">toggle</a>`
      : `<button type="button" data-toggle="${id}">toggle</button>`;
    var $anchor = $(anchorMarkup).appendTo('body');
    $scratch.push($anchor);
    $html = $(`<div data-dropdown id="${id}">Dropdown</div>`).appendTo('body');
    plugin = new Foundation.Dropdown($html, options);
    plugin.$anchorForTest = $anchor;
    return plugin;
  }

  describe('state events', function() {
    it('fires show.zf.dropdown through the native event layer with the pane in detail', function() {
      build({});
      var el = $html[0];
      var showSpy = sinon.spy();
      FoundationNext.Events.on(el, 'show.zf.dropdown', showSpy);

      plugin.open();

      sinon.assert.calledOnce(showSpy);
      showSpy.firstCall.args[0].type.should.equal('show');
      showSpy.firstCall.args[0].namespace.should.equal('dropdown.zf');
      // the forwarded pane collection rides as the event parameter (final
      // native-element form is the wrap-up slice's uniform move)
      showSpy.firstCall.args[1][0].should.equal(el);
      // the class/ARIA state flipped synchronously, before the event
      el.classList.contains('is-open').should.be.true;
      el.getAttribute('aria-hidden').should.equal('false');
    });

    it('fires hide.zf.dropdown on close and nothing when already closed', function() {
      build({});
      var el = $html[0];
      var hideSpy = sinon.spy();
      FoundationNext.Events.on(el, 'hide.zf.dropdown', hideSpy);

      plugin.close().should.be.false;
      sinon.assert.notCalled(hideSpy);

      plugin.open();
      plugin.close();

      sinon.assert.calledOnce(hideSpy);
      hideSpy.firstCall.args[0].type.should.equal('hide');
      hideSpy.firstCall.args[0].namespace.should.equal('dropdown.zf');
      el.classList.contains('is-open').should.be.false;
      el.getAttribute('aria-hidden').should.equal('true');
    });

    it('still reaches jQuery listeners with the real event (white absorption)', function() {
      build({});
      var spy = sinon.spy();
      $html.on('show.zf.dropdown', spy);

      plugin.open();

      sinon.assert.calledOnce(spy);
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });
  });

  describe('closeme chain', function() {
    beforeEach(function() {
      // The window closeme listener snapshots [data-yeti-box] when it is
      // installed (at load time); re-run the initializer so the chain is
      // armed here (reveal/tooltip-native precedent).
      Foundation.Triggers.Initializers.addClosemeListener();
    });

    it('keeps the closeme production on jQuery: the broadcast listener hears the namespaced synthetic event', function() {
      build({});
      var closemeSpy = sinon.spy();
      $(window).on('closeme.zf.dropdown', closemeSpy);
      $scratch.push({remove: () => $(window).off('closeme.zf.dropdown', closemeSpy)});

      plugin.open();

      sinon.assert.calledOnce(closemeSpy);
      // a real CustomEvent carries no jQuery namespace - only the kept
      // jQuery production delivers the plugin name to closeMeListener
      closemeSpy.firstCall.args[0].namespace.should.equal('dropdown.zf');
      closemeSpy.firstCall.args[1].should.equal($html.attr('id'));
    });

    it('closes another open dropdown through the real close.zf.trigger broadcast', function() {
      var pluginA = build({}, {id: 'dropdownNativeClosemeA'});
      var elA = $html[0];
      pluginA.open();

      $html = null;
      var pluginB = build({}, {id: 'dropdownNativeClosemeB'});
      var hideSpyA = sinon.spy();
      FoundationNext.Events.on(elA, 'hide.zf.dropdown', hideSpyA);

      pluginB.open();

      sinon.assert.calledOnce(hideSpyA);
      elA.classList.contains('is-open').should.be.false;
    });
  });

  describe('trigger delegation and anchor click', function() {
    it('opens through the document [data-toggle] delegation on a real anchor click', function() {
      build({});
      plugin.$anchorForTest[0].click();
      $html[0].classList.contains('is-open').should.be.true;
    });

    it('opens from a jQuery-synthesized anchor click (the .click() native shortcut bridges the layers)', function() {
      build({});
      plugin.$anchorForTest.trigger('click');
      $html[0].classList.contains('is-open').should.be.true;
    });

    it('prevents the default action on a real click when forceFollow is false', function() {
      build({forceFollow: false}, {href: '#dropdownNativeFollow'});
      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      plugin.$anchorForTest[0].dispatchEvent(click);
      click.defaultPrevented.should.be.true;
      $html[0].classList.contains('is-open').should.be.true;
    });

    it('repositions through the native resizeme.zf.trigger consumer', function() {
      build({});
      plugin.open();
      // _setPosition re-applies the position classes; dropping and seeing
      // them restored pins the consumer without spying on the bound method
      $html.removeClass('has-position-bottom has-alignment-left');

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      $html.should.have.class('has-position-bottom');
      $html.should.have.class('has-alignment-left');
    });
  });

  describe('keyboard (jQuery seam)', function() {
    it('closes on ESC from a real keydown on the anchor (white absorption)', function() {
      build({});
      plugin.open();

      plugin.$anchorForTest[0].dispatchEvent(new KeyboardEvent('keydown', {which: 27, keyCode: 27, bubbles: true}));

      $html[0].classList.contains('is-open').should.be.false;
      document.activeElement.should.equal(plugin.$anchorForTest[0]);
    });

    it('closes on ESC from the synthetic jQuery mock keydown (the pinned jQuery-side keydown seam)', function() {
      build({});
      plugin.open();

      plugin.$anchorForTest.focus().trigger(window.mockKeyboardEvent('ESCAPE'));

      $html[0].classList.contains('is-open').should.be.false;
    });
  });

  describe('hover (jQuery seam)', function() {
    it('opens from a jQuery-synthesized mouseenter and closes from a mouseleave (the hover seam stays jQuery-side)', function(done) {
      build({hover: true, hoverDelay: 0});
      var anchor = plugin.$anchorForTest[0];

      $(anchor).trigger('mouseenter');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { $html[0].classList.contains('is-open').should.be.true; },
        then: () => {
          $(anchor).trigger('mouseleave');
          tryInterval({
            interval: 10,
            timeout: 2000,
            try: () => { $html[0].classList.contains('is-open').should.be.false; },
            then: () => { done(); }
          });
        }
      });
    });
  });

  describe('body closeOnClick', function() {
    it('closes on a real click outside the dropdown', function() {
      build({closeOnClick: true});
      plugin.open();

      document.body.click();

      $html[0].classList.contains('is-open').should.be.false;
    });

    it('does not close on clicks inside the pane itself', function() {
      build({closeOnClick: true});
      plugin.open();

      $html[0].click();

      $html[0].classList.contains('is-open').should.be.true;
    });

    it('closes on a jQuery-synthesized tap (the Touch seam keeps the tap half on jQuery)', function() {
      build({closeOnClick: true});
      plugin.open();

      $(document.body).trigger('tap');

      $html[0].classList.contains('is-open').should.be.false;
    });

    it('reinstalls the body handler on the next open', function() {
      build({closeOnClick: true});
      plugin.open();
      document.body.click();
      $html[0].classList.contains('is-open').should.be.false;

      plugin.open();
      document.body.click();
      $html[0].classList.contains('is-open').should.be.false;
    });
  });

  describe('positioning (Box seam)', function() {
    it('keeps the jQuery-object positioning block untouched: the pane gets its position class', function() {
      build({});

      plugin.open();

      plugin.position.should.equal('bottom');
      $html.should.have.class('has-position-bottom');
      $html.should.have.class('has-alignment-left');
    });
  });

  describe('destroy', function() {
    it('drops the flipped listeners on both layers: real and synthesized clicks open nothing', function() {
      build({});
      plugin.destroy();
      plugin = null;

      $html[0].classList.contains('is-open').should.be.false;
      FoundationNext.Events.trigger($html[0], 'toggle.zf.trigger');
      $($html[0]).trigger('toggle.zf.trigger');
      $html[0].classList.contains('is-open').should.be.false;

      plugin = null;
      $html[0].click();
      $html[0].classList.contains('is-open').should.be.false;
    });

    it('removes the body click/tap handler on destroy', function() {
      build({closeOnClick: true});
      plugin.open();
      plugin.destroy();
      plugin = null;

      // no handler left on either transport: the click lands, nothing closes
      // (the pane is closed again by destroy already), and no error surfaces
      document.body.click();
      $(document.body).trigger('tap');
    });
  });
});
