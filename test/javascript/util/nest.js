// S13 pins (7.0 line A): the Nest util is rewritten on the native DOM layer
// - the menu argument stays the jQuery collection the three menu plugins
// pass in, while every class/attribute read/write inside Feather and Burn
// goes through the element's own DOM API. These tests pin the resulting
// markup contract that AccordionMenu (accordion), DropdownMenu (dropdown)
// and Drilldown (drilldown) depend on. The consumer suite
// (nest-consumers.js) drives the real plugins over the same rewrite.
describe('Nest (native DOM layer)', function() {
  var html;

  afterEach(function() {
    if (html) {
      html.remove();
      html = null;
    }
  });

  function build(markup) {
    html = document.body.appendChild(fixture(markup));
    return html;
  }

  describe('Feather()', function() {
    it('feathers a menu with the default zf type: roles and submenu classes', function() {
      var menu = build(`<ul id="nest-zf">
          <li><a href="#">Item 1</a>
            <ul><li><a href="#">Subitem 1</a></li></ul>
          </li>
          <li><a href="#">Item 2</a></li>
        </ul>`);

      Foundation.Nest.Feather(menu);

      menu.getAttribute('role').should.equal('menubar');
      menu.querySelectorAll('a').forEach(function(a) {
        a.getAttribute('role').should.equal('menuitem');
      });
      menu.querySelectorAll('li').forEach(function(li) {
        li.getAttribute('role').should.equal('none');
      });

      var parentItem = menu.querySelector('li');
      parentItem.classList.contains('is-zf-submenu-parent').should.be.true;
      // applyAria is true outside accordion: the parent link carries
      // aria-haspopup and falls back to its own text as the label
      parentItem.querySelector('a').getAttribute('aria-haspopup').should.equal('true');
      parentItem.querySelector('a').getAttribute('aria-label').should.equal('Item 1');

      var subMenu = parentItem.querySelector('ul');
      subMenu.classList.contains('submenu').should.be.true;
      subMenu.classList.contains('is-zf-submenu').should.be.true;
      subMenu.getAttribute('data-submenu').should.equal('');
      subMenu.getAttribute('role').should.equal('menubar');

      // the submenu item carries the submenu-item class chain
      subMenu.querySelector('li').classList.contains('is-submenu-item').should.be.true;
      subMenu.querySelector('li').classList.contains('is-zf-submenu-item').should.be.true;
    });

    it('feathers a drilldown menu: the drilldown-only ARIA attributes', function() {
      var menu = build(`<ul id="nest-drilldown">
          <li><a href="#">Item 1</a>
            <ul><li><a href="#">Subitem 1</a></li></ul>
          </li>
        </ul>`);

      Foundation.Nest.Feather(menu, 'drilldown');

      var parentItem = menu.querySelector('li');
      parentItem.classList.contains('is-drilldown-submenu-parent').should.be.true;
      parentItem.getAttribute('aria-expanded').should.equal('false');
      var subMenu = parentItem.querySelector('ul');
      subMenu.classList.contains('is-drilldown-submenu').should.be.true;
      subMenu.getAttribute('aria-hidden').should.equal('true');
    });

    it('feathers an accordion menu: no haspopup ARIA, accordion classes only', function() {
      var menu = build(`<ul id="nest-accordion">
          <li class="is-accordion-submenu-parent"><a href="#" aria-label="Custom label">Item 1</a>
            <ul><li><a href="#">Subitem 1</a></li></ul>
          </li>
        </ul>`);

      Foundation.Nest.Feather(menu, 'accordion');

      var parentItem = menu.querySelector('li');
      parentItem.classList.contains('is-accordion-submenu-parent').should.be.true;
      // Accordions handle their own ARIA attributes
      chai.expect(parentItem.querySelector('a').getAttribute('aria-haspopup')).to.be.null;
      // an existing aria-label must not be touched
      parentItem.querySelector('a').getAttribute('aria-label').should.equal('Custom label');
      var subMenu = parentItem.querySelector('ul');
      subMenu.classList.contains('is-accordion-submenu').should.be.true;
      subMenu.classList.contains('submenu').should.be.true;
    });
  });

  describe('Burn()', function() {
    it('burns a feathered dropdown menu back to plain markup', function() {
      var menu = build(`<ul id="nest-burn" data-dropdown-menu>
          <li><a href="#">Item 1</a>
            <ul class="submenu is-dropdown-submenu" data-submenu><li class="is-submenu-item is-dropdown-submenu-item"><a href="#">Subitem 1</a></li></ul>
          </li>
        </ul>`);
      var subMenu = menu.querySelector('ul');
      var subItem = menu.querySelector('ul li');
      var topLevel = menu.querySelector('li');
      // hide a submenu inline like Drilldown does, so the css reset is pinned
      subMenu.style.display = 'none';

      Foundation.Nest.Burn(menu, 'dropdown');

      topLevel.classList.contains('is-dropdown-submenu-parent').should.be.false;
      topLevel.classList.contains('is-submenu-item').should.be.false;
      subMenu.classList.contains('is-dropdown-submenu').should.be.false;
      subMenu.classList.contains('submenu').should.be.false;
      subMenu.hasAttribute('data-submenu').should.be.false;
      subMenu.style.display.should.equal('');
      subItem.classList.contains('is-dropdown-submenu-item').should.be.false;
      subItem.classList.contains('is-submenu-item').should.be.false;
    });

    it('strips the active state classes from every matched node', function() {
      var menu = build(`<ul id="nest-burn-active" data-accordion-menu>
          <li class="is-accordion-submenu-parent is-active"><a href="#">Item 1</a>
            <ul class="submenu is-accordion-submenu is-active" data-submenu><li><a href="#">Subitem 1</a></li></ul>
          </li>
        </ul>`);

      Foundation.Nest.Burn(menu, 'accordion');

      menu.querySelector('li').classList.contains('is-active').should.be.false;
      menu.querySelector('ul').classList.contains('is-active').should.be.false;
    });

    it('works on a plain element passed directly', function() {
      var menu = build(`<ul id="nest-burn-el" data-dropdown-menu>
          <li class="is-dropdown-submenu-parent"><a href="#">Item 1</a></li>
        </ul>`);

      // the plugins pass jQuery collections, but the util accepts the plain
      // element too (querySelectorAll-based)
      Foundation.Nest.Burn(menu, 'dropdown');

      menu.querySelector('li').classList.contains('is-dropdown-submenu-parent').should.be.false;
    });
  });
});
