describe('Reveal', function() {
	var plugin;
	var html;
	var template = `<div class="reveal" id="exampleModal1" data-reveal>
	  Modal content
	  <button class="close-button" data-close aria-label="Close modal" type="button">
	    <span aria-hidden="true">&times;</span>
	  </button>
	</div>`;

  afterEach(function() {
    // destroy() nulls instance properties, so skip if the test destroyed it already
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    document.activeElement.blur();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      chai.expect(plugin.$element).to.be.an.instanceof(Element);
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('sets ARIA attributes for modal', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      html.getAttribute('aria-hidden').should.equal('true');
      html.getAttribute('role').should.equal('dialog');
    });

    it('detects anchor if one exists', function() {
      html = document.body.appendChild(fixture(template));
      var anchor = document.body.appendChild(fixture('<button data-open="exampleModal1">Open</button>'));
      plugin = new Foundation.Reveal(html, {});

      plugin.$anchor.should.deep.equal([anchor]);

      anchor.remove();
    });

    it('sets ARIA attributes for anchor if one exists', function() {
      html = document.body.appendChild(fixture(template));
      var anchor = document.body.appendChild(fixture('<button data-open="exampleModal1">Open</button>'));
      plugin = new Foundation.Reveal(html, {});

      anchor.getAttribute('aria-haspopup').should.equal('dialog');
      anchor.getAttribute('aria-controls').should.equal(html.getAttribute('id'));

      anchor.remove();
    });
  });

  describe('makeOverlay()', function() {
		it('creates an overlay if overlay option is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      chai.expect(plugin.$overlay).to.be.an.instanceof(Element);
      plugin.$overlay.classList.contains('reveal-overlay').should.be.true;
      $.contains(document.body, plugin.$overlay).should.be.true;
    });
  });

  describe('open()', function() {
		it('opens the modal', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.true;
        done();
      });

      plugin.open();
    });
    it('opens the overlay', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        FoundationNext.Dom.visible(plugin.$overlay).should.be.true;
        done();
      });

      plugin.open();
    });
    it('toggles ARIA attributes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        html.getAttribute('aria-hidden').should.equal('false');
        html.getAttribute('tabindex').should.equal('-1');
        done();
      });

      plugin.open();
    });
    it('adds class to body', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        document.querySelector('html').classList.contains('is-reveal-open').should.be.true;
        done();
      });

      plugin.open();
    });
    it('adds optional overlay classes overlay element', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {additionalOverlayClasses: 'default'});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        document.querySelector('.reveal-overlay').classList.contains('default').should.be.true;
        done();
      });

      plugin.open();
    });
    // TODO: Check if  this.$element.trigger('closeme.zf.reveal', this.id) is correctly used.

    // it('closes previously opened modal if multipleOpened option is false', function(done) {
    //   html = $(template).appendTo('body');
    //   html2 = $(template).attr('id', 'exampleModal2').appendTo('body');

    //   plugin = new Foundation.Reveal(html, {multipleOpened: false});
    //   plugin2 = new Foundation.Reveal(html2, {multipleOpened: false});

    //   plugin.open();

    //   plugin2.open();

    //   html.should.be.hidden;

    //   plugin2.destroy();
    //   html2.remove();
    // });
    it('fires open.zf.reveal event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
      	FoundationNext.Dom.visible(html).should.be.true;
      	done();
      });

      plugin.open();
    });

    it('traps focus if trapFocus option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {trapFocus: true});

      let spy = sinon.spy(Foundation.Keyboard, 'trapFocus');

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        sinon.assert.called(spy);
        Foundation.Keyboard.trapFocus.restore();
      	done();
      });

      plugin.open();
    });
  });

	describe('close()', function() {
		it('closes the modal', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
      	done();
      });

      plugin.close();
    });
    it('closes the overlay', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(plugin.$overlay).should.be.false;
      	done();
      });

      plugin.close();
    });
    it('toggles ARIA attributes', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        html.getAttribute('aria-hidden').should.equal('true');
      	done();
      });

      plugin.close();
    });
    it('removes class from body', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();


      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        document.querySelector('html').classList.contains('is-reveal-open').should.be.false;
        done();
      });

      plugin.close();
    });
    it('does not remove class from body if another reveal is open', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {multipleOpened: true});

      let html2 = document.body.appendChild(fixture(template));
      html2.setAttribute('id', 'exampleModal2');
      let plugin2 = new Foundation.Reveal(html2, {multipleOpened: true, vOffset: 10});

      // Open both first
      plugin.open();
      plugin2.open();


      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {

        document.querySelector('html').classList.contains('is-reveal-open').should.be.true;
        plugin2.destroy();
        html2.remove();
        done();
      });

      plugin.close();
    });
    it('fires closed.zf.reveal event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
      	FoundationNext.Dom.visible(html).should.be.false;
      	done();
      });

      plugin.close();
    });

    it('releases focus if trapFocus option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {trapFocus: true});

      // Open it first
      plugin.open();

      let spy = sinon.spy(Foundation.Keyboard, 'releaseFocus');

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        sinon.assert.called(spy);
        Foundation.Keyboard.releaseFocus.restore();
        done();
      });

      plugin.close();
    });
    it('sets focus to anchor', function(done) {
      html = document.body.appendChild(fixture(template));
      var anchor = document.body.appendChild(fixture('<button data-open="exampleModal1">Open</button>'));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        setTimeout(function() {
          anchor.should.be.equal(document.activeElement);
          anchor.remove();
          done();
        }, 0);
      });

      plugin.close();
    });
    it('sets focus to anchor that opened it', function(done) {
      html = document.body.appendChild(fixture(template));
      var anchor = document.body.appendChild(fixture('<button data-open="exampleModal1">Open</button>'));
      var anchor2 = document.body.appendChild(fixture('<button data-open="exampleModal1">Open2</button>'));
      plugin = new Foundation.Reveal(html, {});
      anchor.focus();

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        setTimeout(function() {
          anchor.should.be.equal(document.activeElement);
          anchor.remove();
          anchor2.remove();
          done();
        }, 0);
      });

      plugin.close();
    });
  });

	describe('toggle()', function() {
    it('opens a closed modal', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true});

      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        FoundationNext.Dom.visible(plugin.$overlay).should.be.true;
        done();
      });

      plugin.open();
    });
		it('closes an open modal', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
      	done();
      });

      plugin.close();
    });
  });

  describe('events()', function() {
    it('opens the modal on anchor click', function(done) {
      html = document.body.appendChild(fixture(template));
      var anchor = document.body.appendChild(fixture('<button data-open="exampleModal1">Open</button>'));
      plugin = new Foundation.Reveal(html, {});


      FoundationNext.Events.on(html, 'open.zf.reveal', function() {
        FoundationNext.Dom.visible(plugin.$overlay).should.be.true;
        anchor.remove();
      	done();
      });

      FoundationNext.Events.trigger(anchor, 'click');
    });
		it('closes a modal on overlay click if closeOnClick option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true, closeOnClick: true});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
      	done();
      });

      FoundationNext.Events.trigger(plugin.$overlay, "click");
    });
    it('not closes a modal on overlay click if closeOnClick option is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {overlay: true, closeOnClick: false});

      // Open it first
      plugin.open();

      FoundationNext.Events.trigger(plugin.$overlay, "click");

      // Add timeout to make sure it does not close
      // Timeout is required because closed event will not be fired
      setTimeout(function() {
        FoundationNext.Dom.visible(html).should.be.true;
        done();
      }, 10);
    });
    it('closes Reveal with click on close button', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});

      // Open it first
      plugin.open();

      FoundationNext.Events.on(html, 'closed.zf.reveal', function() {
        FoundationNext.Dom.visible(html).should.be.false;
      	done();
      });

      var closeBtn = html.querySelector('[data-close]');
      closeBtn.focus();
      FoundationNext.Events.trigger(closeBtn, 'click');
    });
  });

  describe('destroy()', function() {
    it('removes its namespaced keydown handler from window', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, {});
      plugin.open();

      plugin.destroy();

      var events = $._data(window, 'events') || {};
      var revealKeydowns = (events.keydown || []).filter(function(ev) {
        return ev.namespace === 'zf.reveal:' + plugin.id;
      });
      revealKeydowns.should.have.length(0);
    });
  });

  describe('multipleOpened', function() {
    it('keeps ESC working for other open modals when one closes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Reveal(html, { multipleOpened: true });
      var html2 = document.body.appendChild(fixture(template.replace('exampleModal1', 'exampleModal2')));
      var plugin2 = new Foundation.Reveal(html2, { multipleOpened: true });

      plugin.open();
      plugin2.open();
      plugin.close();

      window.dispatchEvent(mockKeyboardEvent('ESCAPE'));

      try {
        plugin2.isActive.should.be.false;
      } finally {
        plugin2.destroy();
        html2.remove();
      }
    });
  });
});
