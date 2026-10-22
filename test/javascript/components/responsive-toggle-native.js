// S7 contract pins (7.0 line A): ResponsiveToggle's internals moved to the
// native Registry/Events/DOM layer while the public contract stays
// byte-identical. The known seam: the 'changed.zf.mediaquery' consumer
// stays on the jQuery side (MediaQuery still synthesizes it there), pinned
// as such below. These tests pin the contract from the outside; the
// pre-existing responsiveToggle.js suite is untouched on purpose.
describe('ResponsiveToggle (native layer contract)', function() {
  var plugin;
  var $html;

  // The main test page loads its stylesheets AFTER the foundation bundle,
  // so the bundle's eager MediaQuery._init() parsed the UA default font
  // family and the breakpoint list is garbage on this page (pre-existing:
  // nothing before this suite ever asserted MediaQuery here). Re-parse now
  // that the CSS is applied - what the iframe-based mediaQuery suite does.
  beforeEach(function() {
    Foundation.MediaQuery._reInit();
  });

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) {
      $html.remove();
      $html = null;
    }
  });

  function build(markup) {
    $html = $(markup || `<div id="rt-bar" data-responsive-toggle="rt-menu">
        <button data-toggle="rt-menu" type="button">menu</button>
      </div>
      <ul id="rt-menu"><li><a href="#">item</a></li><li data-mutate>mutable</li></ul>`).appendTo('body');
    return $html;
  }

  // The headless viewport sits between 'small' and 'xxlarge', so these two
  // hideFor values pin both branches of _update() without resizing anything.
  function mobileOptions() {
    return {hideFor: 'xxlarge'};
  }
  function desktopOptions() {
    return {hideFor: 'small'};
  }

  describe('mediaquery update', function() {
    it('follows changed.zf.mediaquery synthesized through jQuery (the MediaQuery seam stays jQuery-side)', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), mobileOptions());
      var bar = document.getElementById('rt-bar');
      var menu = document.getElementById('rt-menu');

      // mobile branch: bar shown, menu hidden
      bar.style.display.should.equal('');
      menu.style.display.should.equal('none');

      // the consumer listens on the jQuery side: a jQuery-synthesized
      // changed.zf.mediaquery must re-run the update
      bar.style.display = 'none';
      $(window).trigger('changed.zf.mediaquery');
      bar.style.display.should.equal('');
    });

    it('hides the bar and shows the menu at or above the hideFor breakpoint', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), desktopOptions());
      var bar = document.getElementById('rt-bar');
      var menu = document.getElementById('rt-menu');

      bar.style.display.should.equal('none');
      menu.style.display.should.equal('');
    });
  });

  describe('toggleMenu()', function() {
    it('toggles through a real click on the toggler and fires toggled.zf.responsiveToggle on the native layer', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), mobileOptions());
      var bar = document.getElementById('rt-bar');
      var menu = document.getElementById('rt-menu');
      var mutateEl = menu.querySelector('[data-mutate]');

      var toggledSpy = sinon.spy();
      FoundationNext.Events.on(bar, 'toggled.zf.responsiveToggle', toggledSpy);
      var mutateSpy = sinon.spy();
      FoundationNext.Events.on(mutateEl, 'mutateme.zf.trigger', mutateSpy);

      // hidden menu -> shown, synchronously
      bar.querySelector('[data-toggle]').click();
      menu.style.display.should.equal('');
      sinon.assert.calledOnce(toggledSpy);
      toggledSpy.firstCall.args[0].type.should.equal('toggled');
      toggledSpy.firstCall.args[0].namespace.should.equal('responsiveToggle.zf');
      sinon.assert.calledOnce(mutateSpy);

      // shown menu -> hidden again
      bar.querySelector('[data-toggle]').click();
      menu.style.display.should.equal('none');
      sinon.assert.calledTwice(toggledSpy);
    });

    it('still reaches jQuery listeners through the real toggled event (white absorption)', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), mobileOptions());
      var menu = document.getElementById('rt-menu');

      var spy = sinon.spy();
      $('#rt-bar').on('toggled.zf.responsiveToggle', spy);

      plugin.toggleMenu();

      sinon.assert.calledOnce(spy);
      // real events carry no jQuery namespace (jQuery leaves it undefined)
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
      menu.style.display.should.not.equal('none');
    });

    it('runs the animated branch and keeps the seam halves split: toggled native, mutateme jQuery', function(done) {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), Object.assign(mobileOptions(), {animate: 'fade-in fade-out'}));
      var menu = document.getElementById('rt-menu');
      var mutateEl = menu.querySelector('[data-mutate]');

      var toggledSpy = sinon.spy();
      FoundationNext.Events.on(document.getElementById('rt-bar'), 'toggled.zf.responsiveToggle', toggledSpy);
      var jqMutateSpy = sinon.spy();
      $(mutateEl).on('mutateme.zf.trigger', jqMutateSpy);

      // hidden menu -> the animateIn branch runs the motion-ui class
      // lifecycle; the end event is dispatched manually, exactly what the
      // 6.x implementation depended on in this runner (S5 pattern)
      plugin.toggleMenu();

      setTimeout(function() {
        menu.dispatchEvent(new Event('transitionend', {bubbles: true}));

        sinon.assert.calledOnce(toggledSpy);
        sinon.assert.calledOnce(jqMutateSpy);
        // the motion lifecycle reset ran: no animation classes left behind
        menu.classList.contains('mui-enter-active').should.be.false;
        menu.classList.contains('mui-enter').should.be.false;
        done();
      }, 60);
    });

    it('does nothing at or above the hideFor breakpoint', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), desktopOptions());
      var bar = document.getElementById('rt-bar');
      var menu = document.getElementById('rt-menu');

      var toggledSpy = sinon.spy();
      FoundationNext.Events.on(bar, 'toggled.zf.responsiveToggle', toggledSpy);

      plugin.toggleMenu();

      sinon.assert.notCalled(toggledSpy);
      bar.style.display.should.equal('none');
      menu.style.display.should.equal('');
    });
  });

  describe('destroy', function() {
    it('drops the mediaquery seam listener and the native click listeners', function() {
      build();
      plugin = new Foundation.ResponsiveToggle($('#rt-bar'), mobileOptions());
      var bar = document.getElementById('rt-bar');
      var menu = document.getElementById('rt-menu');
      plugin.destroy();
      plugin = null;

      // jQuery seam half is gone: the synthetic broadcast no longer updates
      bar.style.display = 'none';
      $(window).trigger('changed.zf.mediaquery');
      bar.style.display.should.equal('none');

      // native click half is gone: the toggle would show the hidden menu
      bar.querySelector('[data-toggle]').click();
      menu.style.display.should.equal('none');
    });
  });
});
