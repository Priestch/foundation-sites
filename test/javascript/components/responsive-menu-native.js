// S11 contract pins (7.0 line A): ResponsiveMenu is the responsive wrapper
// over the three menu plugins, all native since S9 (DropdownMenu,
// AccordionMenu, Drilldown). The mq switch is an explicit destroy+rebuild of
// the sub-plugin on the same element; the class/attr bookkeeping around it
// moved to the native DOM layer. The 'changed.zf.mediaquery' consumer joined
// the native layer in the S13 MediaQuery flip and answers the real
// broadcast. These tests pin the contract from the outside; the
// pre-existing responsiveMenu.js suite is untouched on purpose and stays
// green.
describe('ResponsiveMenu (native layer contract)', function() {
  var plugin;
  var html;
  var atLeastStub;

  beforeEach(function() {
    Foundation.MediaQuery._reInit();
  });

  afterEach(function() {
    if (atLeastStub) {
      atLeastStub.restore();
      atLeastStub = null;
    }
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if (html) {
      html.remove();
      html = null;
    }
  });

  // Which breakpoint "matches" is pinned by stubbing MediaQuery.atLeast
  // (shared singleton with window.Foundation.MediaQuery), keeping the suite
  // independent of the headless viewport size. State-dependent tests stub
  // BEFORE building, because the last matching rule wins at init and the
  // headless viewport sits at or above 'medium'.
  function matchOnly(size) {
    if (atLeastStub) {
      atLeastStub.restore();
    }
    atLeastStub = sinon.stub(Foundation.MediaQuery, 'atLeast').callsFake(function(query) {
      return query === size;
    });
  }

  var template = `<ul id="rm-native-menu" data-responsive-menu="small-dropdown medium-accordion large-drilldown">
    <li>
      <a href="#">Item 1</a>
      <ul class="menu">
        <li><a href="#">Subitem 1</a></li>
        <li><a href="#">Subitem 2</a></li>
      </ul>
    </li>
    <li><a href="#">Item 2</a></li>
  </ul>`;

  function build(markup, options) {
    html = document.body.appendChild(fixture(markup || template));
    plugin = new Foundation.ResponsiveMenu(html, options || {});
    return plugin;
  }

  it('initializes the sub-plugin named by the matching rule and writes the wrapper contract', function() {
    // 'small' always matches, no stub needed for the plain dropdown case
    build(`<ul id="rm-native-menu" data-responsive-menu="dropdown">
      <li><a href="#">Item 1</a>
        <ul class="menu">
          <li><a href="#">Subitem 1</a></li>
        </ul>
      </li>
    </ul>`);
    var el = document.getElementById('rm-native-menu');

    plugin.currentPlugin.should.be.an.instanceof(Foundation.DropdownMenu);
    el.classList.contains('dropdown').should.be.true;
    // the rules string already occupies data-responsive-menu, so the base
    // ctor's uuid write is skipped (6.x attr contract) - the attr stays the
    // discovery handle; the child's uuid attr is written beside it
    el.hasAttribute('data-responsive-menu').should.be.true;
    el.hasAttribute('data-dropdown-menu').should.be.true;
    el.hasAttribute('data-mutate').should.be.true;
  });

  it('swaps dropdown-menu <-> accordion-menu <-> drilldown through the mq seam, back and forth', function() {
    matchOnly('small');
    build();
    var el = document.getElementById('rm-native-menu');

    // starting state: small -> dropdown
    plugin.currentPlugin.should.be.an.instanceof(Foundation.DropdownMenu);

    // small -> medium: accordion-menu takes over
    matchOnly('medium');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    plugin.currentPlugin.should.be.an.instanceof(Foundation.AccordionMenu);
    plugin.currentPlugin.should.not.equal(plugin);
    el.classList.contains('accordion-menu').should.be.true;
    el.classList.contains('dropdown').should.be.false;
    el.hasAttribute('data-accordion-menu').should.be.true;
    el.hasAttribute('data-dropdown-menu').should.be.false;

    // medium -> large: drilldown takes over
    matchOnly('large');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    plugin.currentPlugin.should.be.an.instanceof(Foundation.Drilldown);
    el.classList.contains('drilldown').should.be.true;
    el.classList.contains('accordion-menu').should.be.false;
    el.hasAttribute('data-drilldown').should.be.true;
    el.hasAttribute('data-accordion-menu').should.be.false;

    // and back: large -> medium -> small, the full cycle in reverse
    matchOnly('medium');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    plugin.currentPlugin.should.be.an.instanceof(Foundation.AccordionMenu);
    el.classList.contains('accordion-menu').should.be.true;
    el.hasAttribute('data-accordion-menu').should.be.true;
    el.hasAttribute('data-drilldown').should.be.false;

    matchOnly('small');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    plugin.currentPlugin.should.be.an.instanceof(Foundation.DropdownMenu);
    el.classList.contains('dropdown').should.be.true;
    el.hasAttribute('data-dropdown-menu').should.be.true;
    el.hasAttribute('data-accordion-menu').should.be.false;
  });

  it('keeps the same sub-plugin when the matching rule type does not change', function() {
    matchOnly('small');
    build();
    var first = plugin.currentPlugin;

    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    plugin.currentPlugin.should.equal(first);
    document.getElementById('rm-native-menu').hasAttribute('data-dropdown-menu').should.be.true;
  });

  it('destroy() removes the current sub-plugin, the wrapper contract and the mq seam handler', function() {
    build(`<ul id="rm-native-menu" data-responsive-menu="dropdown">
      <li><a href="#">Item 1</a>
        <ul class="menu">
          <li><a href="#">Subitem 1</a></li>
        </ul>
      </li>
    </ul>`);
    var el = document.getElementById('rm-native-menu');
    var handler = plugin._changedZfMediaQueryHandler;
    plugin.destroy();
    plugin = null;

    // the wrapper uuid attr (S2 native lifecycle) and the child's are both
    // gone; the point-lookup slot went with them (same base destroy)
    el.hasAttribute('data-responsive-menu').should.be.false;
    el.hasAttribute('data-dropdown-menu').should.be.false;

    // the mq listener is gone (S13 flip: native layer): a broadcast with
    // 'small' matching would rebuild the sub-plugin if the handler had
    // survived - it rebuilds nothing and rewrites no attrs
    matchOnly('small');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
    el.hasAttribute('data-dropdown-menu').should.be.false;
    chai.expect(handler).to.not.be.undefined;
  });

  it('destroy() after a swap tears down the swapped-in sub-plugin', function() {
    matchOnly('small');
    build();
    matchOnly('medium');
    FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');

    var el = document.getElementById('rm-native-menu');
    plugin.destroy();
    plugin = null;

    el.hasAttribute('data-accordion-menu').should.be.false;
    el.hasAttribute('data-responsive-menu').should.be.false;
  });
});
