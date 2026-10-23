// S11 contract pins (7.0 line A): ResponsiveAccordionTabs' mq switches are
// explicit destroy+rebuild cycles. The 6.x "store/restore" - the
// storezfData/zfPluginBase jQuery-data juggling in _checkMediaQueries - was
// archaeologically dead: the restore line wrote the PREVIOUS inner instance
// back into the `zfPlugin` slot, and the very next line (the inner destroy)
// removed it again, so every switch was in fact rebuild-only. The rewrite
// makes that explicit and drops the phantom keys. These tests pin the
// observable 6.x behavior from the outside: the markup conversions, the
// open/close state semantics carried across a round trip, the ARIA state the
// inner plugins (Accordion/Tabs, both native since S8) write, and the
// rebuild semantics at the instance/attribute level.
describe('ResponsiveAccordionTabs (native layer contract)', function() {
  var plugin;
  var $html;
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
    if ($html) {
      $html.remove();
      $html = null;
    }
    // _handleMarkup drops its placeholder divs OUTSIDE the wrapper
    // collection; remove them so the ids stay unique across tests
    ['rat-native-tabs', 'rat-native-acc', 'rat-native-outer'].forEach(function(id) {
      var placeholder = document.getElementById('tabs-placeholder-' + id);
      if (placeholder) {
        placeholder.remove();
      }
    });
  });

  // The mq seam: MediaQuery still synthesizes 'changed.zf.mediaquery' on the
  // jQuery side, so the round trips below drive the swap through a jQuery
  // window trigger. Which breakpoint "matches" is pinned by stubbing
  // MediaQuery.atLeast (shared singleton with window.Foundation.MediaQuery),
  // keeping the suite independent of the headless viewport size. State-
  // dependent tests stub BEFORE building, because the last matching rule
  // wins at init and the headless viewport sits at or above 'medium'.
  function matchOnly(size) {
    if (atLeastStub) {
      atLeastStub.restore();
    }
    atLeastStub = sinon.stub(Foundation.MediaQuery, 'atLeast').callsFake(function(query) {
      return query === size;
    });
  }

  var tabsMarkup = `<ul id="rat-native-tabs" data-responsive-accordion-tabs="accordion medium-tabs">
    <li class="tabs-title is-active"><a href="#rat-native-panel1" aria-selected="true">Tab 1</a></li>
    <li class="tabs-title"><a href="#rat-native-panel2">Tab 2</a></li>
  </ul>
  <div class="tabs-content" data-tabs-content="rat-native-tabs">
    <div class="tabs-panel is-active" id="rat-native-panel1"><p>one</p></div>
    <div class="tabs-panel" id="rat-native-panel2"><p>two</p></div>
  </div>`;

  var accordionMarkup = `<ul id="rat-native-acc" data-responsive-accordion-tabs="tabs medium-accordion">
    <li class="accordion-item is-active" data-accordion-item>
      <a href="#" class="accordion-title">Acc 1</a>
      <div class="accordion-content" data-tab-content id="rat-native-acc-pane1">one</div>
    </li>
    <li class="accordion-item" data-accordion-item>
      <a href="#" class="accordion-title">Acc 2</a>
      <div class="accordion-content" data-tab-content id="rat-native-acc-pane2">two</div>
    </li>
  </ul>`;

  function build(markup, options) {
    $html = $(markup).appendTo('body');
    plugin = new Foundation.ResponsiveAccordionTabs($html, Object.assign({slideSpeed: 0}, options));
    return plugin;
  }

  describe('initial conversion (tabs markup -> accordion)', function() {
    it('builds an Accordion inside the wrapper and moves the panels into the items', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');

      plugin.currentPlugin.should.be.an.instanceof(Foundation.Accordion);
      el.classList.contains('accordion').should.be.true;
      el.classList.contains('tabs').should.be.false;

      var items = el.querySelectorAll('li');
      items[0].classList.contains('accordion-item').should.be.true;
      items[0].hasAttribute('data-accordion-item').should.be.true;
      // the active state stays on the item; the pane itself is stripped
      items[0].classList.contains('is-active').should.be.true;
      items[0].classList.contains('tabs-title').should.be.false;

      var panel1 = items[0].querySelector('[data-tab-content]');
      (panel1 !== null).should.be.true;
      panel1.classList.contains('accordion-content').should.be.true;
      panel1.classList.contains('is-active').should.be.false;
      panel1.id.should.equal('rat-native-panel1');

      // the tabs container is gone from the document, a placeholder took
      // its spot for the way back
      chai.expect(document.querySelector('[data-tabs-content="rat-native-tabs"]')).to.be.null;
      (document.getElementById('tabs-placeholder-rat-native-tabs') !== null).should.be.true;
    });

    it('carries the active tab into an open accordion pane with full ARIA state', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');
      var items = el.querySelectorAll('li');

      var link1 = items[0].querySelector('a');
      var link2 = items[1].querySelector('a');
      var panel1 = items[0].querySelector('[data-tab-content]');
      var panel2 = items[1].querySelector('[data-tab-content]');

      link1.getAttribute('aria-expanded').should.equal('true');
      link1.getAttribute('aria-controls').should.equal('rat-native-panel1');
      link2.getAttribute('aria-expanded').should.equal('false');
      panel1.getAttribute('aria-hidden').should.equal('false');
      panel1.getAttribute('role').should.equal('region');
      panel2.getAttribute('aria-hidden').should.equal('true');
    });

    it('keeps the wrapper contract: uuid attr, untouched element identity, no phantom keys', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');

      // wrapper uuid attr: the rules string already occupies
      // data-responsive-accordion-tabs, so the base ctor's uuid write is
      // skipped (6.x attr contract) - the attr stays the discovery handle
      el.hasAttribute('data-responsive-accordion-tabs').should.be.true;
      el.hasAttribute('data-accordion').should.be.true;
      // the S11 removals: the wrapper no longer writes the phantom keys
      chai.expect($html.data('zfPluginBase')).to.be.undefined;
      chai.expect(plugin.storezfData).to.be.undefined;
    });
  });

  describe('mq round trip (tabs -> accordion -> tabs -> accordion)', function() {
    it('rebuilds the markup and the inner instance on every switch', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');

      var firstInner = plugin.currentPlugin;
      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');

      plugin.currentPlugin.should.be.an.instanceof(Foundation.Tabs);
      plugin.currentPlugin.should.not.equal(firstInner);
      el.classList.contains('tabs').should.be.true;
      el.classList.contains('accordion').should.be.false;
      el.hasAttribute('data-tabs').should.be.true;
      el.hasAttribute('data-accordion').should.be.false;

      // panels are back out in a fresh container, with their ids intact
      var container = document.querySelector('[data-tabs-content="rat-native-tabs"]');
      (container !== null).should.be.true;
      chai.expect(document.getElementById('tabs-placeholder-rat-native-tabs')).to.be.null;
      var panels = container.querySelectorAll('.tabs-panel');
      panels.length.should.equal(2);
      panels[0].id.should.equal('rat-native-panel1');
      panels[1].id.should.equal('rat-native-panel2');

      // the active item carried over to the active panel
      el.querySelectorAll('li')[0].classList.contains('is-active').should.be.true;
      panels[0].classList.contains('is-active').should.be.true;
      panels[1].classList.contains('is-active').should.be.false;

      // and back to accordion through the same seam
      matchOnly('small');
      $(window).trigger('changed.zf.mediaquery');

      plugin.currentPlugin.should.be.an.instanceof(Foundation.Accordion);
      plugin.currentPlugin.should.not.equal(firstInner);
      el.hasAttribute('data-accordion').should.be.true;
      el.hasAttribute('data-tabs').should.be.false;
      var items = el.querySelectorAll('li');
      items[0].querySelector('[data-tab-content]').id.should.equal('rat-native-panel1');
      items[0].classList.contains('is-active').should.be.true;
    });

    it('stays functional after the round trip: a real click opens one pane at a time', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');

      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');
      matchOnly('small');
      $(window).trigger('changed.zf.mediaquery');

      var items = el.querySelectorAll('li');
      var link2 = items[1].querySelector('a');
      var panel1 = items[0].querySelector('[data-tab-content]');
      var panel2 = items[1].querySelector('[data-tab-content]');

      link2.click();

      items[1].classList.contains('is-active').should.be.true;
      items[0].classList.contains('is-active').should.be.false;
      panel2.getAttribute('aria-hidden').should.equal('false');
      panel1.getAttribute('aria-hidden').should.equal('true');
      link2.getAttribute('aria-expanded').should.equal('true');
      items[0].querySelector('a').getAttribute('aria-expanded').should.equal('false');
    });

    it('rebuilds only the inner: the wrapper uuid attr stays stable across switches (6.x zfPlugin parity)', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');
      var wrapperUuid = el.getAttribute('data-responsive-accordion-tabs');

      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');

      // the rebuilt Tabs writes its own uuid attr on the element, exactly
      // like the 6.x inner reoccupied the zfPlugin key after the first
      // switch; the wrapper's uuid attr is untouched throughout
      el.getAttribute('data-responsive-accordion-tabs').should.equal(wrapperUuid);
      el.hasAttribute('data-tabs').should.be.true;
    });
  });

  describe('open/close/toggle delegation', function() {
    it('forwards open/close/toggle to the current inner plugin', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');
      var items = el.querySelectorAll('li');
      var $panel2 = $(items[1].querySelector('[data-tab-content]'));

      plugin.toggle($panel2);
      items[1].classList.contains('is-active').should.be.true;
      // allowAllClosed defaults to false: closing the only open pane is a
      // no-op (Accordion.up guard, 6.x semantics)
      plugin.close($panel2);
      items[1].classList.contains('is-active').should.be.true;
      plugin.open($(items[0].querySelector('[data-tab-content]')));
      items[0].classList.contains('is-active').should.be.true;
      items[1].classList.contains('is-active').should.be.false;
      plugin.open($panel2);
      items[1].classList.contains('is-active').should.be.true;

      // tabs state: only open is supported, like 6.x
      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');
      var $tabPanel2 = $(document.getElementById('rat-native-panel2'));

      chai.expect(plugin.toggle($tabPanel2)).to.be.undefined;
      chai.expect(plugin.close($tabPanel2)).to.be.undefined;
      plugin.open($tabPanel2);
      $tabPanel2[0].classList.contains('is-active').should.be.true;
      document.querySelectorAll('#rat-native-tabs li a')[1].getAttribute('aria-selected').should.equal('true');
    });
  });

  describe('initial conversion (accordion markup -> tabs)', function() {
    it('builds Tabs inside the wrapper and moves the panes out to a fresh container', function() {
      matchOnly('small');
      build(accordionMarkup);
      var el = document.getElementById('rat-native-acc');

      plugin.currentPlugin.should.be.an.instanceof(Foundation.Tabs);
      el.classList.contains('tabs').should.be.true;
      el.querySelectorAll('li')[0].classList.contains('tabs-title').should.be.true;
      el.querySelectorAll('li')[0].classList.contains('accordion-item').should.be.false;
      el.querySelectorAll('li')[0].hasAttribute('data-accordion-item').should.be.false;

      var container = el.nextElementSibling;
      container.getAttribute('data-tabs-content').should.equal('rat-native-acc');
      var panels = container.querySelectorAll('.tabs-panel');
      panels.length.should.equal(2);
      panels[0].id.should.equal('rat-native-acc-pane1');
      panels[0].classList.contains('is-active').should.be.true;
      panels[1].classList.contains('is-active').should.be.false;

      // the href was rewritten from "#" to the pane it controls
      el.querySelectorAll('li a')[0].getAttribute('href').should.equal('#rat-native-acc-pane1');
      el.querySelectorAll('li a')[0].getAttribute('aria-selected').should.equal('true');
      el.querySelectorAll('li a')[1].getAttribute('aria-selected').should.equal('false');
      panels[1].getAttribute('aria-hidden').should.equal('true');
    });

    it('round trips back to accordion through the seam and keeps working', function() {
      matchOnly('small');
      build(accordionMarkup);
      var el = document.getElementById('rat-native-acc');

      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');

      plugin.currentPlugin.should.be.an.instanceof(Foundation.Accordion);
      el.classList.contains('accordion').should.be.true;
      var items = el.querySelectorAll('li');
      items[0].classList.contains('accordion-item').should.be.true;
      items[0].hasAttribute('data-accordion-item').should.be.true;
      chai.expect(document.querySelector('[data-tabs-content="rat-native-acc"]')).to.be.null;
      var panel1 = items[0].querySelector('[data-tab-content]');
      panel1.id.should.equal('rat-native-acc-pane1');
      panel1.classList.contains('accordion-content').should.be.true;
      items[0].classList.contains('is-active').should.be.true;
      items[0].querySelector('a').getAttribute('aria-expanded').should.equal('true');

      // functional: clicking the second title opens only the second pane
      items[1].querySelector('a').click();
      items[1].classList.contains('is-active').should.be.true;
      items[0].classList.contains('is-active').should.be.false;
      items[1].querySelector('[data-tab-content]').getAttribute('aria-hidden').should.equal('false');
    });
  });

  describe('nested submenu inside a pane', function() {
    it('survives the outer round trip: attrs and click behavior intact', function() {
      $html = $(`<ul id="rat-native-outer" data-responsive-accordion-tabs="accordion medium-tabs">
        <li class="tabs-title is-active"><a href="#rat-native-outer-p1">Tab 1</a></li>
        <li class="tabs-title"><a href="#rat-native-outer-p2">Tab 2</a></li>
      </ul>
      <div class="tabs-content" data-tabs-content="rat-native-outer">
        <div class="tabs-panel is-active" id="rat-native-outer-p1">
          <ul id="rat-native-inner" data-accordion-menu>
            <li>
              <a href="#">parent</a>
              <ul class="menu nested" id="rat-native-inner-sub">
                <li><a href="#">child</a></li>
              </ul>
            </li>
          </ul>
        </div>
        <div class="tabs-panel" id="rat-native-outer-p2"><p>two</p></div>
      </div>`).appendTo('body');

      var innerEl = document.getElementById('rat-native-inner');
      var inner = new Foundation.AccordionMenu($(innerEl), {slideSpeed: 0});
      matchOnly('small');
      plugin = new Foundation.ResponsiveAccordionTabs($('#rat-native-outer'), {slideSpeed: 0});

      // AccordionMenu carries aria-expanded on the parent item (li), the
      // click consumer sits on the anchor (S9 native layer)
      var parentLi = innerEl.querySelector('li.is-accordion-submenu-parent');
      var parentLink = parentLi.querySelector('a');
      parentLink.click();
      parentLi.getAttribute('aria-expanded').should.equal('true');

      matchOnly('medium');
      $(window).trigger('changed.zf.mediaquery');

      // the pane carrying the nested menu was moved to the fresh tabs
      // container - element identity survives, so the inner plugin must too
      innerEl.hasAttribute('data-accordion-menu').should.be.true;
      parentLi = document.querySelector('#rat-native-inner li.is-accordion-submenu-parent');
      parentLink = parentLi.querySelector('a');
      parentLink.click();
      parentLi.getAttribute('aria-expanded').should.equal('false');

      inner.destroy();
    });
  });

  describe('destroy()', function() {
    it('removes the mq seam handler, the inner instance and the wrapper contract', function() {
      matchOnly('small');
      build(tabsMarkup);
      var el = document.getElementById('rat-native-tabs');
      var handler = plugin._changedZfMediaQueryHandler;
      plugin.destroy();
      plugin = null;

      // the wrapper uuid attr (S2 native lifecycle) and the inner's are both
      // gone; the point-lookup slot went with them (same base destroy)
      el.hasAttribute('data-responsive-accordion-tabs').should.be.false;
      el.hasAttribute('data-accordion').should.be.false;

      var events = $._data(window, 'events') || {};
      var handlers = (events.changed || []).filter(function(ev) {
        return ev.handler === handler;
      });
      handlers.should.be.empty;
    });
  });
});
