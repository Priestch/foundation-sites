// S13: the Nest util is rewritten on the native DOM layer. The plugin call
// sites keep passing the jQuery collection (their own collection reads are
// untouched), so the suite pins the preserved contract end to end: Feather's
// roles/classes/ARIA and Burn's class/attr/style reset on the real menu
// markup each plugin owns.
describe('Nest consumption (menu plugins)', function() {
  var $html;

  afterEach(function() {
    if ($html) {
      $html.remove();
      $html = null;
    }
  });

  it('AccordionMenu feathers and burns its menu around the native layer', function() {
    $html = $(`<ul id="nest-acc-menu" data-accordion-menu>
        <li class="is-accordion-submenu-parent"><a href="#">Item 1</a>
          <ul class="menu vertical is-accordion-submenu" data-submenu>
            <li class="is-accordion-submenu-item is-submenu-item"><a href="#">Subitem 1</a></li>
          </ul>
        </li>
      </ul>`).appendTo('body');
    var menu = $html[0];
    var plugin = new Foundation.AccordionMenu($html, {});

    // Feather's chain is visible on the submenu (accordion type skips the
    // haspopup ARIA; AccordionMenu itself rewrites the submenu role to
    // 'group' right after Feather)
    var sub = menu.querySelector('ul[data-submenu]');
    sub.getAttribute('role').should.equal('group');
    var parentLink = menu.querySelector('li.is-accordion-submenu-parent > a');
    chai.expect(parentLink.getAttribute('aria-haspopup')).to.be.null;

    plugin.destroy();

    // Burn stripped the submenu contract
    menu.querySelector('ul').classList.contains('is-accordion-submenu').should.be.false;
    menu.querySelector('ul').classList.contains('submenu').should.be.false;
    chai.expect(menu.querySelector('ul').getAttribute('data-submenu')).to.be.null;
    menu.querySelector('ul li').classList.contains('is-accordion-submenu-item').should.be.false;
  });

  it('DropdownMenu feathers its menu and Burn resets it on destroy', function() {
    $html = $(`<ul id="nest-ddm" data-dropdown-menu>
        <li><a href="#">Item 1</a>
          <ul class="menu"><li><a href="#">Subitem 1</a></li></ul>
        </li>
      </ul>`).appendTo('body');
    var menu = $html[0];
    var plugin = new Foundation.DropdownMenu($html, {});

    menu.getAttribute('role').should.equal('menubar');
    menu.querySelector('ul').classList.contains('is-dropdown-submenu').should.be.true;
    menu.querySelector('ul').hasAttribute('data-submenu').should.be.true;

    plugin.destroy();

    menu.querySelector('ul').classList.contains('is-dropdown-submenu').should.be.false;
    chai.expect(menu.querySelector('ul').getAttribute('data-submenu')).to.be.null;
  });

  it('Drilldown feathers its menu with the drilldown ARIA and Burn resets it', function() {
    $html = $(`<div id="nest-dd-wrap"><ul id="nest-dd" data-drilldown>
        <li><a href="#">Item 1</a>
          <ul class="menu"><li><a href="#">Subitem 1</a></li></ul>
        </li>
      </ul></div>`).appendTo('body');
    var menu = $html.find('#nest-dd')[0];
    var plugin = new Foundation.Drilldown($html.find('#nest-dd'), {});

    var parentLi = menu.querySelector('li');
    parentLi.classList.contains('is-drilldown-submenu-parent').should.be.true;
    parentLi.getAttribute('aria-expanded').should.equal('false');
    var sub = menu.querySelector('ul');
    sub.getAttribute('aria-hidden').should.equal('true');
    sub.classList.contains('is-drilldown-submenu').should.be.true;

    plugin.destroy();

    sub.classList.contains('is-drilldown-submenu').should.be.false;
    sub.style.display.should.equal('');
  });
});
