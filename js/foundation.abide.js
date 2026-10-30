import { Plugin } from './foundation.core.plugin';
import { GetYoDigits } from './foundation.core.utils';
import { Events } from './foundation.util.events';
import { visible, formControls, isButton, isSubmit, isReset, isRadio, isCheckbox, deepMerge, datasetOptions } from './foundation.util.dom';

/**
 * Abide module.
 * @module foundation.abide
 */

// jQuery `.data('abide-describedby')` stand-in (7.0 line A, S12): a module
// side channel like jQuery's data store - the 6.x flag never surfaced in the
// DOM either.
const describedBy = new WeakSet();

// jQuery collection / element / array acceptance for the public $el-shaped
// parameters (core.utils toElement shape, kept local until that helper is
// exported). A node is recognized by nodeType and never unwrapped: native
// array-likes like HTMLSelectElement expose their first option as [0].
function toEl(obj) {
  return obj && obj.nodeType === undefined && obj[0] !== undefined ? obj[0] : obj;
}

function toEls(obj) {
  if (obj && obj.nodeType === undefined && obj[0] !== undefined) { return Array.from(obj); }
  return obj ? [obj] : [];
}

// jQuery addClass/removeClass equivalents: the option classes may carry
// several whitespace-separated names.
function addClasses(el, names) {
  names.split(/\s+/).forEach(name => {
    if (name) { el.classList.add(name); }
  });
}

function removeClasses(el, names) {
  names.split(/\s+/).forEach(name => {
    if (name) { el.classList.remove(name); }
  });
}

class Abide extends Plugin {
  /**
   * Creates a new instance of Abide.
   * @class
   * @name Abide
   * @fires Abide#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options = {}) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    // Native deep merge (7.0 line A, S14): the Dom deepMerge mirrors jQuery's
    // `$.extend(true)` semantics (array index merge, null overwrite,
    // reference assignment for functions/RegExps - the validator functions
    // and RegExp patterns above survive the merge by reference). Pinned
    // against jQuery in the deepMerge equivalence suite.
    this.options = deepMerge({}, Abide.defaults, datasetOptions(this.$element), options);
    this.isEnabled = true;
    this.formnovalidate = null;

    this.className = 'Abide'; // ie9 back compat
    this._init();
  }

  /**
   * Initializes the Abide plugin and calls functions to get Abide functioning on load.
   * @private
   */
  _init() {
    const form = this.$element;
    // Native field sweep (7.0 line A, S12): every input except the submit
    // ones, plus the textareas and selects. The former two-find + $.merge
    // grouped the set by tag; the flat document order changes nothing about
    // which fields are validated (fields are validated independently,
    // checkbox groups are deduped by name while iterating).
    this.inputs = Array.from(form.querySelectorAll('input:not([type="submit"]), textarea, select'));
    this.submits = Array.from(form.querySelectorAll('[type="submit"]'));
    const globalErrors = Array.from(form.querySelectorAll('[data-abide-error]'));

    // Add a11y attributes to all fields
    if (this.options.a11yAttributes) {
      this.inputs.forEach(input => this.addA11yAttributes(input));
      globalErrors.forEach(error => this.addGlobalErrorA11yAttributes(error));
    }

    this._events();
  }

  /**
   * Initializes events for Abide.
   * @private
   */
  _events() {
    const form = this.$element;

    // S12: the form-level and per-field consumers flip to the native event
    // layer. Their producers are the real DOM reset/submit/change/input/
    // blur events (which reach both listener layers during the mixed state)
    // and this plugin's own native triggers, so every seam here closes on
    // the consumer side alone.
    Events.off(form, '.abide');
    Events.on(form, 'reset.zf.abide', () => {
      this.resetForm();
    });
    Events.on(form, 'submit.zf.abide', () => {
      return this.validateForm();
    });

    this.submits.forEach(submit => {
      Events.off(submit, 'click.zf.abide keydown.zf.abide');
      Events.on(submit, 'click.zf.abide keydown.zf.abide', (e) => {
        if (!e.key || (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          this.formnovalidate = e.target.getAttribute('formnovalidate') !== null;
          this._submitForm();
        }
      });
    });

    if (this.options.validateOn === 'fieldChange') {
      this.inputs.forEach(input => {
        Events.off(input, 'change.zf.abide');
        Events.on(input, 'change.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }

    if (this.options.liveValidate) {
      this.inputs.forEach(input => {
        Events.off(input, 'input.zf.abide');
        Events.on(input, 'input.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }

    if (this.options.validateOnBlur) {
      this.inputs.forEach(input => {
        Events.off(input, 'blur.zf.abide');
        Events.on(input, 'blur.zf.abide', (e) => {
          this.validateInput(e.target);
        });
      });
    }
  }

  /**
   * Formerly `this.$element.submit()` (7.0 line A, S12): jQuery's synthetic
   * submit trigger ran the submit handlers and handed over to the native
   * form.submit() only when no handler cancelled - Events.trigger implements
   * exactly that shape. The native submit() fires no submit event of its
   * own, so nothing recurses.
   * @private
   */
  _submitForm() {
    Events.trigger(this.$element, 'submit');
  }

  /**
   * Calls necessary functions to update Abide upon DOM change
   * @private
   */
  _reflow() {
    this._init();
  }

  /**
   * Checks whether the submitted form should be validated or not, consodering formnovalidate and isEnabled
   * @returns {Boolean}
   * @private
   */
  _validationIsDisabled() {
    if (this.isEnabled === false) { // whole validation disabled
      return true;
    } else if (typeof this.formnovalidate === 'boolean') { // triggered by $submit
      return this.formnovalidate;
    }
    // triggered by Enter in non-submit input
    return this.submits.length ? this.submits[0].getAttribute('formnovalidate') !== null : false;
  }

  /**
   * Enables the whole validation
   */
  enableValidation() {
    this.isEnabled = true;
  }

  /**
   * Disables the whole validation
   */
  disableValidation() {
    this.isEnabled = false;
  }

  /**
   * Checks whether or not a form element has the required attribute and if it's checked or not
   * @param {Object} element - jQuery object to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  requiredCheck($el) {
    const el = toEl($el);
    if (!el.hasAttribute('required')) return true;

    var isGood = true;

    switch (el.type) {
      case 'checkbox':
        isGood = el.checked;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        var opt = el.querySelectorAll('option:checked');
        if (!opt.length || !opt[0].value) isGood = false;
        break;

      default:
        if (!el.value || !el.value.length) isGood = false;
    }

    return isGood;
  }

  /**
   * Get:
   * - Based on $el, the first element(s) corresponding to `formErrorSelector` in this order:
   *   1. The element's direct sibling('s).
   *   2. The element's parent's children.
   * - Element(s) with the attribute `[data-form-error-for]` set with the element's id.
   *
   * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
   *
   * @param {Object} $el - jQuery object to use as reference to find the form error selector.
   * @param {String[]} [failedValidators] - List of failed validators.
   * @returns {Object} jQuery object with the selector.
   */
  findFormError($el, failedValidators) {
    const els = toEls($el);
    const id = els.length ? els[0].id : '';
    const form = this.$element;
    let errors = [];
    const addUnique = (candidates) => {
      candidates.forEach(candidate => {
        if (candidate && errors.indexOf(candidate) === -1) { errors.push(candidate); }
      });
    };

    // 1. The direct siblings matching the selector (jQuery unions the
    // per-element sibling lists of the whole collection, in order).
    els.forEach(el => {
      addUnique(Array.from(el.parentNode.children).filter(child => child !== el && child.matches(this.options.formErrorSelector)));
    });

    // 2. The parent's matching children, when no sibling matched.
    if (!errors.length) {
      els.forEach(el => {
        addUnique(Array.from(el.parentNode.querySelectorAll(this.options.formErrorSelector)));
      });
    }

    if (id) {
      addUnique(Array.from(form.querySelectorAll(`[data-form-error-for="${id}"]`)));
    }

    if (!!failedValidators) {
      errors = errors.filter(error => !error.hasAttribute('data-form-error-on'));

      failedValidators.forEach(v => {
        els.forEach(el => {
          addUnique(Array.from(el.parentNode.children).filter(child => child !== el && child.matches(`[data-form-error-on="${v}"]`)));
        });
        addUnique(Array.from(form.querySelectorAll(`[data-form-error-for="${id}"][data-form-error-on="${v}"]`)));
      });
    }

    // 7.0 terminal form: the plain element array (the mixed state wrapped it)
    return errors;
  }

  /**
   * Get the first element in this order:
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the label.
   */
  findLabel($el) {
    const el = toEl($el);
    const label = this.$element.querySelector(`label[for="${el.id}"]`);

    // 7.0 terminal form: the label elements as an array (empty when absent)
    if (!label) {
      const closest = el.closest('label');
      return closest ? [closest] : [];
    }
    return [label];
  }

  /**
   * Get the set of labels associated with a set of radio els in this order
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the labels.
   */
  findRadioLabels($els) {
    return this._labelsForGroup($els);
  }

  /**
   * Get the set of labels associated with a set of checkbox els in this order
   * 2. The <label> with the attribute `[for="someInputId"]`
   * 3. The `.closest()` <label>
   *
   * @param {Object} $el - jQuery object to check for required attribute
   * @returns {Object} jQuery object with the labels.
   */
  findCheckboxLabels($els) {
    return this._labelsForGroup($els);
  }

  _labelsForGroup($els) {
    const labels = [];
    toEls($els).forEach(el => {
      let label = el.id ? this.$element.querySelector(`label[for="${el.id}"]`) : null;

      if (!label) {
        label = el.closest('label');
      }
      if (label) {
        labels.push(label);
      }
    });

    return labels;
  }

  /**
   * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
   * @param {Object} $el - jQuery object to add the class to
   * @param {String[]} [failedValidators] - List of failed validators.
   */
  addErrorClasses($el, failedValidators) {
    const el = toEl($el);
    const $label = this.findLabel($el);
    const $formError = this.findFormError($el, failedValidators);

    $label.forEach(label => addClasses(label, this.options.labelErrorClass));

    $formError.forEach(error => addClasses(error, this.options.formErrorClass));

    addClasses(el, this.options.inputErrorClass);
    el.setAttribute('data-invalid', '');
    el.setAttribute('aria-invalid', 'true');

    if ($formError.some(visible)) {
      this.addA11yErrorDescribe($el, $formError);
    }
  }

  /**
   * Adds [for] and [role=alert] attributes to all form error targetting $el,
   * and [aria-describedby] attribute to $el toward the first form error.
   * @param {Object} $el - jQuery object
   */
  addA11yAttributes($el) {
    const el = toEl($el);
    const errors = this.findFormError($el);
    const labels = errors.filter(error => error.matches('label'));
    if (!errors.length) return;

    // The former `:visible` filter, narrowed to the display rule (Dom's
    // `visible` - see the PENDING DECISION note there).
    const firstError = errors.find(visible);
    if (firstError) {
      this.addA11yErrorDescribe($el, firstError);
    }

    if (labels.filter(label => label.hasAttribute('for')).length < labels.length) {
      // Get the input ID or create one
      let elemId = el.getAttribute('id');
      if (elemId == null) {
        elemId = GetYoDigits(6, 'abide-input');
        el.setAttribute('id', elemId);
      }

      // For each label targeting $el, set [for] if it is not set.
      labels.forEach(label => {
        if (!label.hasAttribute('for')) {
          label.setAttribute('for', elemId);
        }
      });
    }

    // For each error targeting $el, set [role=alert] if it is not set.
    errors.forEach(error => {
      if (!error.hasAttribute('role')) {
        error.setAttribute('role', 'alert');
      }
    });
  }

  addA11yErrorDescribe($el, $error) {
    const el = toEl($el);
    const error = toEl($error);
    if (el.getAttribute('type') === 'hidden') return;
    if (el.hasAttribute('aria-describedby')) return;

    // Set [aria-describedby] on the input toward the first form error if it is not set
    // Get the first error ID or create one
    let errorId = error.getAttribute('id');
    if (errorId == null) {
      errorId = GetYoDigits(6, 'abide-error');
      error.setAttribute('id', errorId);
    }

    el.setAttribute('aria-describedby', errorId);
    describedBy.add(el);
  }

  /**
   * Adds [aria-live] attribute to the given global form error $el.
   * @param {Object} $el - jQuery object to add the attribute to
   */
  addGlobalErrorA11yAttributes($el) {
    const el = toEl($el);
    if (!el.hasAttribute('aria-live')) {
      el.setAttribute('aria-live', this.options.a11yErrorLevel);
    }
  }

  /**
   * Remove CSS error classes etc from an entire radio button group
   * @param {String} groupName - A string that specifies the name of a radio button group
   *
   */
  removeRadioErrorClasses(groupName) {
    const $els = this._groupEls('radio', groupName);
    const $labels = this.findRadioLabels($els);
    const $formErrors = this.findFormError($els);

    $labels.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formErrors.forEach(error => removeClasses(error, this.options.formErrorClass));

    $els.forEach(el => {
      removeClasses(el, this.options.inputErrorClass);
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

  }

  /**
   * Remove CSS error classes etc from an entire checkbox group
   * @param {String} groupName - A string that specifies the name of a checkbox group
   *
   */
  removeCheckboxErrorClasses(groupName) {
    const $els = this._groupEls('checkbox', groupName);
    const $labels = this.findCheckboxLabels($els);
    const $formErrors = this.findFormError($els);

    $labels.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formErrors.forEach(error => removeClasses(error, this.options.formErrorClass));

    $els.forEach(el => {
      removeClasses(el, this.options.inputErrorClass);
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

  }

  // Native stand-in for the former `:radio/:checkbox` group queries (7.0
  // line A, S12): `input[type="..."][name="..."]`, the exact
  // createInputPseudo set.
  _groupEls(type, groupName) {
    return Array.from(this.$element.querySelectorAll(`input[type="${type}"][name="${groupName}"]`));
  }

  /**
   * Removes CSS error class as specified by the Abide settings from the label, input, and the form
   * @param {Object} $el - jQuery object to remove the class from
   */
  removeErrorClasses($el) {
    const el = toEl($el);
    // radios need to clear all of the els
    if (el.type === 'radio') {
      return this.removeRadioErrorClasses(el.getAttribute('name'));
    }
    // checkboxes need to clear all of the els
    else if (el.type === 'checkbox') {
      return this.removeCheckboxErrorClasses(el.getAttribute('name'));
    }

    const $label = this.findLabel($el);
    const $formError = this.findFormError($el);

    $label.forEach(label => removeClasses(label, this.options.labelErrorClass));

    $formError.forEach(error => removeClasses(error, this.options.formErrorClass));

    removeClasses(el, this.options.inputErrorClass);
    el.removeAttribute('data-invalid');
    el.removeAttribute('aria-invalid');

    if (describedBy.has(el)) {
      el.removeAttribute('aria-describedby');
      describedBy.delete(el);
    }
  }

  /**
   * Goes through a form to find inputs and proceeds to validate them in ways specific to their type.
   * Ignores inputs with data-abide-ignore, type="hidden" or disabled attributes set
   * @fires Abide#invalid
   * @fires Abide#valid
   * @param {Object} element - jQuery object to validate, should be an HTML input
   * @returns {Boolean} goodToGo - If the input is valid or not.
   */
  validateInput($el) {
    const el = toEl($el);
    var clearRequire = this.requiredCheck($el),
        validator = el.getAttribute('data-validator'),
        failedValidators = [],
        manageErrorClasses = true;

    // skip validation if disabled
    if (this._validationIsDisabled()) {
      return true;
    }

    // don't validate ignored inputs or hidden inputs or disabled inputs
    if (el.hasAttribute('data-abide-ignore') || el.matches('[type="hidden"]') || el.hasAttribute('disabled')) {
      return true;
    }

    switch (el.type) {
      case 'radio':
        this.validateRadio(el.getAttribute('name')) || failedValidators.push('required');
        break;

      case 'checkbox':
        this.validateCheckbox(el.getAttribute('name')) || failedValidators.push('required');
        // validateCheckbox() adds/removes error classes
        manageErrorClasses = false;
        break;

      case 'select':
      case 'select-one':
      case 'select-multiple':
        clearRequire || failedValidators.push('required');
        break;

      default:
        clearRequire || failedValidators.push('required');
        this.validateText($el) || failedValidators.push('pattern');
    }

    if (validator) {
      const required = el.hasAttribute('required');

      validator.split(' ').forEach((v) => {
        this.options.validators[v]($el, required, el.parentElement) || failedValidators.push(v);
      });
    }

    if (el.getAttribute('data-equalto')) {
      this.options.validators.equalTo($el) || failedValidators.push('equalTo');
    }

    var goodToGo = failedValidators.length === 0;
    var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

    if (goodToGo) {
      // Re-validate inputs that depend on this one with equalto
      const dependentElements = this.$element.querySelectorAll(`[data-equalto="${el.id}"]`);
      if (dependentElements.length) {
        Array.from(dependentElements).forEach(dependent => {
          if (dependent.value) {
            this.validateInput(dependent);
          }
        });
      }
    }

    if (manageErrorClasses) {
      this.removeErrorClasses($el);
      if (!goodToGo) {
          this.addErrorClasses($el, failedValidators);
      }
    }

    /**
     * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
     * Trigger includes the DOM element of the input.
     * @event Abide#valid
     * @event Abide#invalid
     */
    // S12: the production flips to the native event layer - a real, bubbling
    // event; still-on-jQuery listeners receive it through the real-event
    // pass-through, the forwarded $el rides in event.originalEvent.detail
    // (the final param form is the wrap-up slice's uniform move).
    Events.trigger(el, message, [el]);

    return goodToGo;
  }

  /**
   * Goes through a form and if there are any invalid inputs, it will display the form error element
   * @returns {Boolean} noError - true if no errors were detected...
   * @fires Abide#formvalid
   * @fires Abide#forminvalid
   */
  validateForm() {
    var acc = [];
    var checkboxGroupName;
    const form = this.$element;

    // Remember first form submission to prevent specific checkbox validation (more than one required) until form got initially submitted
    if (!this.initialized) {
      this.initialized = true;
    }

    // skip validation if disabled
    if (this._validationIsDisabled()) {
      this.formnovalidate = null;
      return true;
    }

    this.inputs.forEach(el => {

      // Only use one checkbox per group since validateCheckbox() iterates over all associated checkboxes
      if (el.type === 'checkbox') {
        if (el.getAttribute('name') === checkboxGroupName) return;
        checkboxGroupName = el.getAttribute('name');
      }

      acc.push(this.validateInput(el));
    });

    var noError = acc.indexOf(false) === -1;

    form.querySelectorAll('[data-abide-error]').forEach(elem => {
      // Ensure a11y attributes are set
      if (this.options.a11yAttributes) this.addGlobalErrorA11yAttributes(elem);
      // Show or hide the error
      elem.style.display = (noError ? 'none' : 'block');
    });

    /**
     * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
     * Trigger includes the element of the form.
     * @event Abide#formvalid
     * @event Abide#forminvalid
     */
    // S12: production flips to the native event layer, same shape as the
    // input-level events above.
    // Terminal form: the forwarded form is the plain element.
    Events.trigger(form, (noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [form]);

    return noError;
  }

  /**
   * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
   * @param {Object} $el - jQuery object to validate, should be a text input HTML element
   * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
   * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
   */
  validateText($el, pattern) {
    const el = toEl($el);
    // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
    pattern = (pattern || el.getAttribute('data-pattern') || el.getAttribute('pattern') || el.getAttribute('type'));
    var inputText = el.value;
    var valid = true;

    if (inputText.length) {
      // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
      if (this.options.patterns.hasOwnProperty(pattern)) {
        valid = this.options.patterns[pattern].test(inputText);
      }
      // If the pattern name isn't also the type attribute of the field, then test it as a regexp
      else if (pattern !== el.getAttribute('type')) {
        valid = new RegExp(pattern).test(inputText);
      }
    }

    return valid;
   }

  /**
   * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
   * @param {String} groupName - A string that specifies the name of a radio button group
   * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
   */
  validateRadio(groupName) {
    // If at least one radio in the group has the `required` attribute, the group is considered required
    // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
    const $group = this._groupEls('radio', groupName);
    var valid = false, required = false;

    // For the group to be required, at least one radio needs to be required
    $group.forEach(el => {
      if (el.hasAttribute('required')) {
        required = true;
      }
    });
    if (!required) valid=true;

    if (!valid) {
      // For the group to be valid, at least one radio needs to be checked
      $group.forEach(el => {
        if (el.checked) {
          valid = true;
        }
      });
    }

    return valid;
  }

  /**
   * Determines whether or a not a checkbox input is valid based on whether or not it is required and checked. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all checkboxes in its group.
   * @param {String} groupName - A string that specifies the name of a checkbox group
   * @returns {Boolean} Boolean value depends on whether or not at least one checkbox input has been checked (if it's required)
   */
  validateCheckbox(groupName) {
    // If at least one checkbox in the group has the `required` attribute, the group is considered required
    // Per W3C spec, all checkboxes in a group should have `required`, but we're being nice
    const $group = this._groupEls('checkbox', groupName);
    var valid = false, required = false, minRequired = 1, checked = 0;

    // For the group to be required, at least one checkbox needs to be required
    $group.forEach(el => {
      if (el.hasAttribute('required')) {
        required = true;
      }
    });
    if (!required) valid=true;

    if (!valid) {
      // Count checked checkboxes within the group
      // Use data-min-required if available (default: 1)
      $group.forEach(el => {
        if (el.checked) {
          checked++;
        }
        if (el.hasAttribute('data-min-required')) {
          minRequired = parseInt(el.getAttribute('data-min-required'), 10);
        }
      });

      // For the group to be valid, the minRequired amount of checkboxes have to be checked
      if (checked >= minRequired) {
        valid = true;
      }
    }

    // Skip validation if more than 1 checkbox have to be checked AND if the form hasn't got submitted yet (otherwise it will already show an error during the first fill in)
    if (this.initialized !== true && minRequired > 1) {
      return true;
    }

    // Refresh error class for all input
    $group.forEach(el => {
      if (!valid) {
        this.addErrorClasses(el, ['required']);
      } else {
        this.removeErrorClasses(el);
      }
    });

    return valid;
  }

  /**
   * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
   * @param {Object} $el - jQuery input element.
   * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
   * @param {Boolean} required - self explanatory?
   * @returns {Boolean} - true if validations passed.
   */
  matchValidation($el, validators, required) {
    required = required ? true : false;
    // The 6.x third validator argument was the parent element; validateInput
    // resolves its own `el` via toEl, matchValidation needs the same step
    // (the bare `el` here was a crash on every data-validator run).
    const el = toEl($el);

    var clear = validators.split(' ').map((v) => {
      return this.options.validators[v]($el, required, el.parentElement);
    });
    return clear.indexOf(false) === -1;
  }

  /**
   * Resets form inputs and styles
   * @fires Abide#formreset
   */
  resetForm() {
    const form = this.$element,
        opts = this.options;

    form.querySelectorAll(`.${opts.labelErrorClass}`).forEach(el => {
      if (!el.matches('small')) removeClasses(el, opts.labelErrorClass);
    });
    form.querySelectorAll(`.${opts.inputErrorClass}`).forEach(el => {
      if (!el.matches('small')) removeClasses(el, opts.inputErrorClass);
    });
    document.querySelectorAll(`${opts.formErrorSelector}.${opts.formErrorClass}`).forEach(el => {
      removeClasses(el, opts.formErrorClass);
    });
    form.querySelectorAll('[data-abide-error]').forEach(el => {
      el.style.display = 'none';
    });

    // Native reset sweep (7.0 line A, S12) - the former pseudo-selector
    // chain `:input :not(:button, :submit, :reset, :hidden, :radio,
    // :checkbox, [data-abide-ignore])` with the Dom stand-in helpers; the
    // jQuery `:hidden` zero-box sense is narrowed to input[type=hidden],
    // which was its only effect on a rendered form.
    formControls(form).forEach(el => {
      if (isButton(el) || isSubmit(el) || isReset(el) ||
          el.matches('input[type="hidden"]') ||
          isRadio(el) || isCheckbox(el) ||
          el.hasAttribute('data-abide-ignore')) {
        return;
      }
      el.value = '';
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('input[type="radio"]').forEach(el => {
      if (el.hasAttribute('data-abide-ignore')) return;
      el.checked = false;
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(el => {
      if (el.hasAttribute('data-abide-ignore')) return;
      el.checked = false;
      el.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    });

    /**
     * Fires when the form has been reset.
     * @event Abide#formreset
     */
    // S12: production flips to the native event layer, same shape as the
    // other productions above.
    Events.trigger(form, 'formreset.zf.abide', [this.$element]);
  }

  /**
   * Destroys an instance of Abide.
   * Removes error styles and classes from elements, without resetting their values.
   */
  _destroy() {
    const form = this.$element;

    // The plugin-namespaced listeners on the form (the native table the
    // library owns).
    Events.off(form, '.abide');
    form.querySelectorAll('[data-abide-error]').forEach(error => {
      error.style.display = 'none';
    });

    this.inputs.forEach(input => {
      Events.off(input, '.abide');
      this.removeErrorClasses(input);
    });

    this.submits.forEach(submit => {
      Events.off(submit, '.abide');
    });
  }
}

/**
 * Default settings for plugin
 */
Abide.defaults = {
  /**
   * The default event to validate inputs. Checkboxes and radios validate immediately.
   * Remove or change this value for manual validation.
   * @option
   * @type {?string}
   * @default 'fieldChange'
   */
  validateOn: 'fieldChange',

  /**
   * Class to be applied to input labels on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-label'
   */
  labelErrorClass: 'is-invalid-label',

  /**
   * Class to be applied to inputs on failed validation.
   * @option
   * @type {string}
   * @default 'is-invalid-input'
   */
  inputErrorClass: 'is-invalid-input',

  /**
   * Class selector to use to target Form Errors for show/hide.
   * @option
   * @type {string}
   * @default '.form-error'
   */
  formErrorSelector: '.form-error',

  /**
   * Class added to Form Errors on failed validation.
   * @option
   * @type {string}
   * @default 'is-visible'
   */
  formErrorClass: 'is-visible',

  /**
   * If true, automatically insert when possible:
   * - `[aria-describedby]` on fields
   * - `[role=alert]` on form errors and `[for]` on form error labels
   * - `[aria-live]` on global errors `[data-abide-error]` (see option `a11yErrorLevel`).
   * @option
   * @type {boolean}
   * @default true
   */
  a11yAttributes: true,

  /**
   * [aria-live] attribute value to be applied on global errors `[data-abide-error]`.
   * Options are: 'assertive', 'polite' and 'off'/null
   * @option
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
   * @type {string}
   * @default 'assertive'
   */
  a11yErrorLevel: 'assertive',

  /**
   * Set to true to validate text inputs on any value change.
   * @option
   * @type {boolean}
   * @default false
   */
  liveValidate: false,

  /**
   * Set to true to validate inputs on blur.
   * @option
   * @type {boolean}
   * @default false
   */
  validateOnBlur: false,

  patterns: {
    alpha : /^[a-zA-Z]+$/,
    // eslint-disable-next-line camelcase
    alpha_numeric : /^[a-zA-Z0-9]+$/,
    integer : /^[-+]?\d+$/,
    number : /^[-+]?\d*(?:[\.\,]\d+)?$/,

    // amex, visa, diners
    card : /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(?:222[1-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
    cvv : /^([0-9]){3,4}$/,

    // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
    email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

    // From CommonRegexJS (@talyssonoc)
    // https://github.com/talyssonoc/CommonRegexJS/blob/e2901b9f57222bc14069dc8f0598d5f412555411/lib/commonregex.js#L76
    // For more restrictive URL Regexs, see https://mathiasbynens.be/demo/url-regex.
    url: /^((?:(https?|ftps?|file|ssh|sftp):\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?\xab\xbb\u201c\u201d\u2018\u2019]))$/,

    // abc.de
    domain : /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

    datetime : /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
    // YYYY-MM-DD
    date : /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
    // HH:MM:SS
    time : /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
    dateISO : /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
    // MM/DD/YYYY
    // eslint-disable-next-line camelcase
    month_day_year : /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
    // DD/MM/YYYY
    // eslint-disable-next-line camelcase
    day_month_year : /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

    // #FFF or #FFFFFF
    color : /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,

    // Domain || URL
    website: {
      test: (text) => {
        return Abide.defaults.patterns.domain.test(text) || Abide.defaults.patterns.url.test(text);
      }
    }
  },

  /**
   * Optional validation functions to be used. `equalTo` being the only default included function.
   * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
   * el : The jQuery element to validate.
   * @option
   */
  validators: {
    equalTo: function (el) {
      // Native id lookup (7.0 line A, S12): the former `$(`#${...}`).val()`
      // compared against undefined when the source element does not exist;
      // the guard keeps that "no source element means invalid" outcome.
      const source = document.getElementById(toEl(el).getAttribute('data-equalto'));
      return !!source && source.value === toEl(el).value;
    }
  }
}

export { Abide };
