describe('Drilldown Menu', function() {
  var plugin;
  var html;
  var template = `<ul class="menu" data-drilldown style="width: 200px" id="m1">
    <li>
      <a href="#">Item 1</a>
      <ul id="Menu-1" class="menu">
        <li>
          <a href="#">Item 1A</a>
          <ul id="Menu-1A" class="menu">
            <li><a href="#Item-1Aa">Item 1Aa</a></li>
          </ul>
        </li>
        <li><a href="#Item-1B">Item 1B</a></li>
        <li><a href="#Item-1C">Item 1C</a></li>
      </ul>
    </li>
    <li>
      <a href="#">Item 2</a>
      <ul id="Menu-2" class="menu">
        <li><a href="#Item-2A">Item 2A</a></li>
        <li><a href="#Item-2B">Item 2B</a></li>
      </ul>
    </li>
    <li><a href="#Item-3"> Item 3</a></li>
  </ul>`;

  var templateWithToggler = `
    <div>
      <button id="trigger" data-toggle="target" type="button">Toggler</button>
      <div id="target" class="is-hidden" data-toggler="is-hidden">
        ${template}
      </div>
    </div>
  `;

  afterEach(function() {
    plugin.destroy();
    document.activeElement.blur();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('stores additional elements', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      plugin.$submenuAnchors.should.be.an('object');
      plugin.$submenus.should.be.an('object');
      plugin.$menuItems.should.be.an('object');
    });
  });

  describe('prepareMenu()', function() {
    it('wraps the submenus', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

    });
    it('adds ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      plugin.$element[0].querySelectorAll('[data-submenu]').forEach(function(el) {
        el.getAttribute('role').should.equal('group');
        el.getAttribute('aria-hidden').should.equal('true');
      });

      plugin.$element[0].querySelectorAll('.is-drilldown-submenu-parent').forEach(function(el) {
        el.getAttribute('aria-expanded').should.equal('false');
        el.querySelectorAll(':scope > a')[0].getAttribute('aria-haspopup').should.equal('true');
        el.querySelectorAll(':scope > a')[0].getAttribute('aria-label').should.equal(el.querySelectorAll(':scope > a')[0].textContent);
      });

    });
  });

  describe('show()', function() {
    it('shows the given submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));

      // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
      html.querySelector('li.is-drilldown-submenu-parent').querySelector('ul').classList.contains('is-active').should.be.true;
    });
    it('toggles ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));

      html.querySelector('li.is-drilldown-submenu-parent').getAttribute('aria-expanded').should.equal('true');
      html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul').getAttribute('aria-hidden').should.equal('false');
    });
    it('fires open.zf.drilldown event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      FoundationNext.Events.on(html, 'open.zf.drilldown', function() {
        // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
        html.querySelector('li.is-drilldown-submenu-parent').querySelector('ul').classList.contains('is-active').should.be.true;
        done();
      });

      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));
    });
  });

  describe('hide()', function() {
    it('hides the given submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open it first
      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));

      plugin._hide(html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul'));

      // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
      html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul').classList.contains('is-closing').should.be.true;
    });
    it('toggles ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open it first
      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));

      plugin._hide(html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul'));

      html.querySelector('li.is-drilldown-submenu-parent').getAttribute('aria-expanded').should.equal('false');
      html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul').getAttribute('aria-hidden').should.equal('true');
    });
    it('fires hide.zf.drilldown event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open it first
      plugin._show(html.querySelector('li.is-drilldown-submenu-parent'));

      FoundationNext.Events.on(html, 'hide.zf.drilldown', function() {
        // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
        html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul').classList.contains('is-closing').should.be.true;
        done();
      });

      plugin._hide(html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul'));
    });
  });

  describe('hideAll()', function() {
    it('hides all submenus', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open one first
      plugin._show(html.querySelectorAll('li.is-drilldown-submenu-parent')[2]);

      plugin._hideAll();

      html.querySelectorAll('ul[data-submenu].is-active').forEach(function(el) {
        // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
        el.classList.contains('is-closing').should.be.true;
      });
    });
    it('fires close.zf.drilldown event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open one first
      plugin._show(html.querySelectorAll('li.is-drilldown-submenu-parent')[2]);

      FoundationNext.Events.one(html, 'close.zf.drilldown', function() {
        html.querySelectorAll('ul[data-submenu].is-active').forEach(function(el) {
          // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
          el.classList.contains('is-closing').should.be.true;
        });
        done();
      });

      plugin._hideAll();
    });
    it('fires closed.zf.drilldown event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open one first
      plugin._show(html.querySelectorAll('li.is-drilldown-submenu-parent')[2]);

      const submenus = html.querySelectorAll('ul[data-submenu]');

      FoundationNext.Events.one(plugin.$element[0], Foundation.transitionend(plugin.$element[0]), function () {
        FoundationNext.Events.one(html, 'closed.zf.drilldown', function () {
          submenus[0].classList.contains('is-closing').should.be.false;
          submenus[0].classList.contains('is-active').should.be.false;
          done();
        });
      });

      plugin._hideAll();
	    // fake transitionend for console tests
      FoundationNext.Events.triggerHandler(plugin.$element[0], Foundation.transitionend(plugin.$element[0]));
    });
  });

  describe('back()', function() {
    it('hides current submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open one first
      plugin._show(html.querySelectorAll('li.is-drilldown-submenu-parent')[1]);

      FoundationNext.Events.trigger(html.querySelectorAll('li.is-drilldown-submenu-parent')[1].querySelector(':scope > ul').querySelector(':scope > .js-drilldown-back'), 'click');

      // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
      html.querySelectorAll('li.is-drilldown-submenu-parent')[1].querySelector(':scope > ul').classList.contains('is-closing').should.be.true;
    });
    it('shows parent submenu', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open one first
      plugin._show(html.querySelectorAll('li.is-drilldown-submenu-parent')[1]);

      FoundationNext.Events.trigger(html.querySelectorAll('li.is-drilldown-submenu-parent')[1].querySelector(':scope > ul').querySelector(':scope > .js-drilldown-back'), 'click');

      // Checking with .be.hidden is not possible because they don't have display: block but z-index: -1
      html.querySelector('li.is-drilldown-submenu-parent').querySelector(':scope > ul').classList.contains('is-active').should.be.true;
    });
  });

  describe('toggle events', function () {

    var trigger, target, wrapper, togglerPlugin;

    beforeEach(function () {
      html = document.body.appendChild(fixture(templateWithToggler));
      trigger = html.querySelector('#trigger');
      target = html.querySelector('#target');
      target = html.querySelector('#target');

      togglerPlugin = new Foundation.Toggler(target, {});
      plugin = new Foundation.Drilldown(html.querySelector('[data-drilldown]'), { autoHeight: true });

      wrapper = html.querySelector('.is-drilldown');
    });

    it('correctly resize when opened', function () {
      // Open the Drilldown
      trigger.focus();
      $(trigger).trigger('click');

      // 3 items (including the back button) is around 115px height
      wrapper.offsetHeight.should.be.within(110, 120);
    });

    it('correctly resize when closed', function () {
      // Open then close the Drilldown
      trigger.focus();
      $(trigger).trigger('click');
      trigger.focus();
      $(trigger).trigger('click');

      wrapper.offsetHeight.should.be.equal(0);
    });

    it('correctly resize when reopened on a submenu', function () {
      // Open the Drilldown
      trigger.focus();
      $(trigger).trigger('click');
      // Show a submenu with a smaller height
      plugin._showMenu(html.querySelector('#Menu-1A'));
      // Close then reopen the the Drilldown
      trigger.focus();
      $(trigger).trigger('click');
      trigger.focus();
      $(trigger).trigger('click');

      // 2 items (including the back button) is around 75px height
      wrapper.offsetHeight.should.be.within(70, 80);
    });

    afterEach(function () {
      togglerPlugin.destroy();
    });

  });

  describe('keyboard events', function() {
    // Currently not testable, as triggered event won't move on focus
    it.skip('does not trap focus on root element going down', function() {
      html = document.body.appendChild(fixture(template));
      let dummyElement = document.body.appendChild(fixture('<a tabindex="0">Dummy</a>')); // Dummy target to see if focus is not trapped
      plugin = new Foundation.Drilldown(html, {});

      // Focus last element
      dummyElement.focus();
      html.querySelector(':scope > li:last-child > a').dispatchEvent(window.mockKeyboardEvent('TAB'));

      document.activeElement.should.not.be.equal(html.querySelector(':scope > li:last-child > a'));

      dummyElement.remove();
    });
    // Currently not testable, as triggered event won't move on focus
    it.skip('does not trap focus on root element going up', function() {
      let dummyElement = document.body.appendChild(fixture('<a tabindex="0">Dummy</a>')); // Dummy target to see if focus is not trapped
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Focus first element
      dummyElement.focus();
      html.querySelector(':scope > li:first-child > a').dispatchEvent(window.mockKeyboardEvent('TAB', {shift: true}));

      document.activeElement.should.not.be.equal(html.querySelector(':scope > li:first-child > a'));

      dummyElement.remove();
    });
    it('closes current sub menu using ESC', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open it first
      plugin._show(html.querySelector(':scope > li:nth-child(1)'))

      html.querySelector(':scope > li:nth-child(1) > ul > li:first-child > a').focus();

      html.querySelector(':scope > li:nth-child(1) > ul > li:first-child > a').dispatchEvent(window.mockKeyboardEvent('ESCAPE'));

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-closing').should.be.true;
    });
    it('moves focus to next element on ARROW_DOWN', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      html.querySelector(':scope > li:nth-child(1) > a').focus();

      html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

      document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(2) > a'));
    });
    it('moves focus to previous element on ARROW_UP', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      html.querySelector(':scope > li:nth-child(2) > a').focus();

      html.querySelector(':scope > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

      document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > a'));
    });
    it('opens child element on ARROW_RIGHT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      html.querySelector(':scope > li:nth-child(1) > a').focus();

      html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-active').should.be.true;
    });
    it('focuses parent link if parentLink is true', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {parentLink: true});

      html.querySelector(':scope > li:nth-child(1) > a').focus();

      html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      setTimeout(function() { // Timeout to make sure transition has ended
        html.querySelector(':scope > li:nth-child(1) > ul > li[data-is-parent-link] a').should.be.equal(document.activeElement);
        done();
      }, 500);
    });
    it('closes child element on ARROW_LEFT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Drilldown(html, {});

      // Open it first
      plugin._show(html.querySelector(':scope > li:nth-child(1)'))

      html.querySelector(':scope > li:nth-child(1) > ul > li:first-child > a').focus();

      html.querySelector(':scope > li:nth-child(1) > ul > li:first-child > a').dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT'));

      html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('is-closing').should.be.true;
    });
  });
});
