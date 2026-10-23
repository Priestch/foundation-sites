describe('Orbit', function() {
  var plugin;
  var html;
  var template = `<div class="orbit" role="region" aria-label="Favorite Space Pictures" data-orbit>
    <ul class="orbit-container">
      <button class="orbit-previous"><span class="show-for-sr">Previous Slide</span>&#9664;&#xFE0E;</button>
      <button class="orbit-next"><span class="show-for-sr">Next Slide</span>&#9654;&#xFE0E;</button>
      <li class="is-active orbit-slide">
        Slide #1 content.
      </li>
      <li class="orbit-slide">
        Slide #2 content.
      </li>
      <li class="orbit-slide">
        Slide #3 content.
      </li>
      <li class="orbit-slide">
        Slide #4 content.
      </li>
    </ul>
    <nav class="orbit-bullets">
      <button class="is-active" data-slide="0">
        <span class="show-for-sr">First slide details.</span>
        <span class="show-for-sr" data-slide-active-label>Current Slide</span>
      </button>
      <button data-slide="1"><span class="show-for-sr">Second slide details.</span></button>
      <button data-slide="2"><span class="show-for-sr">Third slide details.</span></button>
      <button data-slide="3"><span class="show-for-sr">Fourth slide details.</span></button>
    </nav>
  </div>`;
  Foundation.Orbit.defaults.useMUI = false;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.$element.should.be.an('object');
      plugin.$wrapper.should.be.an('object');
      plugin.$slides.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('shows the first slide', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.true;
    });
    it('hides all slides except the first one', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      html.querySelectorAll('.orbit-slide').forEach(function(slide, index) {
        if (index === 0) {return;} // Not for the first one as this is visible
        FoundationNext.Dom.visible(slide).should.be.false;
      });
    });
    it('makes slide with is-active class active initially', function() {
      html = document.body.appendChild(fixture(template));
      html.querySelector('.orbit-slide.is-active').classList.remove('is-active');
      html.querySelectorAll('.orbit-slide')[2].classList.add('is-active');
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[2]).should.be.true;
    });
  });

  describe('loadBullets()', function() {
    it('stores the bullets', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.$bullets.should.be.an('object');
    });
  });

  describe('changeSlide()', function() {
    it('changes slides to the next one for ltr is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[1]).should.be.true;
    });
    it('changes slides to the last one for ltr is false', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(false);

      html.querySelector('.orbit-slide').classList.contains('is-active').should.be.false;
      (html.querySelectorAll('.orbit-slide')[html.querySelectorAll('.orbit-slide').length -1]).classList.contains('is-active').should.be.true;
    });
    it('changes slides to the chosen one', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true, html.querySelectorAll('.orbit-slide')[2], 2);

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[2]).should.be.true;
    });
    it('toggles ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      html.querySelector('.orbit-slide').hasAttribute('aria-live').should.be.false;
      html.querySelectorAll('.orbit-slide')[1].getAttribute('aria-live').should.equal('polite');
    });
    it('fires beforeslidechange.zf.orbit event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.on(html, 'beforeslidechange.zf.orbit', function() {
        // Old slide should still be active
        FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.true;
        done();
      });
      plugin.changeSlide(true);
    });
    it('fires slidechange.zf.orbit event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.on(html, 'slidechange.zf.orbit', function() {
        // New slide is already active
        FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[1]).should.be.true;
        done();
      });
      plugin.changeSlide(true);
    });
  });

  describe('updateBullets()', function() {
    it('updates the active bullet', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      html.querySelector('.orbit-bullets [data-slide]').classList.contains('is-active').should.be.false;
      html.querySelectorAll('.orbit-bullets [data-slide]')[1].classList.contains('is-active').should.be.true;
    });

    it('moves the explicit active slide label to the active bullet', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      html.querySelector('.orbit-bullets [data-slide]').querySelectorAll(':scope > span').length.should.equal(1);
      html.querySelectorAll('.orbit-bullets [data-slide]')[1].querySelectorAll(':scope > span').length.should.equal(2);
    });

    it('moves the implicit active slide label to the active bullet', function() {
      html = document.body.appendChild(fixture(template));
      // Remove the explicit attribute to make this test
      // The "implicit" active slide label is the exceeding `span` element
      html.querySelector('[data-slide-active-label]').removeAttribute('data-slide-active-label');
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      html.querySelector('.orbit-bullets [data-slide]').querySelectorAll(':scope > span').length.should.equal(1);
      html.querySelectorAll('.orbit-bullets [data-slide]')[1].querySelectorAll(':scope > span').length.should.equal(2);
    });

    it('moves nothing if there is no implicit active slide label', function() {
      html = document.body.appendChild(fixture(template));
      // Remove the active slide label to make this test
      html.querySelector('[data-slide-active-label]').remove();
      plugin = new Foundation.Orbit(html, {});

      plugin.changeSlide(true);

      html.querySelector('.orbit-bullets [data-slide]').querySelectorAll(':scope > span').length.should.equal(1);
      html.querySelectorAll('.orbit-bullets [data-slide]')[1].querySelectorAll(':scope > span').length.should.equal(1);
    });
  });

  describe('events()', function() {
    it('changes slides on bullet click', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.trigger(html.querySelectorAll('.orbit-bullets [data-slide]')[2], 'click');

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[2]).should.be.true;
    });
    /*it('changes slides on swipeleft (touchmove)', function() {
      html = $(template).appendTo('body');
      plugin = new Foundation.Orbit(html, {});

      html.find('.orbit-slide').eq(0).trigger($.Event("touchstart", {"touches": [{"pageX": 200, "pageY": 10}]}));
      html.find('.orbit-slide').eq(0).trigger($.Event("touchmove", {"touches": [{"pageX": 100, "pageY": 10}]}));
      html.find('.orbit-slide').eq(0).trigger($.Event("touchend", {"touches": [{"pageX": 0, "pageY": 10}]}));
      html.find('.orbit-slide').eq(0).should.be.visible;
      html.find('.orbit-slide').eq(1).should.be.hidden;
    });*/
    // S13: the swipe listeners live on the native event layer, so the
    // synthesized events are driven through it
    it('changes slides on swipeleft', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.trigger(html.querySelector('.orbit-slide'), 'swipeleft');

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[1]).should.be.true;
    });
    it('changes slides on swiperight', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.trigger(html.querySelector('.orbit-slide'), 'swiperight');

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible((html.querySelectorAll('.orbit-slide')[html.querySelectorAll('.orbit-slide').length -1])).should.be.true;
    });
    it('changes slides to the previous one', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.trigger(html.querySelector('.orbit-previous'), 'click');

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible((html.querySelectorAll('.orbit-slide')[html.querySelectorAll('.orbit-slide').length -1])).should.be.true;
    });
    it('changes slides to the next one', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});

      FoundationNext.Events.trigger(html.querySelector('.orbit-next'), 'click');

      FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
      FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[1]).should.be.true;
    });
  });

  describe('geoSync()', function() {
    it('changes slides automatically based on timerDelay option', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {timerDelay: 200});

      setTimeout(function() {
        FoundationNext.Dom.visible(html.querySelector('.orbit-slide')).should.be.false;
        FoundationNext.Dom.visible(html.querySelectorAll('.orbit-slide')[1]).should.be.true;
        done();
      }, 201);
    });
  });

  describe('keyboard events', function() {
    it('moves switches to next slide using ARROW_RIGHT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});
      let spy = sinon.spy(plugin, 'changeSlide');

      plugin.$wrapper.focus();

      plugin.$wrapper[0].dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      sinon.assert.calledWith(spy, true);
    });
    it('moves switches to previous slide using ARROW_LEFT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Orbit(html, {});
      let spy = sinon.spy(plugin, 'changeSlide');

      plugin.$wrapper.focus();

      plugin.$wrapper[0].dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT'));

      sinon.assert.calledWith(spy, false);
    });
  });
});
