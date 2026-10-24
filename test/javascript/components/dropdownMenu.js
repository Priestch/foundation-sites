describe('Dropdown Menu', function () {
  var plugin;
  var html;
  var template = `<ul class="dropdown menu" data-dropdown-menu>
    <li>
      <a href="#Item-1">Item 1</a>
      <ul class="menu">
      <li><a href="#Item-1A">Item 1A</a></li>
      <li>
        <a href="#Item-1B">Item 1B</a>
        <ul class="menu">
        <li><a href="#Item-1Bi">Item 1B i</a></li>
        <li><a href="#Item-1Bii">Item 1B ii</a></li>
        <li>
          <a href="#Item-1Biii">Item 1B iii</a>
          <ul class="menu">
          <li><a href="#Item-1Biiialpha">Item 1B iii alpha</a></li>
          <li><a href="#Item-1Biiiomega">Item 1B iii omega</a></li>
          </ul>
        </li>
        <li>
          <a href="#Item-1Biv">Item 1B iv</a>
          <ul class="menu">
          <li><a href="#Item-1Bivalpha">Item 1B iv alpha</a></li>
          </ul>
        </li>
        </ul>
      </li>
      <li><a href="#Item-1C">Item 1C</a></li>
      </ul>
    </li>
    <li>
      <a href="#Item-2">Item 2</a>
      <ul class="menu">
      <li><a href="#Item-2A">Item 2A</a></li>
      <li><a href="#Item-2B">Item 2B</a></li>
      </ul>
    </li>
    <li><a href="#Item-3">Item 3</a></li>
    <li><a href="#Item-4">Item 4</a></li>
  </ul>`;

  afterEach(function () {
    plugin.destroy();
    document.activeElement.blur();
    html.remove();
  });

  describe('constructor()', function () {
    it('stores the element and plugin options', function () {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.DropdownMenu(html, {});

      chai.expect(plugin.$element).to.be.an.instanceof(Element);
      plugin.options.should.be.an('object');
    });
  });

  /*
  ** Note: for all the following tests testing the currently focused elements,
  ** IE 9/10/11 may not focus the tested element because is is still rendering.
  ** To prevent this, we wait after the component initialization.
  **
  ** Fixing this IE behavior in components would require to delay the focus
  ** for all browsers then trigger a "ready" event.
  **
  ** TODO: Consider this for v6.6
  **
  ** See https://stackoverflow.com/a/2600261/4317384
  ** See https://stackoverflow.com/a/36032615/4317384
  */
  const IErenderWaitTime = 100;

  describe('keyboard events', function () {

    it('closes current sub menu using ESCAPE', function (done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.DropdownMenu(html, {});

      setTimeout(() => {
        // Open it first
        plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a').focus();

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ESCAPE'));

        html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.false;
        html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('js-dropdown-active').should.be.false;
        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > a'));
        done();
      }, IErenderWaitTime);
    });

    describe('horizontal', function() {
      beforeEach(function(done) {
        html = document.body.appendChild(fixture(template));
        plugin = new Foundation.DropdownMenu(html, {});
        setTimeout(() => done(), IErenderWaitTime);
      });

      it('moves focus to next tab on ARROW_RIGHT', function () {
          html.querySelector(':scope > li:nth-child(1) > a').focus();
          html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

          document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(2) > a'));
      });

      it('moves focus to previous tab on ARROW_LEFT', function () {
        html.querySelector(':scope > li:nth-child(2) > a').focus();
        html.querySelector(':scope > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT'));

        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > a'));
      });

      it('opens child element of tab on ARROW_DOWN', function() {
        html.querySelector(':scope > li:nth-child(1) > a').focus();
        html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

        html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
        html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('js-dropdown-active').should.be.true;
        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a'));
      });

      it('moves focus to previous sub element on ARROW_UP', function () {
        // Open it first
        plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').focus();

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a'));
      });

      it('opens child element of sub menu on ARROW_RIGHT', function() {
        // Open it first
        plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').focus();

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2)').classList.contains('is-active').should.be.true;
        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > ul').classList.contains('js-dropdown-active').should.be.true;
        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > ul > li:nth-child(1) > a'));
      });

    });

    describe('vertical', function () {

      beforeEach(function(done) {
        html = document.body.appendChild(fixture(template));
      html.classList.add('vertical');
        plugin = new Foundation.DropdownMenu(html, {});
        setTimeout(() => done(), IErenderWaitTime);
      });

      it('moves focus to next tab on ARROW_DOWN', function () {
        html.querySelector(':scope > li:nth-child(1) > a').focus();
        html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(2) > a'));
      });

      it('moves focus to previous tab on ARROW_UP', function () {
        html.querySelector(':scope > li:nth-child(2) > a').focus();
        html.querySelector(':scope > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > a'));
      });

      it('opens child element of tab on ARROW_RIGHT', function() {
        html.querySelector(':scope > li:nth-child(1) > a').focus();
        html.querySelector(':scope > li:nth-child(1) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

        html.querySelector(':scope > li:nth-child(1)').classList.contains('is-active').should.be.true;
        html.querySelector(':scope > li:nth-child(1) > ul').classList.contains('js-dropdown-active').should.be.true;
        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a'));
      });

      it('moves focus to previous sub element on ARROW_UP', function () {
        // Open it first
        plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').focus();

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(1) > a'));
      });

      it('opens child element of sub menu on ARROW_RIGHT', function() {
        // Open it first
        plugin._show(html.querySelector(':scope > li:nth-child(1) > ul'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').focus();

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > a').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2)').classList.contains('is-active').should.be.true;
        html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > ul').classList.contains('js-dropdown-active').should.be.true;
        document.activeElement.should.be.equal(html.querySelector(':scope > li:nth-child(1) > ul > li:nth-child(2) > ul > li:nth-child(1) > a'));
      });

    });

  });

});
