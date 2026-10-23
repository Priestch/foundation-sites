/* jslint mocha: true */
/*global describe, it, before, beforeEach, after, afterEach, $, Foundation */

describe('Abide', function() {
  var plugin;
  var html;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element & plugin options', function() {
      html = document.body.appendChild(fixture('<form data-abide novalidate></form>'));
      plugin = new Foundation.Abide(html, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });

    it('the options are recursively merged', function() {
      html = document.body.appendChild(fixture('<form data-abide novalidate></form>'));

      var options = {
        validators: {
          notEqualTo: function (el, required, parent) {
            const eq = document.getElementById(el.getAttribute('data-equalto'));
            return eq && eq.value !== el.value;
          }
        }
      };

      plugin = new Foundation.Abide(html, options);

      plugin.options.validators.should.includes.keys('equalTo', 'notEqualTo');
    });
  });

  describe('validateForm()', function() {
    it('returns true after validation is disabled', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input required type='text'><input type='submit'></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.disableValidation();
      plugin.validateForm().should.equal(true);
    });

    it('returns false after validation is (re)enabled', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input required type='text'><input type='submit'></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.disableValidation();
      plugin.enableValidation();
      plugin.validateForm().should.equal(false);
    });

    it('returns true if first submit has formnovalidate is disabled', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input required type='text'><input type='submit' formnovalidate></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateForm().should.equal(true);
    });
  });

  describe('validateInput()', function() {
    it('returns true for hidden inputs', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input type='hidden' required></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("input")).should.equal(true);
    });

    it('returns true for inputs with [data-abide-ignore]', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input type='text' required data-abide-ignore></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("input")).should.equal(true);
    });

    it('returns true for checked checkboxes', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input type='checkbox' name='groupName' required checked='checked'></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("input")).should.equal(true);
    });

    it('returns false for unchecked checkboxes', function() {
      html = document.body.appendChild(fixture("<form data-abide novalidate><input type='checkbox' name='groupName' required></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("input")).should.equal(false);
    });

    it('returns true for selected select option', function() {
      html = document.body.appendChild(fixture("<form data-abide><select required><option value=''></option><option value='One'>One</option><option value='Two' selected='selected'>Two</option></select></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("select")).should.equal(true);
      html.querySelector("select").value.should.equal("Two");
    });

    it('returns false for unselected select option', function() {
      html = document.body.appendChild(fixture("<form data-abide><select required><option value=''></option><option value='One'>One</option><option value='Two'>Two</option></select></form>"));
      plugin = new Foundation.Abide(html, {});

      plugin.validateInput(html.querySelector("select")).should.equal(false);
    });
  });

  describe('addErrorClasses()', function() {
    it('adds aria-invalid attribute to element', function() {
      html = document.body.appendChild(fixture('<form data-abide><input type="text"></form>'));
      plugin = new Foundation.Abide(html, {});

      plugin.addErrorClasses(html.querySelector('input'));

      html.querySelector('input').getAttribute('aria-invalid').should.equal('true')
    });
  });

  describe('addGlobalErrorA11yAttributes()', function () {
    it('adds [aria-live] attribute on element', function () {
      html = document.body.appendChild(fixture(`<form data-abide><span data-abide-error></span></form>`));
      plugin = new Foundation.Abide(html, { a11yErrorLevel: 'test-level' });
      plugin.addA11yAttributes(html.querySelector('[data-abide-error]'));

      html.querySelector('[data-abide-error]').getAttribute('aria-live').should.equal('test-level');
    });
  });

  describe('addA11yAttributes()', function () {
    it('adds [aria-describedby] attribute to field and [for] attribute to form error', function() {
      html = document.body.appendChild(fixture(`
        <form data-abide>
          <input type="text" id="test-input">
          <label class="form-error is-visible" id="test-error">Form error</label>
        </form>
      `));
      plugin = new Foundation.Abide(html, {});
      plugin.addA11yAttributes(html.querySelector('input'));

      html.querySelector('input').getAttribute('aria-describedby').should.equal('test-error');
      html.querySelector('label.form-error').getAttribute('for').should.equal('test-input');
    });

    it('does not add [aria-describedby] to the field if the form error is hidden', function() {
      html = document.body.appendChild(fixture(`
        <form data-abide>
          <label for="test-input">Text field</div>
          <input type="text" id="test-input">
          <span class="form-error" id="test-error">Form error</span>
        </form>
      `));
      plugin = new Foundation.Abide(html, {});
      plugin.addA11yAttributes(html.querySelector('input'));

      (html.querySelector('input').getAttribute('aria-describedby') || '').should.not.equal('test-error');
    });

    it('does not add [aria-describedby] to the field if the input is hidden', function() {
      html = document.body.appendChild(fixture(`
        <form data-abide>
          <input type="hidden" id="test-input">
          <span class="form-error is-visible" id="test-error">Form error</span>
        </form>
      `));
      plugin = new Foundation.Abide(html, {});
      plugin.addA11yAttributes(html.querySelector('input'));

      (html.querySelector('input').getAttribute('aria-describedby') || '').should.not.equal('test-error');
    });

    it('adds [aria-describedby] to the field if the form error is shown after a validation error', function() {
      html = document.body.appendChild(fixture(`
        <form data-abide>
          <label for="test-input">Text field</div>
          <input type="text" id="test-input" required>
          <span class="form-error" id="test-error">Form error</span>
        </form>
      `));
      plugin = new Foundation.Abide(html, {});
      plugin.addA11yAttributes(html.querySelector('input'));
      plugin.validateForm();

      html.querySelector('input').getAttribute('aria-describedby').should.equal('test-error');

      // Test also that the aria-described attribute is correctly removed after
      // the error no longer applies and is hidden from the view.
      html.querySelector('input').value = 'text';
      plugin.validateForm();

      (html.querySelector('input').getAttribute('aria-describedby') || '').should.not.equal('test-error');
    });

    it('adds attributes and ids when no id is set', function() {
      html = document.body.appendChild(fixture(`
        <form data-abide>
          <input type="text">
          <label class="form-error is-visible">Form error</label>
        </form>
      `));
      plugin = new Foundation.Abide(html, {});
      plugin.addA11yAttributes(html.querySelector('input'));

      const errorId = html.querySelector('.form-error').getAttribute('id');
      html.querySelector('.form-error').hasAttribute('id').should.be.true.exist;
      html.querySelector('input').getAttribute('aria-describedby').should.equal(errorId);

      const inputId = html.querySelector('input').getAttribute('id');
      html.querySelector('input').hasAttribute('id').should.be.true.exist;
      html.querySelector('.form-error').getAttribute('for').should.equal(inputId);
    });
  });

  describe('removeErrorClasses()', function() {
    it('removes aria-invalid attribute from element', function() {
      html = document.body.appendChild(fixture('<form data-abide><input type="text"></form>'));
      plugin = new Foundation.Abide(html, {});
      // Add error classes first
      plugin.addErrorClasses(html.querySelector('input'));

      plugin.removeErrorClasses(html.querySelector('input'));

      html.querySelector('input').hasAttribute('aria-invalid').should.be.false
    });
  });

  describe('removeRadioErrorClasses()', function() {
    it('removes aria-invalid attribute from radio group', function() {
      html = document.body.appendChild(fixture('<form data-abide><input type="radio" name="groupName"></form>'));
      plugin = new Foundation.Abide(html, {});
      // Add error classes first
      plugin.addErrorClasses(html.querySelector('input'));

      plugin.removeRadioErrorClasses('groupName');

      html.querySelector('input').hasAttribute('aria-invalid').should.be.false
    });
  });

  describe('removeCheckboxErrorClasses()', function() {
    it('removes aria-invalid attribute from checkbox group', function() {
      html = document.body.appendChild(fixture('<form data-abide><input type="checkbox" name="groupName"></form>'));
      plugin = new Foundation.Abide(html, {});
      // Add error classes first
      plugin.addErrorClasses(html.querySelector('input'));

      plugin.removeCheckboxErrorClasses('groupName');

      html.querySelector('input').hasAttribute('aria-invalid').should.be.false
    });
  });

  describe('resetForm()', function() {
    it('removes aria-invalid attribute from elements', function() {
      html = document.body.appendChild(fixture('<form data-abide><input type="text"></form>'));
      plugin = new Foundation.Abide(html, {});
      // Add error classes first
      plugin.addErrorClasses(html.querySelector('input'));

      plugin.resetForm();

      html.querySelector('input').hasAttribute('aria-invalid').should.be.false
    });
  });
});
