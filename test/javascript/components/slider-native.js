// S10 contract pins (7.0 line A): Slider's input keyup/change and bar-click
// consumers, the finished.zf.animate consumer and the state/ARIA attribute
// writes moved to the native Events/DOM layer while the public contract
// stays byte-identical; the pre-existing slider.js:528 'idx' lint exemption
// is cleaned up on the way (behavior neutral). Known seams: the moved/
// changed.zf.slider production stays on jQuery (the coarse suite reads the
// forwarded handle as a trailing handler argument, Tabs S8 change.zf.tabs
// precedent). The drag chain (addTouch feed + mousedown/mousemove/mouseup)
// joined the native layer with the Touch util's real mouse replay (S13);
// the keydown binding stays on jQuery (the coarse keyboard suite feeds
// jQuery-synthesized mock keydowns). These tests pin that contract from the
// outside; the pre-existing slider.js suite is untouched on purpose and
// stays green.
describe('Slider (native layer contract)', function() {
  var plugin;
  var html;
  var template = `<div class="slider" data-slider data-initial-start="10" data-step="1">
      <span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span>
      <span class="slider-fill" data-slider-fill></span>
      <input type="hidden">
    </div>`;

  afterEach(function(done) {
    // Timeout needed because even with changeDelay = 0 the changed.zf.slider
    // event may be fired after this hook (slider.js suite precedent).
    // destroy() nulls instance properties, so skip if the test destroyed it
    // already.
    if (plugin.$element) {
      plugin.destroy();
    }
    html.remove();
    done();
  });

  function build(options) {
    html = document.body.appendChild(fixture(template));
    plugin = new Foundation.Slider(html, Object.assign({moveTime: 0, changedDelay: 0}, options));
    return plugin;
  }

  describe('init() without a fill element', function() {
    // 6.x jQuery empty-collection semantics: sliders without a
    // [data-slider-fill] element are valid markup, every fill write is a
    // no-op. The native port crashed on null.style until the guards landed.
    var noFillTemplate = `<div class="slider" data-slider data-initial-start="10" data-step="1">
        <span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span>
        <input type="hidden">
      </div>`;

    it('initializes, positions the handle and skips every fill write', function() {
      html = document.body.appendChild(fixture(noFillTemplate));
      plugin = new Foundation.Slider(html, {moveTime: 0, changedDelay: 0});

      (plugin.$fill === null).should.be.true;
      plugin.$handle.style.left.should.not.equal('');
      plugin.$input.value.should.equal('10');
    });

    it('moves the handle on setHandles without touching a fill', function() {
      html = document.body.appendChild(fixture(noFillTemplate));
      plugin = new Foundation.Slider(html, {moveTime: 0, changedDelay: 0});
      plugin.setHandles();
      plugin.$handle.style.left.should.not.equal('');
      (plugin.$fill === null).should.be.true;
    });
  });

  describe('init()', function() {
    it('writes the input and handle state attributes through the native layer', function() {
      build({});
      var input = plugin.$input;
      var handle = plugin.$handle;

      input.getAttribute('max').should.equal('100');
      input.getAttribute('min').should.equal('0');
      input.getAttribute('step').should.equal('1');
      handle.getAttribute('role').should.equal('slider');
      handle.getAttribute('aria-valuemax').should.equal('100');
      handle.getAttribute('aria-valuemin').should.equal('0');
      handle.getAttribute('aria-valuenow').should.equal('10');
      handle.getAttribute('aria-orientation').should.equal('horizontal');
      handle.getAttribute('tabindex').should.equal('0');
    });

    it('reads the options from the data-* attributes like jQuery data did', function() {
      build({});

      plugin.options.initialStart.should.equal(10);
      plugin.options.step.should.equal(1);
      plugin.$handle.getAttribute('aria-valuenow').should.equal('10');
    });

    it('marks disabled sliders through the native classList', function() {
      build({disabled: true});

      html.classList.contains('disabled').should.be.true;
    });
  });

  describe('move flow', function() {
    it('fires moved.zf.slider from the native finished.zf.animate consumer, keeping the trailing-argument signature', function() {
      build({});
      // the first _setHandlePos arms the one-shot finished listener; its own
      // synchronous Move(0) completion fires before the registration (the
      // 6.x race the coarse suite's 5-calls-4-events guard pins, kept)
      plugin._setHandlePos(plugin.$handle, 10, true);
      var finishedSpy = sinon.spy();
      FoundationNext.Events.on(html, 'finished.zf.animate', finishedSpy);
      var movedHandle;
      // Terminal form: the moved production is a real bubbling event with
      // the plain handle element
      FoundationNext.Events.on(html, 'moved.zf.slider', function(e, handle) { movedHandle = handle; });

      plugin._setHandlePos(plugin.$handle, 50, true);

      // the real Move completion event reaches the flipped native consumer
      sinon.assert.calledOnce(finishedSpy);
      // the terminal form forwards the plain handle element
      movedHandle.should.equal(plugin.$handle);
      plugin.$handle.getAttribute('aria-valuenow').should.equal('50');
    });

    it('updates the aria state natively in _setValues', function() {
      build({});

      plugin._setValues(plugin.$handle, 42);

      plugin.$handle.getAttribute('aria-valuenow').should.equal('42');
      plugin.$input.value.should.equal('42');
    });
  });

  describe('input consumers (native layer)', function() {
    it('moves the handle on a real change event on the input', function() {
      build({});
      var input = plugin.$input;

      input.value = '40';
      input.dispatchEvent(new Event('change'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal('40');
    });

    it('moves the handle on a real ENTER keyup on the input', function() {
      build({});
      var input = plugin.$input;

      input.value = '30';
      // keyCode: this headless Chrome ignores "which" in KeyboardEventInit
      input.dispatchEvent(new KeyboardEvent('keyup', {keyCode: 13}));

      plugin.$handle.getAttribute('aria-valuenow').should.equal('30');
    });
  });

  describe('bar click consumer (native layer)', function() {
    it('selects the bar value on a real click on the container', function() {
      build({});

      // element.click() dispatches with clientX/pageX 0: the click lands
      // left of the bar, the value becomes the start value
      html.click();

      plugin.$handle.getAttribute('aria-valuenow').should.equal('0');
    });
  });

  describe('seams', function() {
    it('moves the handle on the synthetic jQuery mock keydown (the keyboard seam stays jQuery-side)', function() {
      build({});

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal('11');
    });

    it('runs the drag chain from real mouse events (the S13 Touch/drag flip)', function() {
      build({});

      plugin.$handle.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}));
      plugin.$element.zfSliderDragging.should.be.true;

      document.body.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, cancelable: true, clientX: 5, clientY: 5}));
      plugin.$element.zfSliderDragging.should.be.false;
    });
  });

  describe('destroy', function() {
    it('drops the native input/click listeners alongside the jQuery ones', function() {
      build({});
      var input = plugin.$input;
      var handle = plugin.$handle;
      plugin.destroy();

      // a real change and a real click must both find nothing
      input.value = '60';
      input.dispatchEvent(new Event('change'));
      html.click();

      handle.getAttribute('aria-valuenow').should.equal('10');
    });
  });
});
