describe('Slider', function() {
  var plugin;
  var html;
  var template = `<div class="slider" data-slider>
      <span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span>
      <span class="slider-fill" data-slider-fill></span>
      <input type="hidden">
    </div>`;

  Foundation.Slider.defaults.moveTime = 0;
  Foundation.Slider.defaults.changedDelay = 0;

  afterEach(function(done) {
    // Timeout needed because even with changeDelay = 0 the changed.zf.slider event may be fired after this hook
    plugin.destroy();
    html.remove();
    done();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      (plugin.$element instanceof Element).should.be.true;
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('stores handle, inout and fill elements', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      chai.expect(plugin.$handle).to.be.an.instanceof(Element);
      chai.expect(plugin.$input).to.be.an.instanceof(Element);
      chai.expect(plugin.$fill).to.be.an.instanceof(Element);
    });
    it('stores two handle and input elements for two sided slider', function() {
      html = document.body.appendChild(fixture(template));
      html.insertAdjacentHTML('beforeend', '<span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span><input type="hidden">');
      plugin = new Foundation.Slider(html, {doubleSided: true});

      chai.expect(plugin.$handle2).to.be.an.instanceof(Element);
      chai.expect(plugin.$input2).to.be.an.instanceof(Element);
    });
    it('is disabled when disable option is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {disabled: true});

      html.classList.contains('disabled').should.be.true;
    });
  });

  describe('setHandlePos()', function() {
    it('positions the handle', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin._setHandlePos(plugin.$handle, 10, true);

      plugin.$handle.style.left.should.not.be.equal('');
    });
    it('does nothing if disabled option is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {disabled: true});

      plugin._setHandlePos(plugin.$handle, 10, true);

      plugin.$handle.style.left.should.be.equal('');
    });
    it('fires changed.zf.slider event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {changedDelay: 50});
      var slider = plugin;

      // Terminal form: the changed production is a real bubbling event
      // with the plain handle element
      FoundationNext.Events.on(html, 'changed.zf.slider', function(e, handle) {
        handle.should.be.equal(slider.$handle);
        done();
      });

      // Rapidly change to see if event fires only once. Timer jitter can
      // outlast the test (afterEach destroys the plugin), so each tick bails
      // once its instance is torn down instead of throwing uncaught.
      for (let i = 0; i < 5; i++) {
        setTimeout(function() {
          if (!slider.$element) { return; }
          slider._setHandlePos(slider.$handle, i * 10, true);
        }, i * 20);
      }
    });
    it('fires moved.zf.slider event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});
      var slider = plugin;

      let timesCallbackCalled = 0;
      // Terminal form: the moved production is a real bubbling event with
      // the plain handle element
      FoundationNext.Events.on(html, 'moved.zf.slider', function(e, handle) {
        if (++timesCallbackCalled === 4) {
          handle.should.be.equal(slider.$handle);
          done();
        }
      });

      // Rapidly change to see if event fires multiple times. Same teardown
      // guard as the changed.zf.slider test above.
      for (let i = 0; i < 5; i++) {
        setTimeout(function() {
          if (!slider.$element) { return; }
          slider._setHandlePos(slider.$handle, i * 10, true);
        }, i * 20);
      }
    });
  });

  describe('setValues()', function() {
    it('updates ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin._setValues(plugin.$handle, 10);

      plugin.$handle.getAttribute('aria-valuenow').should.equal('10');
    });
    it('updates input value', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin._setValues(plugin.$handle, 10);

      plugin.$input.value.should.equal('10');
    });
  });

  describe('setInitAttr()', function() {
    it('adds ARIA attributes to handle', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 50,
        end: 70,
        start: 20,
        vertical: true
      });

      plugin.$handle.getAttribute('role').should.equal('slider');
      plugin.$handle.getAttribute('aria-controls').should.equal(plugin.$input.getAttribute('id'));
      plugin.$handle.getAttribute('aria-valuemax').should.equal('70');
      plugin.$handle.getAttribute('aria-valuemin').should.equal('20');
      plugin.$handle.getAttribute('aria-valuenow').should.equal('50');
      plugin.$handle.getAttribute('aria-orientation').should.equal('vertical');
      plugin.$handle.getAttribute('tabindex').should.equal('0');
    });
    it('adds attributes to input', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin.$input.getAttribute('max').should.equal('100');
      plugin.$input.getAttribute('min').should.equal('0');
      plugin.$input.getAttribute('step').should.equal('1');
    });
  });

  describe('_value()', function() {
    it('handles positive values', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 0,
        end: 10,
        start: 0,
        vertical: true
      });

      plugin._value(0.5237916657475017).should.equal(4.762083342524983);
      plugin._value(0.009882861617877391).should.equal(9.901171383821225);
      plugin._value(0.9840506496657916).should.equal(0.1594935033420839);
      plugin._value(0.7327435970969094).should.equal(2.672564029030906);
      plugin._value(0.2569544020648122).should.equal(7.430455979351878);
    });

    it('handles negative values', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 0,
        end: 5,
        start: -5,
        vertical: true
      });

      plugin._value(0.8372195627716132).should.equal(-3.372195627716133);
      plugin._value(0.012706536365842359).should.equal(4.872934636341577);
      plugin._value(0.9925216739096865).should.equal(-4.925216739096864);
      plugin._value(0.8202775142838235).should.equal(-3.2027751428382345);
      plugin._value(0.2103637687233902).should.equal(2.8963623127660982);
    });
  });

  describe('adjustValue()', function() {
    it('handles positive values', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin._adjustValue(null, 1).should.equal(1);
      plugin._adjustValue(null, 2).should.equal(2);
      plugin._adjustValue(null, 1.2).should.equal(1);
      plugin._adjustValue(null, 1.9).should.equal(2);
      plugin._adjustValue(null, 1.5).should.equal(2);
    });

    it('handles negative values', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin._adjustValue(null, -1).should.equal(-1);
      plugin._adjustValue(null, -2).should.equal(-2);
      plugin._adjustValue(null, -1.2).should.equal(-1);
      plugin._adjustValue(null, -1.9).should.equal(-2);
      plugin._adjustValue(null, -1.5).should.equal(-1);
    });
  });

  describe('keyboard events', function() {
    it('sets value to minimum using HOME', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {});

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('HOME'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal(plugin.$handle.getAttribute('aria-valuemin'));
    });
    it('increases value by step size on ARROW_RIGHT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 + 1).toString());
    });
    it('increases value by step size on ARROW_UP', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 + 1).toString());
    });
    it('decreases value by step size on ARROW_LEFT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 - 1).toString());
    });
    it('decreases value by step size on ARROW_DOWN', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 - 1).toString());
    });
    it('decreases value by step size times 10 on SHIFT_ARROW_RIGHT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT', {shift: true}));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 + 1 * 10).toString());
    });
    it('decreases value by step size times 10 on SHIFT_ARROW_LEFT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Slider(html, {
        initialStart: 10,
        step: 1
      });

      plugin.$handle.focus();

      plugin.$handle.dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT', {shift: true}));

      plugin.$handle.getAttribute('aria-valuenow').should.equal((10 - 1 * 10).toString());
    });
  });
});
