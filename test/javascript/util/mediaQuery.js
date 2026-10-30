describe('MediaQuery utils', function () {

  var iframe, _window, _document, plugin;

  /*
  * Media Query styles for the following configuration:
  *
  * breakpoints: (
  *   small: 0,
  *   medium: 640px,
  *   large: 1024px,
  *   xlarge: 1200px,
  *   xxlarge: 1440px,
  * );
  *
  */
  const mediaQueryCSS = `
    .foundation-mq { font-family: "small=0em&medium=40em&large=64em&xlarge=75em&xxlarge=90em"; }
  `;

  beforeEach(function (done) {
    // Versionize scripts to prevent browser caching
    const randomHash = (Math.random() * Math.pow(2, 54)).toString(36);

    // Create an Iframe so we can resize it to test mediaQueries
    const iframeEl = document.createElement("iframe");
    document.body.appendChild(iframeEl);
    iframe = iframeEl;
    iframeEl.setAttribute("frameBorder", 0);
    _window = iframeEl.contentWindow;
    _document = iframeEl.contentDocument;

    // Inject MediaQuery CSS config
    const mqStyle = _document.createElement("style");
    mqStyle.setAttribute("type", "text/css");
    mqStyle.textContent = mediaQueryCSS;
    _document.querySelector("head").append(mqStyle);

    // Inject jQuery and Foundation
    injectScriptIn(_document.body, {
      src: `../../node_modules/jquery/dist/jquery.js?v=${randomHash}`,
    });
    injectScriptIn(_document.body, {
      src: `../../_build/assets/js/foundation.js?v=${randomHash}`,
      onload: () => {
        plugin = _window.Foundation.MediaQuery;
        plugin._init();
        done();
      },
    });

  });

  afterEach(function() {
    iframe.remove();
  });

  describe('atLeast()', function () {

    it('returns "false" when smaller than the given breakpoint', function () {
      iframe.setAttribute('width', 639); // just before the "medium" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.atLeast('small').should.be.true;
      plugin.atLeast('medium').should.be.false;
      plugin.atLeast('large').should.be.false;
    });

    it('returns "true" when being precisely on the given breakpoint', function () {
      iframe.setAttribute('width', 1024); // just on the "large" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.atLeast('medium').should.be.true;
      plugin.atLeast('large').should.be.true;
      plugin.atLeast('xlarge').should.be.false;
    });

    it('returns "true" when larger than the given breakpoint', function () {
      iframe.setAttribute('width', 1201); // just after the "xlarge" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.atLeast('large').should.be.true;
      plugin.atLeast('xlarge').should.be.true;
      plugin.atLeast('xxlarge').should.be.false;
    });

  });

  describe('only()', function () {

    it('returns "false" when smaller than the given breakpoint', function () {
      iframe.setAttribute('width', 639); // just before the "medium" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.only('small').should.be.true;
      plugin.only('medium').should.be.false;
      plugin.only('large').should.be.false;
    });

    it('returns "true" when within the given breakpoint', function () {
      iframe.setAttribute('width', 832); // within the "medium" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.only('small').should.be.false;
      plugin.only('medium').should.be.true;
      plugin.only('large').should.be.false;
    });

    it('returns "false" when larger than the given breakpoint', function () {
      iframe.setAttribute('width', 1024); // just after the "medium" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.only('small').should.be.false;
      plugin.only('medium').should.be.false;
      plugin.only('large').should.be.true;
    });

  });

  describe('upTo()', function () {

    it('returns "true" when smaller than the next breakpoint', function () {
      iframe.setAttribute('width', 1023); // just before the "large" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.upTo('small').should.be.false;
      plugin.upTo('medium').should.be.true;
      plugin.upTo('large').should.be.true;
    });

    it('returns "false" when being precisely on the next breakpoint', function () {
      iframe.setAttribute('width', 1200); // just on the "xlarge" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.upTo('medium').should.be.false;
      plugin.upTo('large').should.be.false;
      plugin.upTo('xlarge').should.be.true;
    });

    it('returns "false" when larger than the next breakpoint', function () {
      iframe.setAttribute('width', 1441); // just after the "xxlarge" breakpoint
      (_window.innerWidth); // force the browser to handle the new width synchronously

      plugin.upTo('large').should.be.false;
      plugin.upTo('xlarge').should.be.false;
      plugin.upTo('xxlarge').should.be.true;
    });

  });

  // S13 pins (7.0 line A): the meta probe runs on getComputedStyle and the
  // breakpoint watcher runs on the native event layer - real resize events
  // drive it and 'changed.zf.mediaquery' leaves it as a real, bubbling
  // window event. This suite runs inside the iframe, where the iframe's own
  // foundation.js bundle (and its own Events layer) executes.
  describe('native probe and watcher (S13)', function () {

    it('re-creates a missing meta.foundation-mq probe on re-init', function () {
      var meta = _document.querySelector('meta.foundation-mq');
      (meta !== null).should.be.true;
      meta.remove();

      plugin._reInit();

      var recreated = _document.querySelector('meta.foundation-mq');
      (recreated !== null).should.be.true;
      recreated.classList.contains('foundation-mq').should.be.true;
      recreated.getAttribute('name').should.equal('foundation-mq');
      // the probe re-parsed the injected stylesheet's font-family contract
      plugin.get('medium').should.equal('only screen and (min-width: 40em)');
    });

    it('broadcasts changed.zf.mediaquery as a real window event on a real resize', function (done) {
      // settle below 'medium' first, then cross it upward. The width change
      // moves matchMedia (the innerWidth read forces the layout); the real
      // resize event on the iframe window is what drives the watcher.
      iframe.setAttribute('width', 639);
      (_window.innerWidth);
      _window.dispatchEvent(new Event('resize'));
      tryInterval({
        interval: 20,
        timeout: 2000,
        try: () => {
          plugin.current.should.equal('small');
        },
        then: () => {
          var nativeEvents = [];
          var realListener = function (event) { nativeEvents.push(event); };
          // the broadcast is a real CustomEvent of the BASE type 'changed'
          // with the zf.mediaquery namespace grafted (exactly how jQuery
          // split 'changed.zf.mediaquery' for its own listeners); the
          // raw listener here pins the native shape.
          _window.addEventListener('changed', realListener);

          var jqEvents = [];
          // a plain jQuery window listener inside the iframe keeps hearing
          // the real event (white absorption), parameters via the detail.
          // jQuery stays as the test instrument here on purpose: this pin
          // proves the bridge, it does not drive the plugin with it.
          _window.jQuery(_window).on('changed.zf.mediaquery', function (e, newSize, oldSize) {
            jqEvents.push([e, newSize, oldSize]);
          });

          iframe.setAttribute('width', 1024); // just on the "large" breakpoint
          (_window.innerWidth);
          _window.dispatchEvent(new Event('resize'));

          tryInterval({
            interval: 20,
            timeout: 2000,
            try: () => {
              nativeEvents.length.should.equal(1);
            },
            then: () => {
              var event = nativeEvents[0];
              event.type.should.equal('changed');
              // the native layer's namespace graft, sorted like any
              // Events.trigger dispatch
              event.namespace.should.equal('mediaquery.zf');
              event.detail[0].should.equal('large');
              event.detail[1].should.equal('small');
              plugin.current.should.equal('large');
              plugin.atLeast('large').should.be.true;

              jqEvents.length.should.equal(1);
              // a real event carries no jQuery extraParameters: the new and
              // former breakpoint names ride in originalEvent.detail (the
              // mixed-state shape the wrap-up slice documents)
              jqEvents[0][0].originalEvent.detail[0].should.equal('large');
              jqEvents[0][0].originalEvent.detail[1].should.equal('small');
              // expect() instead of .should(): the dispatched event object
              // comes from the iframe realm, where chai's Object.prototype
              // extension does not exist
              chai.expect(jqEvents[0][0].originalEvent).to.equal(event);

              _window.removeEventListener('changed', realListener);
              _window.jQuery(_window).off('changed.zf.mediaquery');
              done();
            }
          });
        }
      });
    });

  });

});
