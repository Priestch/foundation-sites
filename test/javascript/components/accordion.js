describe('Accordion', function() {
  var plugin;
  var html;
  var template = `<ul class="accordion" data-accordion>
  <li class="accordion-item is-active" data-accordion-item>
    <a href="#" class="accordion-title">Accordion 1</a>
    <div class="accordion-content" data-tab-content >
      <p>Panel 1. Lorem ipsum dolor</p>
      <a href="#">Nowhere to Go</a>
    </div>
  </li>
  <li class="accordion-item" data-accordion-item>
    <a href="#" class="accordion-title">Accordion 2</a>
    <div class="accordion-content" data-tab-content>
      <textarea></textarea>
      <button class="button">I do nothing!</button>
    </div>
  </li>
  <li class="accordion-item" data-accordion-item>
    <a href="#" class="accordion-title">Accordion 3</a>
    <div class="accordion-content" data-tab-content>
      Pick a date!
      <input type="date"></input>
    </div>
  </li>
</ul>`;

  afterEach(function() {
    plugin.destroy();
    document.activeElement.blur();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('up()', function(done) {
    it('closes the targeted container if allowAllClosed is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {allowAllClosed: true});

      plugin.up(html.querySelector('.accordion-content'));
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.equal('true');
      FoundationNext.Events.on(html, 'up.zf.accordion', function() {
        FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.false;
        done();
      });
    });

    it('toggles attributes of title of the targeted container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {allowAllClosed: true});

      plugin.up(html.querySelector('.accordion-content'));
      html.querySelector('.accordion-title').getAttribute('aria-expanded').should.equal('false');
    });

    it('not closes the open container if allowAllClosed is false', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {allowAllClosed: false});

      plugin.up(html.querySelector('.accordion-content'));
      FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.true;
      // Element has aria-hidden="false" not set if it has not been actively toggled so far
      // Therefor check if it has not aria-hidden="true"
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.not.equal('true');
    });
  });

  describe('down()', function() {
    it('opens the targeted container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      plugin.down(html.querySelectorAll('.accordion-content')[1]);
      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[1]).should.be.true;
      html.querySelectorAll('.accordion-content')[1].getAttribute('aria-hidden').should.equal('false');
    });

    it('toggles attributes of title of the targeted container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      plugin.down(html.querySelectorAll('.accordion-content')[1]);
      html.querySelectorAll('.accordion-title')[1].getAttribute('aria-expanded').should.equal('true');
    });

    it('closes open container if multiExpand is false', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {multiExpand: false});

      plugin.down(html.querySelectorAll('.accordion-content')[1]);
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.equal('true');
      FoundationNext.Events.on(html, 'up.zf.accordion', function() {
        FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.false;
        done();
      });
    });

    it('not closes open container if multiExpand is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {multiExpand: true});

      plugin.down(html.querySelectorAll('.accordion-content')[1]);
      FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.true;
      // Element has aria-hidden="false" not set if it has not been actively toggled so far
      // Therefor check if it has not aria-hidden="true"
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.not.equal('true');
    });
  });

  describe('toggle()', function(done) {
    it('closes the only open container if allowAllClosed is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {allowAllClosed: true});

      plugin.toggle(html.querySelector('.accordion-content'));
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.equal('true');
      FoundationNext.Events.on(html, 'up.zf.accordion', function() {
        FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.false;
        done();
      });
    });

    it('not closes the only open container if allowAllClosed is false', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {allowAllClosed: false});

      plugin.toggle(html.querySelector('.accordion-content'));
      FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.true;
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.equal('false');
    });
  });

  describe('keyboard events', function() {
    it('opens next panel on ARROW_DOWN', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelector('.accordion-title').focus();

      html.querySelector('.accordion-title').dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[1]).should.be.true;
      html.querySelectorAll('.accordion-content')[1].getAttribute('aria-hidden').should.equal('false');
      // Check if focus was moved
      html.querySelectorAll(".accordion-title")[1].should.be.equal(document.activeElement);
    });
    it('opens previous panel on ARROW_UP', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelectorAll('.accordion-title')[2].focus();

      html.querySelectorAll('.accordion-title')[2].dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[1]).should.be.true;
      html.querySelectorAll('.accordion-content')[1].getAttribute('aria-hidden').should.equal('false');
      // Check if focus was moved
      html.querySelectorAll(".accordion-title")[1].should.be.equal(document.activeElement);
    });
    it('opens first panel on HOME', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelectorAll('.accordion-title')[1].focus();

      html.querySelectorAll('.accordion-title')[1].dispatchEvent(window.mockKeyboardEvent('HOME'));

      FoundationNext.Dom.visible(html.querySelector('.accordion-content')).should.be.true;
      html.querySelector('.accordion-content').getAttribute('aria-hidden').should.equal('false');
      // Check if focus was moved
      html.querySelector('.accordion-title').should.be.equal(document.activeElement);
   });
    it('opens last panel on END', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelectorAll('.accordion-title')[1].focus();

      html.querySelectorAll('.accordion-title')[1].dispatchEvent(window.mockKeyboardEvent('END'));

      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[2]).should.be.true;
      html.querySelectorAll('.accordion-content')[2].getAttribute('aria-hidden').should.equal('false');
      // Check if focus was moved
      html.querySelectorAll('.accordion-title')[2].should.be.equal(document.activeElement);
    });
    it('opens related panel on ENTER', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelectorAll('.accordion-title')[1].focus();

      html.querySelectorAll('.accordion-title')[1].dispatchEvent(window.mockKeyboardEvent('ENTER'));

      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[1]).should.be.true;
      html.querySelectorAll('.accordion-content')[1].getAttribute('aria-hidden').should.equal('false');
    });
    it('opens related panel on SPACE', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Accordion(html, {});

      html.querySelectorAll('.accordion-title')[1].focus();

      html.querySelectorAll('.accordion-title')[1].dispatchEvent(window.mockKeyboardEvent('SPACE'));

      FoundationNext.Dom.visible(html.querySelectorAll('.accordion-content')[1]).should.be.true;
      html.querySelectorAll('.accordion-content')[1].getAttribute('aria-hidden').should.equal('false');
    });
  });
});
