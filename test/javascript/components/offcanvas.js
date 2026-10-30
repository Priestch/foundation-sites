describe('Off Canvas', function() {
  var plugin;
  var html;
  var template = `<div class="off-canvas-wrapper">
      <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
        <div class="off-canvas position-left" id="offCanvas" data-off-canvas data-content-scroll="false">

          <!-- Close button -->
          <button class="close-button" aria-label="Close menu" type="button" data-close>
            <span aria-hidden="true">&times;</span>
          </button>

          <!-- Menu -->
          <ul class="vertical menu">
            <li><a href="#">Foundation</a></li>
            <li><a href="#">Dot</a></li>
            <li><a href="#">ZURB</a></li>
            <li><a href="#">Com</a></li>
            <li><a href="#">Slash</a></li>
            <li><a href="#">Sites</a></li>
          </ul>

        </div>

        <div class="off-canvas-content" data-off-canvas-content>
          <!-- Page content -->
          PAGE_CONTENT.

          <!-- Triggers -->
          <button type="button" class="button" data-toggle="offCanvas">Open Menu</button>
        </div>
      </div>
    </div>`;

  afterEach(function() {
    plugin.destroy();
    document.activeElement.blur();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      chai.expect(plugin.$element).to.be.an.instanceof(Element);
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('finds triggers for the Off Canvas', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      plugin.$triggers.length.should.be.equal(1);
    });

    it('sets ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      plugin.$element.getAttribute('aria-hidden').should.equal('true');
      plugin.$triggers[0].getAttribute('aria-controls').should.equal(plugin.$element.getAttribute('id'));
      plugin.$triggers[0].getAttribute('aria-expanded').should.equal('false');
    });

    it('closes Off Canvas on outside click if closeOnClick option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {closeOnClick: true});

      chai.expect(plugin.$overlay).to.be.an.instanceof(Element);

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        FoundationNext.Events.trigger(plugin.$overlay, "click");
        plugin.$element.classList.contains('is-open').should.be.false;
        done();
      });

      plugin.open();
    });
  });

  describe('open()', function() {
    it('toggles ARIA attributes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        plugin.$triggers[0].getAttribute('aria-expanded').should.equal('true');
        plugin.$element.getAttribute('aria-hidden').should.equal('false');
        done();
      });

      plugin.open();
    });

    it('adds active classes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        plugin.$element.classList.contains('is-open').should.be.true;
        document.querySelector('body').classList.contains('is-off-canvas-open').should.be.true;
        done();
      });

      plugin.open();
    });

    it('focusses Off Canvas if autoFocus option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {autoFocus: true});

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        plugin.$element.querySelector('a, button').should.be.equal(document.activeElement);
        done();
      });

      plugin.open();
    });

    it('traps focus if trapFocus option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {trapFocus: true});

      let spy = sinon.spy(Foundation.Keyboard, 'trapFocus');

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        sinon.assert.called(spy);
        Foundation.Keyboard.trapFocus.restore();
        done();
      });

      plugin.open();
    });


    it('fires opened.zf.offCanvas event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        done();
      });

      plugin.open();
    });

    it('fires openedEnd.zf.offCanvas event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function () {
        FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function () {
          done();
        });
      });

      plugin.open();
    });
  });

  describe('close()', function() {
    it('toggles ARIA attributes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        plugin.close();

        plugin.$triggers[0].getAttribute('aria-expanded').should.equal('false');
        plugin.$element.getAttribute('aria-hidden').should.equal('true');
        done();
      });

      // Open it first
      plugin.open();
    });

    it('removes active classes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'closed.zf.offCanvas', function() {
        plugin.$element.classList.contains('is-open').should.be.false;
        document.querySelector('body').classList.contains('is-off-canvas-open').should.be.false;
        done();
      });

      // Open and close the off-canvas
      plugin.open();
      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', () => plugin.close());
    });

    it('fires close.zf.offCanvas event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});
      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        FoundationNext.Events.one(html, 'close.zf.offCanvas', function() {
          done();
        });

        plugin.close();
      });

      // Open it first
      plugin.open();
    });

    it('fires closed.zf.offCanvas event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      // 7.0 terminal form: native instruments - the wait is an Events.one
      // driven by the native triggerHandler (a non-bubbling real event)
      // 7.0 terminal form: flat native instruments - the closed production
      // follows the transitionend wait, which the native triggerHandler
      // (a non-bubbling real event) drives.
      FoundationNext.Events.on(html, 'closed.zf.offCanvas', function () {
        done();
      });

      // Open it first
      plugin.open();
      plugin.close();
      // fake transitionend for console tests
      FoundationNext.Events.triggerHandler(plugin.$element, Foundation.transitionend(plugin.$element));
      // Open it first
      plugin.open();
    });

    it('fires closed.zf.offCanvas event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        FoundationNext.Events.one(html, 'closed.zf.offCanvas', function() {
          done();
        });

        plugin.close();
      });

      // Open it first
      plugin.open();
    });

    it('releases focus if trapFocus option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), { trapFocus: true });

      let spy = sinon.spy(Foundation.Keyboard, 'releaseFocus');

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function () {
        FoundationNext.Events.one(html, 'closed.zf.offCanvas', function () {
          sinon.assert.called(spy);
          Foundation.Keyboard.releaseFocus.restore();
          done();
        });

        plugin.close();
      });

      // Open it first...
      plugin.open();
    });
  });

  describe('toggle()', function() {
    it('opens a closed Off Canvas', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'opened.zf.offCanvas', function() {
        plugin.$element.classList.contains('is-open').should.be.true;
        done();
      });

      plugin.toggle();
    });

    it('closes an open Off Canvas', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        FoundationNext.Events.one(html, 'closed.zf.offCanvas', function () {
          plugin.$element.classList.contains('is-open').should.be.false;
          done();
        });
        plugin.toggle();
      });

      // Open it first
      plugin.toggle();
    });
  });

  describe('keyboard events', function() {
    it('closes Off Canvas on ESCAPE', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.OffCanvas(html.querySelector('[data-off-canvas]'), {});

      FoundationNext.Events.one(html, 'openedEnd.zf.offCanvas', function() {
        FoundationNext.Events.one(html, 'closed.zf.offCanvas', function () {
          plugin.$element.classList.contains('is-open').should.be.false;
          done();
        });

        plugin.$element.focus();

        plugin.$element.dispatchEvent(window.mockKeyboardEvent('ESCAPE'));
      });

      // Open it first
      plugin.open();
    });
  });

});
