describe('Accordion Menu', function() {
  var plugin;
  var html;
  var template = `
    <ul class="vertical menu">
      <li>
        <a href="#">Item 1</a>
        <ul class="menu vertical nested">
          <li>
            <a href="#">Item 1A</a>
            <ul class="menu vertical nested">
              <li><a href="#">Item 1Ai</a></li>
              <li><a href="#">Item 1Aii</a></li>
              <li><a href="#">Item 1Aiii</a></li>
            </ul>
          </li>
          <li><a href="#">Item 1B</a></li>
          <li><a href="#">Item 1C</a></li>
        </ul>
      </li>
      <li>
        <a href="#">Item 2</a>
        <ul class="menu vertical nested">
          <li><a href="#">Item 2A</a></li>
          <li><a href="#">Item 2B</a></li>
        </ul>
      </li>
      <li><a href="#">Item 3</a></li>
    </ul>`;
  Foundation.AccordionMenu.defaults.slideSpeed = 0;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('up()', function() {
    it('closes the targeted submenu', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html);
      const submenu = html.querySelector('.is-accordion-submenu');

      // Open it first
      plugin.down(submenu);

      FoundationNext.Events.on(html, 'up.zf.accordionMenu', function () {
        // Should be hidden
        FoundationNext.Dom.visible(submenu).should.be.false; // Should have attributes updated and without active classe

        submenu.getAttribute('aria-hidden').should.equal('true');
        submenu.classList.contains('is-active').should.be.false;
        done();
      });
      plugin.up(submenu);
    });

    it('toggles attributes of title of the targeted container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      // Open it first
      plugin.down(html.querySelector('.is-accordion-submenu'));

      plugin.up(html.querySelector('.is-accordion-submenu'));
      html.querySelector('.is-accordion-submenu-parent').getAttribute('aria-expanded').should.equal('false');
    });

    it('fires up.zf.accordionMenu event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {slideSpeed: 200});

      // Open it first
      plugin.down(html.querySelector('.is-accordion-submenu'));

      FoundationNext.Events.on(html, 'up.zf.accordionMenu', function() {
        FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.false;
        done();
      });
      plugin.up(html.querySelector('.is-accordion-submenu'));
    });
  });

  describe('down()', function() {
    it('opens the targeted submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});
      const submenu = html.querySelector('.is-accordion-submenu');

      plugin.down(submenu);

      // Should be visible
      FoundationNext.Dom.visible(submenu).should.be.true;
      // Should have attributes updated and with an active classe
      submenu.getAttribute('aria-hidden').should.equal('false');
      submenu.classList.contains('is-active').should.be.true;
    });

    it('toggles attributes of title of the targeted submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      plugin.down(html.querySelector('.is-accordion-submenu'));
      html.querySelector('.is-accordion-submenu-parent').getAttribute('aria-expanded').should.equal('true');
    });

    it('closes open submenu if multiOpen is false', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {multiOpen: false});

      // Open another one first
      plugin.down(html.querySelector('.is-accordion-submenu'));

      plugin.down(html.querySelectorAll('.is-accordion-submenu')[2]);
      FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.false;
    });

    it('not closes open submenu if multiOpen is true', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {multiOpen: true});

      // Open another one first
      plugin.down(html.querySelector('.is-accordion-submenu'));

      plugin.down(html.querySelectorAll('.is-accordion-submenu')[2]);
      FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.true;
    });

    it('fires down.zf.accordionMenu event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {slideSpeed: 200});

      FoundationNext.Events.on(html, 'down.zf.accordionMenu', function() {
        FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.true;
        done();
      });
      plugin.down(html.querySelector('.is-accordion-submenu'));
    });
  });

  describe('toggle()', function() {
    it('opens a closed container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      plugin.toggle(html.querySelector('.is-accordion-submenu'));
      FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.true;
    });

    it('closes an open container', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      // Open first
      plugin.down(html.querySelector('.is-accordion-submenu'));

      plugin.toggle(html.querySelector('.is-accordion-submenu'));
      FoundationNext.Dom.visible(html.querySelector('.is-accordion-submenu')).should.be.false;
    });
  });

  describe('hideAll()', function() {
    it('closes all accordions', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.AccordionMenu(html, {});

      // Open some first
      plugin.down(html.querySelector('.is-accordion-submenu'));
      plugin.down(html.querySelectorAll('.is-accordion-submenu')[1]);
      plugin.down(html.querySelectorAll('.is-accordion-submenu')[2]);

      plugin.hideAll();

      html.querySelectorAll('[data-submenu]').forEach(function(el) {
        FoundationNext.Dom.visible(el).should.be.false;
      });
    });
  });

});
