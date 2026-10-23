// S12/S14 contract pins (7.0 line A): Abide's field collection, pseudo-selector
// queries, event surface and ARIA/class writes moved to the native
// Events/DOM layer while the public contract stays byte-identical. The
// Dom pseudo-selector stand-ins are pinned element-by-element against the
// jQuery selectors on a fixture form. The options deep merge moved to the
// Dom deepMerge in S14 (jQuery-extend semantics pinned in the deepMerge
// suite); the reset/submit consumers no longer hear jQuery-synthesized
// trigger() calls (their real producers are the browser and this plugin
// itself). These tests pin that contract from the outside; the pre-existing
// abide.js suite is untouched on purpose and stays green.
describe('Abide (native layer contract)', function() {
  var plugin;
  var $html;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) {
      $html.remove();
      $html = null;
    }
  });

  // Blocks the NATIVE form submission that follows an uncancelled submit
  // dispatch (Events.trigger's native-method shortcut calls form.submit()
  // when no handler prevented). Registered after the plugin's own listener,
  // so it still sees the validation outcome first.
  function guardAgainstNavigation(form) {
    var guard = function(e) { e.preventDefault(); };
    form.addEventListener('submit', guard);
    return function() { form.removeEventListener('submit', guard); };
  }

  function docOrder(a, b) {
    return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
  }

  function assertSameElements(a, b) {
    a.length.should.equal(b.length);
    for (var i = 0; i < a.length; i++) {
      a[i].should.equal(b[i]);
    }
  }

  describe('pseudo-selector equivalence (Dom helpers vs jQuery)', function() {
    var fixture = `
      <form id="abide-pseudo-fixture">
        <input type="text" value="text">
        <input value="no-type">
        <input type="hidden">
        <input type="button" value="input-button">
        <input type="submit" value="input-submit">
        <input type="reset" value="input-reset">
        <input type="radio" name="fixture-radios" value="r1">
        <input type="checkbox" name="fixture-checkboxes" value="c1">
        <select><option value=""></option><option value="a">A</option></select>
        <textarea></textarea>
        <button>submit-button</button>
        <button type="button">plain-button</button>
        <button type="reset">reset-button</button>
        <div>not a control</div>
      </form>`;
    var Dom = window.FoundationNext.Dom;

    it('matches jQuery :input with the four form-control tags, in document order', function() {
      $html = $(fixture).appendTo('body');
      var form = $html[0];

      assertSameElements(Dom.formControls(form), $(':input', form).toArray());
    });

    it('matches jQuery :button (any <button>, plus input[type=button])', function() {
      $html = $(fixture).appendTo('body');
      var form = $html[0];

      assertSameElements(Dom.formControls(form).filter(Dom.isButton), $(':button', form).toArray());
    });

    it('matches jQuery :submit and :reset (input/button by .type)', function() {
      $html = $(fixture).appendTo('body');
      var form = $html[0];

      assertSameElements(Dom.formControls(form).filter(Dom.isSubmit), $(':submit', form).toArray());
      assertSameElements(Dom.formControls(form).filter(Dom.isReset), $(':reset', form).toArray());
    });

    it('matches jQuery :hidden and :radio/:checkbox within the control sweep', function() {
      $html = $(fixture).appendTo('body');
      var form = $html[0];

      // `:hidden` is narrowed to input[type=hidden]: its only effect on a
      // rendered form (jQuery's zero-box sense is a PENDING DECISION of the
      // Dom `visible` helper, not of this sweep).
      assertSameElements(
        Array.from(form.querySelectorAll('input[type="hidden"]')),
        $('input:hidden', form).toArray()
      );
      assertSameElements(
        Array.from(form.querySelectorAll('input[type="radio"][name="fixture-radios"]')),
        $(':radio[name="fixture-radios"]', form).toArray()
      );
      assertSameElements(
        Array.from(form.querySelectorAll('input[type="checkbox"][name="fixture-checkboxes"]')),
        $(':checkbox[name="fixture-checkboxes"]', form).toArray()
      );
    });

    it('collects the validated fields like the former find/merge chain', function() {
      $html = $(fixture).appendTo('body');
      plugin = new Foundation.Abide($html, {});

      var expected = $html.find('input').not('[type="submit"]').add($html.find('textarea, select')).toArray().sort(docOrder);
      assertSameElements(plugin.inputs.slice().sort(docOrder), expected);
    });
  });

  describe('field validation (native events)', function() {
    it('validates on a real change event and marks the field through classList and attributes', function() {
      $html = $('<form data-abide novalidate><input type="text" required></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var input = $html.find('input')[0];
      var invalidSpy = sinon.spy();
      FoundationNext.Events.on(input, 'invalid.zf.abide', invalidSpy);

      input.dispatchEvent(new Event('change', {bubbles: true}));

      sinon.assert.calledOnce(invalidSpy);
      invalidSpy.firstCall.args[0].namespace.should.equal('abide.zf');
      invalidSpy.firstCall.args[1][0].should.equal(input);
      input.classList.contains('is-invalid-input').should.be.true;
      input.hasAttribute('data-invalid').should.be.true;
      input.getAttribute('aria-invalid').should.equal('true');
    });

    it('clears the error state and fires valid.zf.abide once the value passes', function() {
      $html = $('<form data-abide novalidate><input type="text" required></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var input = $html.find('input')[0];
      var validSpy = sinon.spy();
      FoundationNext.Events.on(input, 'valid.zf.abide', validSpy);

      input.dispatchEvent(new Event('change', {bubbles: true}));
      input.value = 'something';
      input.dispatchEvent(new Event('change', {bubbles: true}));

      sinon.assert.calledOnce(validSpy);
      input.classList.contains('is-invalid-input').should.be.false;
      input.hasAttribute('data-invalid').should.be.false;
      input.hasAttribute('aria-invalid').should.be.false;
    });

    it('validates on real input events with liveValidate and on real blur events with validateOnBlur', function() {
      $html = $('<form data-abide novalidate><input type="text" required></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {liveValidate: true, validateOnBlur: true});
      var input = $html.find('input')[0];
      var invalidSpy = sinon.spy();
      var validSpy = sinon.spy();
      FoundationNext.Events.on(input, 'invalid.zf.abide', invalidSpy);
      FoundationNext.Events.on(input, 'valid.zf.abide', validSpy);

      // liveValidate: an empty value on a real input event fails the check
      input.dispatchEvent(new Event('input', {bubbles: true}));
      sinon.assert.calledOnce(invalidSpy);
      sinon.assert.notCalled(validSpy);

      // validateOnBlur: a filled value on a real blur event passes it
      input.value = 'filled';
      input.dispatchEvent(new Event('blur'));
      sinon.assert.calledOnce(validSpy);
      sinon.assert.calledOnce(invalidSpy);
    });

    it('skips ignored, hidden and disabled fields', function() {
      $html = $('<form data-abide novalidate>' +
        '<input type="text" required data-abide-ignore>' +
        '<input type="text" required disabled>' +
        '</form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var ignored = $html.find('[data-abide-ignore]')[0];
      var disabled = $html.find('[disabled]')[0];

      plugin.validateInput($(ignored)).should.be.true;
      plugin.validateInput($(disabled)).should.be.true;
      ignored.classList.contains('is-invalid-input').should.be.false;
      disabled.classList.contains('is-invalid-input').should.be.false;
    });

    it('runs custom validators with the jQuery collection, required flag and parent', function() {
      var calls = [];
      $html = $('<form data-abide novalidate><input type="text" required data-validator="yes"></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {
        validators: {
          yes: function(el, required, parent) {
            calls.push([el, required, parent]);
            return false;
          }
        }
      });
      var input = $html.find('input')[0];

      input.dispatchEvent(new Event('change', {bubbles: true}));

      calls.length.should.equal(1);
      calls[0][0][0].should.equal(input);
      calls[0][1].should.be.true;
      calls[0][2][0].should.equal(input.parentNode);
      // the failed validator name lands in the error targeting
      $html.find('input').should.have.attr('aria-invalid', 'true');
    });
  });

  describe('form validation (native events)', function() {
    it('fires forminvalid on a real submit and cancels the native submission', function() {
      $html = $('<form data-abide novalidate><input type="text" required><input type="submit"></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var form = $html[0];
      var invalidSpy = sinon.spy();
      FoundationNext.Events.on(form, 'forminvalid.zf.abide', invalidSpy);

      var event = new Event('submit', {bubbles: true, cancelable: true});
      form.dispatchEvent(event);

      sinon.assert.calledOnce(invalidSpy);
      invalidSpy.firstCall.args[1][0].should.equal(form);
      event.defaultPrevented.should.be.true;
      form.querySelector('input[type="text"]').classList.contains('is-invalid-input').should.be.true;
    });

    it('fires formvalid on a valid submit, hides the global error and lets the submission proceed', function() {
      $html = $('<form data-abide novalidate>' +
        '<input type="text" required value="filled">' +
        '<span data-abide-error>global error</span>' +
        '</form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var form = $html[0];
      var releaseGuard = guardAgainstNavigation(form);
      var validSpy = sinon.spy();
      var jQuerySpy = sinon.spy();
      FoundationNext.Events.on(form, 'formvalid.zf.abide', validSpy);
      $html.on('formvalid.zf.abide', jQuerySpy);

      var event = new Event('submit', {bubbles: true, cancelable: true});
      form.dispatchEvent(event);
      releaseGuard();

      sinon.assert.calledOnce(validSpy);
      sinon.assert.calledOnce(jQuerySpy);
      jQuerySpy.firstCall.args[0].type.should.equal('formvalid');
      form.querySelector('[data-abide-error]').style.display.should.equal('none');
      releaseGuard();
    });

    it('shows the global error block when the form is invalid', function() {
      $html = $('<form data-abide novalidate>' +
        '<input type="text" required>' +
        '<span data-abide-error>global error</span>' +
        '</form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});

      plugin.validateForm();

      $html.find('[data-abide-error]')[0].style.display.should.equal('block');
      $html.find('[data-abide-error]').should.have.attr('aria-live', 'assertive');
    });
  });

  describe('submit buttons (native events)', function() {
    it('runs the validation from a real click and keeps the click prevented', function() {
      $html = $('<form data-abide novalidate><input type="text" required><input type="submit"></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var invalidSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'forminvalid.zf.abide', invalidSpy);
      var button = $html.find('input[type="submit"]')[0];

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      button.dispatchEvent(click);

      click.defaultPrevented.should.be.true;
      sinon.assert.calledOnce(invalidSpy);
    });

    it('skips the validation for a formnovalidate submit button', function() {
      $html = $('<form data-abide novalidate><input type="text" required><input type="submit" formnovalidate></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var releaseGuard = guardAgainstNavigation($html[0]);
      var invalidSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'forminvalid.zf.abide', invalidSpy);
      var button = $html.find('input[type="submit"]')[0];

      var click = new MouseEvent('click', {bubbles: true, cancelable: true});
      button.dispatchEvent(click);
      releaseGuard();

      click.defaultPrevented.should.be.true;
      sinon.assert.notCalled(invalidSpy);
      (plugin.formnovalidate === null).should.be.true;
      $html.find('input[type="text"]').should.not.have.class('is-invalid-input');
    });

    it('runs the validation from a real Enter keydown on the submit button', function() {
      $html = $('<form data-abide novalidate><input type="text" required><input type="submit"></form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var invalidSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'forminvalid.zf.abide', invalidSpy);
      var button = $html.find('input[type="submit"]')[0];

      button.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

      sinon.assert.calledOnce(invalidSpy);
    });
  });

  describe('reset (native event)', function() {
    it('resets the fields through a real reset event and fires formreset.zf.abide', function() {
      $html = $('<form data-abide novalidate>' +
        '<input type="text" required value="keep-out">' +
        '<input type="radio" name="r" checked>' +
        '<input type="checkbox" name="c" checked>' +
        '<button type="button" value="keep-me">plain</button>' +
        '</form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var form = $html[0];
      var text = form.querySelector('input[type="text"]');
      var radio = form.querySelector('input[type="radio"]');
      var checkbox = form.querySelector('input[type="checkbox"]');
      var button = form.querySelector('button');
      plugin.addErrorClasses($(text));
      text.classList.contains('is-invalid-input').should.be.true;

      var resetSpy = sinon.spy();
      FoundationNext.Events.on(form, 'formreset.zf.abide', resetSpy);
      form.dispatchEvent(new Event('reset'));

      sinon.assert.calledOnce(resetSpy);
      text.value.should.equal('');
      text.classList.contains('is-invalid-input').should.be.false;
      text.hasAttribute('aria-invalid').should.be.false;
      radio.checked.should.be.false;
      checkbox.checked.should.be.false;
      button.value.should.equal('keep-me');
    });
  });

  describe('ARIA (native attribute writes)', function() {
    it('describes the field and marks the errors on init', function() {
      $html = $(`
        <form data-abide novalidate>
          <input type="text" id="native-input">
          <label class="form-error is-visible" id="native-error">Error</label>
        </form>`).appendTo('body');
      plugin = new Foundation.Abide($html, {});

      $html.find('input').should.have.attr('aria-describedby', 'native-error');
      $html.find('#native-error').should.have.attr('role', 'alert');
      $html.find('#native-error').should.have.attr('for', 'native-input');
    });

    it('drops the aria-describedby flag with the error state', function() {
      $html = $(`
        <form data-abide novalidate>
          <input type="text" required>
          <label class="form-error is-visible">Error</label>
        </form>`).appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var input = $html.find('input')[0];

      plugin.validateInput($(input));
      input.hasAttribute('aria-describedby').should.be.true;

      input.value = 'now valid';
      plugin.validateInput($(input));
      input.hasAttribute('aria-describedby').should.be.false;
    });
  });

  describe('destroy', function() {
    it('drops the native listeners and clears the error state', function() {
      $html = $('<form data-abide novalidate>' +
        '<input type="text" required>' +
        '<span data-abide-error style="display: block">global error</span>' +
        '</form>').appendTo('body');
      plugin = new Foundation.Abide($html, {});
      var input = $html.find('input')[0];
      plugin.validateInput($(input));
      input.classList.contains('is-invalid-input').should.be.true;
      plugin.destroy();
      plugin = null;

      $html.find('[data-abide-error]')[0].style.display.should.equal('none');
      input.classList.contains('is-invalid-input').should.be.false;

      // a real change must find nothing
      input.value = '';
      input.dispatchEvent(new Event('change', {bubbles: true}));
      input.classList.contains('is-invalid-input').should.be.false;
      input.hasAttribute('aria-invalid').should.be.false;
    });
  });
});
