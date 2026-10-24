describe('Dropdown', function() {
  let plugin;
  let dropdownController;
  let dropdownContainer;

  const getDropdownController = (buttonClasses = '') =>
    `<button class="${buttonClasses}" type="button" data-toggle="my-dropdown">toggle</button>`;
  const getDropdownContainer = (dropdownClasses = '') =>
    `<div class="${dropdownClasses}" data-dropdown id="my-dropdown">Dropdown</div>`;
  const getFocusableDropdownContainer = (dropdownClasses = '', inputId = '') =>
    `<div class="${dropdownClasses}" data-dropdown id="my-dropdown">Dropdown${getFocusableInput(inputId)}</div>`;

  const getFocusableInput = (inputId = '') =>
    `<input type="text" placeholder="should auto focus" id="${inputId}" />`;
  const getAutoFocusDropdownContainer = (dropdownClasses = '', inputId = '') =>
    `<div class="${dropdownClasses}" data-dropdown data-auto-focus="true" id="my-dropdown">Dropdown${getFocusableInput(inputId)}</div>`;

  afterEach(function() {
    plugin.destroy();
    document.activeElement.blur();
    dropdownController.remove();
    dropdownContainer.remove();
  });

  describe('constructor()', function() {
    it('stores the element & plugin options', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('open()', function () {
    it('fires show.zf.dropdown event', function () {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      let spy = sinon.spy();
      FoundationNext.Events.on(dropdownContainer, 'show.zf.dropdown', spy);

      plugin.open();

      sinon.assert.called(spy);
    });

    it('make the dropdown visible', function (done) {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      FoundationNext.Events.on(dropdownContainer, 'show.zf.dropdown', function () {
        FoundationNext.Dom.visible(document.querySelector('#my-dropdown')).should.be.true;
        document.querySelector('#my-dropdown').getAttribute('aria-hidden').should.equal('false');
        document.querySelector('#my-dropdown').classList.contains('is-open').should.be.true;
        done();
      });
      plugin.open();
    });

    it('traps focus accoding to trapFocus option', function () {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, { trapFocus: true });

      let spy = sinon.spy(Foundation.Keyboard, 'trapFocus');
      plugin.open();

      sinon.assert.called(spy);
      Foundation.Keyboard.trapFocus.restore();
    });

    it('should autofocus according to autoFocus option', function(done) {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getAutoFocusDropdownContainer('', 'inputToFocus')));
      plugin = new Foundation.Dropdown(dropdownContainer, { autoFocus: true });

      FoundationNext.Events.on(dropdownContainer, 'show.zf.dropdown', function() {
        document.activeElement.id.should.be.equal('inputToFocus');
        done();
      });
      plugin.open();
    });
  });

  describe('close()', function() {
    it('releases focus if trapFocus option is true', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {trapFocus: true});

      // Open it first...
      plugin.open();

      let spy = sinon.spy(Foundation.Keyboard, 'releaseFocus');
      plugin.close();

      sinon.assert.called(spy);
      Foundation.Keyboard.releaseFocus.restore();
    });
  });

  describe('inferred positioning', function() {
    it('default orientation should be bottom', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      plugin.open()
      plugin.position.should.equal('bottom');
    });

    it('gets right alignment from float-right', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController('custom-style-before float-right custom-style-after')));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      plugin.open()
      plugin.position.should.equal('bottom')
      plugin.alignment.should.equal('right')
    });
  });

  describe('closeOnClick option', function() {
    it('not closes a dropdown by clicking on the dropdown if closeOnClick option is true', function(done) {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {closeOnClick: true});

      // Open it first...
      plugin.open();

      let spy = sinon.spy(plugin, 'close');
      FoundationNext.Events.trigger(plugin.$element[0], "click");

      setTimeout(() => {
        sinon.assert.notCalled(spy);
        done();
      }, 0);
    });
  });

  describe('mouse events', function() {
    it('opens the dropdown on button click', function(done) {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});

      let spy = sinon.spy(plugin, 'open');
      FoundationNext.Events.trigger(dropdownController, 'click');

      setTimeout(() => {
        sinon.assert.called(spy);
        done();
      }, 0);
    });

    it('opens the dropdown on button hover', function(done) {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, { hover: true, hoverDelay: 42 });

      let spy = sinon.spy(plugin, 'open');
      FoundationNext.Events.trigger(dropdownController, 'mouseover');

      setTimeout(() => {
        sinon.assert.called(spy);
        done();
      }, 42);
    });

  });

  describe('keyboard events', function () {
    it('opens Dropdown on SPACE', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});
      dropdownController.focus();
      dropdownController.dispatchEvent(window.mockKeyboardEvent('SPACE'));

      FoundationNext.Dom.visible(dropdownContainer).should.be.true;
    });
    it('does not focus Dropdown on SPACE by default', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});
      dropdownController.focus();
      dropdownController.dispatchEvent(window.mockKeyboardEvent('SPACE'));

      document.activeElement.should.be.equal(dropdownController);
    });
    it('focuses Dropdown on SPACE when container has a focusable element', function() {
      dropdownController = document.body.appendChild(fixture(getDropdownController()));
      dropdownContainer = document.body.appendChild(fixture(getFocusableDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});
      dropdownController.focus();
      dropdownController.dispatchEvent(window.mockKeyboardEvent('SPACE'));

      document.activeElement.should.be.equal(dropdownController);
    });
    it('does not focus Dropdown when anchor is an input', function() {
      dropdownController = document.body.appendChild(fixture('<input type="text" data-toggle="my-dropdown">'));
      dropdownContainer = document.body.appendChild(fixture(getDropdownContainer()));
      plugin = new Foundation.Dropdown(dropdownContainer, {});
      dropdownController.focus();
      dropdownController.dispatchEvent(window.mockKeyboardEvent('SPACE'));

      document.activeElement.should.be.equal(dropdownController);
    });
  })
});
