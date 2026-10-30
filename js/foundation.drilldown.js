import { Keyboard } from './foundation.util.keyboard';
import { Nest } from './foundation.util.nest';
import { GetYoDigits, transitionend } from './foundation.core.utils';
import { datasetOptions, deepMerge } from './foundation.util.dom';
import { Events } from './foundation.util.events';
import { Box } from './foundation.util.box';
import { Motion } from './foundation.util.motion';
import { Plugin } from './foundation.core.plugin';

/**
 * Drilldown module.
 * @module foundation.drilldown
 * @requires foundation.util.keyboard
 * @requires foundation.util.nest
 * @requires foundation.util.box
 */

class Drilldown extends Plugin {
  /**
   * Creates a new instance of a drilldown menu.
   * @class
   * @name Drilldown
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  _setup(element, options) {
    // Mixed state (7.0 line A, S16): the constructor takes the native element
    // the 7.0 contract carries as well as the jQuery collection the mixed-state
    // reflow still feeds in; internals keep the collection until this file is
    // migrated off jQuery.
    this.$element = element.nodeType === 1 ? element : element[0];
    this.options = deepMerge({}, Drilldown.defaults, datasetOptions(this.$element), options);
    this.className = 'Drilldown'; // ie9 back compat

    this._init();

    Keyboard.register('Drilldown', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close',
    });
  }

  /**
   * Initializes the drilldown by creating jQuery collections of elements
   * @private
   */
  _init() {
    Nest.Feather(this.$element, 'drilldown');

    if(this.options.autoApplyClass) {
      this.$element.classList.add('drilldown');
    }

    this.$element.setAttribute('aria-multiselectable', 'false');
    this.$submenuAnchors = Array.from(this.$element.querySelectorAll('li.is-drilldown-submenu-parent > a'));
    this.$submenus = this.$submenuAnchors.map(a => a.parentElement.querySelector(':scope > [data-submenu]'));
    this.$submenus.forEach(sub => sub.setAttribute('role', 'group'));
    this.$menuItems = Array.from(this.$element.querySelectorAll('li:not(.js-drilldown-back) a'));

    // Set the main menu as current by default (unless a submenu is selected)
    // Used to set the wrapper height when the drilldown is closed/reopened from any (sub)menu
    this.$currentMenu = this.$element;

    this.$element.setAttribute('data-mutate', (this.$element.getAttribute('data-drilldown') || GetYoDigits(6, 'drilldown')));

    this._prepareMenu();
    this._registerEvents();

    this._keyboardEvents();
  }

  /**
   * prepares drilldown menu by setting attributes to links and elements
   * sets a min height to prevent content jumping
   * wraps the element if not already wrapped
   * @private
   * @function
   */
  _prepareMenu() {
    var _this = this;
    this.$submenuAnchors.forEach(function(link){
      var sub = link.parentElement;
      if(_this.options.parentLink){
        // $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li .../>')
        const submenu = sub.querySelector(':scope > [data-submenu]');
        const wrapper = document.createElement('li');
        wrapper.setAttribute('data-is-parent-link', '');
        wrapper.className = 'is-submenu-parent-item is-submenu-item is-drilldown-submenu-item';
        wrapper.setAttribute('role', 'none');
        const cloned = link.cloneNode(true);
        wrapper.appendChild(cloned);
        submenu.insertBefore(wrapper, submenu.firstChild);
      }
      // the savedHref rode jQuery's data cache (DOM-invisible); the expando
      // property keeps it invisible
      link.zfSavedHref = link.getAttribute('href');
      link.removeAttribute('href');
      link.setAttribute('tabindex', '0');
      Array.from(link.children).forEach(function(child) {
        if (child.matches('[data-submenu]')) {
          child.setAttribute('aria-hidden', 'true');
          child.setAttribute('tabindex', '0');
          child.setAttribute('role', 'group');
        }
      });
      _this._events(link);
    });
    this.$submenus.forEach(function(menu){
      var back = menu.querySelector('.js-drilldown-back');
      if(!back) {
        switch (_this.options.backButtonPosition) {
          case "bottom":
            menu.insertAdjacentHTML('beforeend', _this.options.backButton);
            break;
          case "top":
            menu.insertAdjacentHTML('afterbegin', _this.options.backButton);
            break;
          default:
            console.error("Unsupported backButtonPosition value '" + _this.options.backButtonPosition + "'");
        }
      }
      _this._back(menu);
    });

    this.$submenus.forEach(sub => sub.classList.add('invisible'));
    if(!this.options.autoHeight) {
      this.$submenus.forEach(sub => sub.classList.add('drilldown-submenu-cover-previous'));
    }

    // create a wrapper on element if it doesn't exist.
    this.wasWrapped = this.$element.parentElement.classList.contains('is-drilldown');
    if(!this.wasWrapped){
      // the wrapper option is markup (7.0 terminal form: built and inserted)
      var probe = document.createElement('template');
      probe.innerHTML = this.options.wrapper.trim();
      var wrapperEl = probe.content.firstElementChild;
      wrapperEl.classList.add('is-drilldown');
      if(this.options.animateHeight) wrapperEl.classList.add('animate-height');
      this.$element.parentElement.insertBefore(wrapperEl, this.$element);
      wrapperEl.appendChild(this.$element);
    }
    // set wrapper
    this.$wrapper = this.$element.parentElement;
    this._applyMaxDims(this._getMaxDims());
  }

  _resize() {
    this.$wrapper.style.maxWidth = 'none';
    this.$wrapper.style.minHeight = 'none';
    // _getMaxDims has side effects (boo) but calling it should update all other necessary heights & widths
    this._applyMaxDims(this._getMaxDims());
  }

  // css(map) write helper (the 6.x jQuery .css(object) form)
  _applyMaxDims(dims) {
    Object.keys(dims).forEach(prop => {
      this.$wrapper.style[prop === 'min-height' ? 'minHeight' : prop === 'max-width' ? 'maxWidth' : prop] = dims[prop];
    });
  }

  /**
   * Adds event handlers to elements in the menu.
   * @function
   * @private
   * @param {jQuery} $elem - the current menu item to add handlers to.
   */
  _events(link) {
    var _this = this;

    // S9: the submenu-anchor click consumer runs on the native event layer
    // - real clicks arrive directly and jQuery-synthesized clicks on
    // non-link elements ride the `.click()` shortcut bridge (reveal-native
    // precedent; jQuery suppresses that shortcut for link anchors).
    Events.off(link, 'click.zf.drilldown');
    Events.on(link, 'click.zf.drilldown', function(e) {
      // $(target).parentsUntil('ul', 'li') hasClass check: the nearest li
      // ancestor strictly below a <ul>
      var li = e.target.parentElement;
      while (li && li.tagName !== 'UL') {
        if (li.matches('li.is-drilldown-submenu-parent')) { break; }
        li = li.parentElement;
      }
      if (li && li.tagName !== 'UL' && li.matches('li.is-drilldown-submenu-parent')){
        e.preventDefault();
      }

      // if(e.target !== e.currentTarget.firstElementChild){
      //   return false;
      // }
      _this._show(link.parentElement);

      if(_this.options.closeOnClick){
        var body = document.body;
        Events.off(body, '.zf.drilldown');
        Events.on(body, 'click.zf.drilldown', function(ev) {
          if (ev.target === _this.$element || _this.$element.contains(ev.target)) { return; }
          ev.preventDefault();
          _this._hideAll();
          Events.off(body, '.zf.drilldown');
        });
      }
    });
  }

  /**
   * Adds event handlers to the menu element.
   * @function
   * @private
   */
  _registerEvents() {
    if(this.options.scrollTop){
      // S9: the self-consumer runs with its producers - the four state
      // events arrive as real events on the native layer.
      this._bindHandler = this._scrollTop.bind(this);
      Events.on(this.$element, 'open.zf.drilldown hide.zf.drilldown close.zf.drilldown closed.zf.drilldown', this._bindHandler);
    }
    // S10 group flip: the mutateme consumer is native since the group flip.
    Events.on(this.$element, 'mutateme.zf.trigger', this._resize.bind(this));
  }

  /**
   * Scroll to Top of Element or data-scroll-top-element
   * @function
   * @fires Drilldown#scrollme
   */
  _scrollTop() {
    var _this = this;
    var scrollTopElement = _this.options.scrollTopElement !== '' ? document.querySelector(_this.options.scrollTopElement) : _this.$element,
        scrollPos = parseInt(scrollTopElement.getBoundingClientRect().top + window.pageYOffset + _this.options.scrollTopOffset, 10);
    // fx 方案 A: the scroll tween runs on Motion's native primitive with
    // the stop(true) debounce (clearQueue) semantics riding along. 6.x
    // animated html AND body (two callbacks) and fired scrollme only on the
    // html one; the native single viewport tween delivers the callback once,
    // so the guard collapses to an unconditional trigger (ledger ②).
    Motion.stop(document.documentElement, true);
    Motion.animate(document.documentElement, { scrollTop: scrollPos }, _this.options.animationDuration, _this.options.animationEasing, function(){
      /**
        * Fires after the menu has scrolled
        * @event Drilldown#scrollme
        */
      Events.trigger(_this.$element, 'scrollme.zf.drilldown');
    });
  }

  /**
   * Adds keydown event listener to `li`'s in the menu.
   * @private
   */
  _keyboardEvents() {
    var _this = this;

    // 7.0 terminal form: the keydown listener runs on the native event
    // layer (the coarse suite's mocks dispatch real KeyboardEvents since
    // the S16 migration), on every menu link and back/parent-link anchor
    // like the collection-wide .on() did. The transitionend follow-ups are
    // Events.one waits now - the coarse suite drives them through the
    // native triggerHandler (updated with this flip).
    var links = this.$menuItems.concat(Array.from(this.$element.querySelectorAll('.js-drilldown-back > a, .is-submenu-parent-item > a')));
    links.forEach(function(link) {
      Events.off(link, 'keydown.zf.drilldown');
      Events.on(link, 'keydown.zf.drilldown', function(e){
        var element = this,
            menuUl = element.parentElement.parentElement,
            elements = Array.from(menuUl.querySelectorAll(':scope > li > a')),
            prevElement,
            nextElement;

        var i = elements.indexOf(element);
        prevElement = elements[Math.max(0, i-1)];
        nextElement = elements[Math.min(i+1, elements.length-1)];

        var parentLi = element.parentElement;

        Keyboard.handleKey(e, 'Drilldown', {
          next: function() {
            if (_this.$submenuAnchors.indexOf(element) !== -1) {
              _this._show(parentLi);
              Events.one(parentLi, transitionend(parentLi), function(){
                // jQuery's find('ul li a') scoped the subtree (the item's
                // own anchor never matched); the native form takes the
                // anchors INSIDE a submenu
                var focusables = Array.from(parentLi.querySelectorAll('a')).filter(a => a.closest('[data-submenu]') && !a.closest('.js-drilldown-back'));
                if (focusables[0]) { focusables[0].focus(); }
              });
              return true;
            }
          },
          previous: function() {
            _this._hide(menuUl);
            Events.one(menuUl, transitionend(menuUl), function(){
              setTimeout(function() {
                var outerLink = menuUl.parentElement.querySelector(':scope > a');
                if (outerLink) { outerLink.focus(); }
              }, 1);
            });
            return true;
          },
          up: function() {
            if (prevElement) prevElement.focus();
            // Don't tap focus on first element in root ul
            return !(element === _this.$element.querySelector(':scope > li:first-child > a'));
          },
          down: function() {
            if (nextElement) nextElement.focus();
            // Don't tap focus on last element in root ul
            return !(element === _this.$element.querySelector(':scope > li:last-child > a'));
          },
          close: function() {
            // Don't close on element in root ul
            if (_this.$element.querySelector(':scope > li > a') !== element) {
              _this._hide(element.parentElement.parentElement);
              var siblingLink = element.parentElement.parentElement.querySelector(':scope > a');
              if (siblingLink) { siblingLink.focus(); }
            }
          },
          open: function() {
            if (_this.options.parentLink && element.getAttribute('href')) { // Link with href
              return false;
            } else if (_this.$menuItems.indexOf(element) === -1) { // not menu item means back button
              _this._hide(parentLi.parentElement);
              Events.one(parentLi.parentElement, transitionend(parentLi.parentElement), function(){
                setTimeout(function() {
                  var outerLink = parentLi.parentElement.parentElement.querySelector(':scope > a');
                  if (outerLink) { outerLink.focus(); }
                }, 1);
              });
              return true;
            } else if (_this.$submenuAnchors.indexOf(element) !== -1) { // Sub menu item
              _this._show(parentLi);
              Events.one(parentLi, transitionend(parentLi), function(){
                var focusables = Array.from(parentLi.querySelectorAll('a')).filter(a => a.closest('[data-submenu]') && !a.closest('.js-drilldown-back'));
                if (focusables[0]) { focusables[0].focus(); }
              });
              return true;
            }
          },
          handled: function(preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
          }
        });
      });
    }); // end keyboardAccess
  }

  /**
   * Closes all open elements, and returns to root menu.
   * @function
   * @fires Drilldown#close
   * @fires Drilldown#closed
   */
  _hideAll() {
    // 6.x: the FIRST active submenu drove the class flips and the height
    var elem = this.$element.querySelector('.is-drilldown-submenu.is-active');
    var outerUl = elem && elem.parentElement ? elem.parentElement.closest('ul') : null;
    if (elem) { elem.classList.add('is-closing'); }
    if (outerUl) { outerUl.classList.remove('invisible'); }

    if (this.options.autoHeight && outerUl) {
      const calcHeight = outerUl.zfCalcHeight;
      this.$wrapper.style.height = (calcHeight || 0) + 'px';
    }

    /**
     * Fires when the menu is closing.
     * @event Drilldown#close
     */
    // S9: state production through the native event layer; still-on-jQuery
    // listeners receive the real bubbling event (white absorption).
    Events.trigger(this.$element, 'close.zf.drilldown');

    // 7.0 terminal form: the transitionend wait is an Events.one - the
    // coarse suite drives it through the native triggerHandler.
    if (elem) {
      Events.one(elem, transitionend(elem), () => {
        elem.classList.remove('is-active', 'is-closing');

        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        Events.trigger(this.$element, 'closed.zf.drilldown');
      });
    } else {
      // nothing was open: the 6.x empty-collection .one() never armed, and
      // the coarse suite fires closed.zf.drilldown by driving the wait on
      // whatever element it holds - keep the event contract total by
      // firing it immediately
      Events.trigger(this.$element, 'closed.zf.drilldown');
    }
  }

  /**
   * Adds event listener for each `back` button, and closes open menus.
   * @function
   * @fires Drilldown#back
   * @param {jQuery} $elem - the current sub-menu to add `back` event.
   */
  _back(menu) {
    var _this = this;
    const back = menu.querySelector(':scope > .js-drilldown-back');
    if (!back) { return; }
    // S9: the back-button click consumer runs on the native event layer.
    Events.off(back, 'click.zf.drilldown');
    Events.on(back, 'click.zf.drilldown', function() {
      _this._hide(menu);

      // If there is a parent submenu, call show
      var outerUl = menu.parentElement.parentElement;
      let parentSubMenu = outerUl ? outerUl.parentElement : null;
      if (parentSubMenu && parentSubMenu.matches('li')) {
        _this._show(parentSubMenu);
      }
      else {
        _this.$currentMenu = _this.$element;
      }
    });
  }

  /**
   * Adds event listener to menu items w/o submenus to close open menus on click.
   * @function
   * @private
   */
  _menuLinkEvents() {
    var _this = this;
    this.$menuItems.filter(a => !a.matches('.is-drilldown-submenu-parent'))
        .forEach(function(link) {
          Events.off(link, 'click.zf.drilldown');
          Events.on(link, 'click.zf.drilldown', function() {
            setTimeout(function() {
              _this._hideAll();
            }, 0);
          });
        });
  }

  /**
   * Sets the CSS classes for submenu to show it.
   * @function
   * @private
   * @param {jQuery} $elem - the target submenu (`ul` tag)
   * @param {boolean} trigger - trigger drilldown event
   */
  _setShowSubMenuClasses(elem, trigger) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    // S9: class/ARIA state flips natively.
    elem.classList.add('is-active');
    elem.classList.remove('invisible');
    elem.setAttribute('aria-hidden', 'false');
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'true'); }
    if (trigger === true) {
      // Terminal form: the forwarded submenu is the plain element.
      Events.trigger(this.$element, 'open.zf.drilldown', [elem]);
    }
  }

  /**
   * Sets the CSS classes for submenu to hide it.
   * @function
   * @private
   * @param {jQuery} $elem - the target submenu (`ul` tag)
   * @param {boolean} trigger - trigger drilldown event
   */
  _setHideSubMenuClasses(elem, trigger) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    // S9: class/ARIA state flips natively.
    elem.classList.remove('is-active');
    elem.classList.add('invisible');
    elem.setAttribute('aria-hidden', 'true');
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'false'); }
    if (trigger === true) {
      // Terminal form: the forwarded submenu is the plain element.
      Events.trigger(elem, 'hide.zf.drilldown', [elem]);
    }
  }

  /**
   * Opens a specific drilldown (sub)menu no matter which (sub)menu in it is currently visible.
   * Compared to _show() this lets you jump into any submenu without clicking through every submenu on the way to it.
   * @function
   * @fires Drilldown#open
   * @param {jQuery} $elem - the target (sub)menu (`ul` tag)
   * @param {boolean} autoFocus - if true the first link in the target (sub)menu gets auto focused
   */
  _showMenu(elem, autoFocus) {

    var _this = this;

    elem = elem && elem.nodeType === 1 ? elem : elem[0];

    // Reset drilldown
    var expandedSubmenus = Array.from(this.$element.querySelectorAll('li[aria-expanded="true"] > ul[data-submenu]'));
    expandedSubmenus.forEach(function(sub) {
      _this._setHideSubMenuClasses(sub);
    });

    // Save the menu as the currently displayed one.
    this.$currentMenu = elem;

    // If target menu is root, focus first link & exit
    if (elem.matches('[data-drilldown]')) {
      if (autoFocus === true) {
        var rootLink = elem.querySelector('li > a');
        if (rootLink) { rootLink.focus(); }
      }
      if (this.options.autoHeight) this.$wrapper.style.height = elem.zfCalcHeight + 'px';
      return;
    }

    // Find all submenus on way to root incl. the element itself:
    // jQuery's parentsUntil(root, sel) - the [data-submenu] ancestors
    // strictly below the drilldown root
    var submenus = [];
    var walker = elem.firstElementChild;
    while (walker && walker !== this.$element) {
      if (walker.matches('[data-submenu]')) { submenus.push(walker); }
      walker = walker.parentElement;
    }

    // Open target menu and all submenus on its way to root
    submenus.forEach(function(submenu, index) {

      // Update height of first child (target menu) if autoHeight option true
      if (index === 0 && _this.options.autoHeight) {
        _this.$wrapper.style.height = submenu.zfCalcHeight + 'px';
      }

      var isLastChild = index === submenus.length - 1;

      // Add transitionsend listener to last child (root due to reverse order) to open target menu's first link
      // Last child makes sure the event gets always triggered even if going through several menus
      if (isLastChild === true) {
        Events.one(submenu, transitionend(submenu), () => {
          if (autoFocus === true) {
            var link = elem.querySelector('li > a');
            if (link) { link.focus(); }
          }
        });
      }

      _this._setShowSubMenuClasses(submenu, isLastChild);
    });
  }

  /**
   * Opens a submenu.
   * @function
   * @fires Drilldown#open
   * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
   */
  _show(elem) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    const submenu = elem.querySelector(':scope > [data-submenu]');

    // S9: class/ARIA state flips natively.
    elem.setAttribute('aria-expanded', 'true');

    this.$currentMenu = submenu;

    //hide drilldown parent menu when submenu is open
    // this removes it from the dom so that the tab key will take the user to the next visible element
    var parentUl = elem.parentElement.closest('ul');
    if (parentUl) { parentUl.classList.add('invisible'); }

    // add visible class to submenu to override invisible class above
    if (submenu) {
      submenu.classList.add('is-active', 'visible');
      submenu.classList.remove('invisible');
      submenu.setAttribute('aria-hidden', 'false');
    }

    if (this.options.autoHeight && submenu) {
      this.$wrapper.style.height = submenu.zfCalcHeight + 'px';
    }

    /**
     * Fires when the submenu has opened.
     * @event Drilldown#open
     */
    // S9: state production through the native layer; the terminal form
    // forwards the plain li element.
    Events.trigger(this.$element, 'open.zf.drilldown', [elem]);
  }

  /**
   * Hides a submenu
   * @function
   * @fires Drilldown#hide
   * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
   */
  _hide(elem) {
    elem = elem.nodeType === 1 ? elem : elem[0];
    var outerUl = elem.parentElement ? elem.parentElement.closest('ul') : null;
    if(this.options.autoHeight && outerUl) this.$wrapper.style.height = outerUl.zfCalcHeight + 'px';
    if (outerUl) { outerUl.classList.remove('invisible'); }
    if (elem.parentElement) { elem.parentElement.setAttribute('aria-expanded', 'false'); }
    // S9: class/ARIA state flips natively.
    elem.setAttribute('aria-hidden', 'true');
    elem.classList.add('is-closing');
    // 7.0 terminal form: the transitionend wait is an Events.one - the
    // coarse suite drives it through the native triggerHandler.
    Events.one(elem, transitionend(elem), function(){
      elem.classList.remove('is-active', 'is-closing', 'visible');
      elem.blur();
      elem.classList.add('invisible');
    });
    /**
     * Fires when the submenu has closed.
     * @event Drilldown#hide
     */
    // Terminal form: the forwarded submenu is the plain element.
    Events.trigger(elem, 'hide.zf.drilldown', [elem]);
  }

  /**
   * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
   * Prevents content jumping.
   * @function
   * @private
   */
  _getMaxDims() {
    var maxHeight = 0, result = {}, _this = this;

    // Recalculate menu heights and total max height
    var measured = this.$submenus.concat([this.$element]);
    measured.forEach(function(el){
      var height = Box.GetDimensions(el).height;

      maxHeight = height > maxHeight ? height : maxHeight;

      if(_this.options.autoHeight) {
        // the calcHeight rode jQuery's data cache (DOM-invisible); the
        // expando property keeps it invisible
        el.zfCalcHeight = height;
      }
    });

    if (this.options.autoHeight)
      result.height = (this.$currentMenu.zfCalcHeight || 0) + 'px';
    else
      result['min-height'] = `${maxHeight}px`;

    result['max-width'] = `${this.$element.getBoundingClientRect().width}px`;

    return result;
  }

  /**
   * Destroys the Drilldown Menu
   * @function
   */
  _destroy() {
    // The plugin-namespaced listeners on the body, element and anchors -
    // the library's own table only (third-party listeners survive, the 7.0
    // ownership semantics).
    Events.off(document.body, '.zf.drilldown');
    if(this.options.scrollTop) {
      Events.off(this.$element, 'open.zf.drilldown hide.zf.drilldown close.zf.drilldown closed.zf.drilldown', this._bindHandler);
    }
    this._hideAll();
    Events.off(this.$element, 'mutateme.zf.trigger');
    Nest.Burn(this.$element, 'drilldown');
    if (!this.wasWrapped) {
      // .unwrap(): the wrapper is replaced by its children
      const wrapper = this.$element.parentElement;
      while (wrapper.firstChild) {
        wrapper.parentElement.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    }
    this.$element.querySelectorAll('.js-drilldown-back, .is-submenu-parent-item').forEach(el => el.remove());
    this.$element.querySelectorAll('.is-active, .is-closing, .is-drilldown-submenu').forEach(el => {
      el.classList.remove('is-active', 'is-closing', 'is-drilldown-submenu');
      Events.off(el, 'transitionend otransitionend webkitTransitionEnd');
    });
    this.$element.querySelectorAll('[data-submenu]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
    });
    this.$submenuAnchors.forEach(anchor => {
      Events.off(anchor, '.zf.drilldown');
    });

    this.$element.querySelectorAll('[data-is-parent-link]').forEach(el => el.remove());
    this.$submenus.forEach(sub => sub.classList.remove('drilldown-submenu-cover-previous', 'invisible'));

    this.$element.querySelectorAll('a').forEach(function(link){
      link.removeAttribute('tabindex');
      if(link.zfSavedHref){
        link.setAttribute('href', link.zfSavedHref);
        link.zfSavedHref = null;
      }else{ return; }
    });
  };
}

Drilldown.defaults = {
  /**
   * Drilldowns depend on styles in order to function properly; in the default build of Foundation these are
   * on the `drilldown` class. This option auto-applies this class to the drilldown upon initialization.
   * @option
   * @type {boolean}
   * @default true
   */
  autoApplyClass: true,
  /**
   * Markup used for JS generated back button. Prepended  or appended (see backButtonPosition) to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @type {string}
   * @default '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>'
   */
  backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
  /**
   * Position the back button either at the top or bottom of drilldown submenus. Can be `'left'` or `'bottom'`.
   * @option
   * @type {string}
   * @default top
   */
  backButtonPosition: 'top',
  /**
   * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @type {string}
   * @default '<div></div>'
   */
  wrapper: '<div></div>',
  /**
   * Adds the parent link to the submenu.
   * @option
   * @type {boolean}
   * @default false
   */
  parentLink: false,
  /**
   * Allow the menu to return to root list on body click.
   * @option
   * @type {boolean}
   * @default false
   */
  closeOnClick: false,
  /**
   * Allow the menu to auto adjust height.
   * @option
   * @type {boolean}
   * @default false
   */
  autoHeight: false,
  /**
   * Animate the auto adjust height.
   * @option
   * @type {boolean}
   * @default false
   */
  animateHeight: false,
  /**
   * Scroll to the top of the menu after opening a submenu or navigating back using the menu back button
   * @option
   * @type {boolean}
   * @default false
   */
  scrollTop: false,
  /**
   * String jquery selector (for example 'body') of element to take offset().top from, if empty string the drilldown menu offset().top is taken
   * @option
   * @type {string}
   * @default ''
   */
  scrollTopElement: '',
  /**
   * ScrollTop offset
   * @option
   * @type {number}
   * @default 0
   */
  scrollTopOffset: 0,
  /**
   * Scroll animation duration
   * @option
   * @type {number}
   * @default 500
   */
  animationDuration: 500,
  /**
   * Scroll animation easing. Can be `'swing'` or `'linear'`.
   * @option
   * @type {string}
   * @see {@link https://api.jquery.com/animate|JQuery animate}
   * @default 'swing'
   */
  animationEasing: 'swing'
  // holdOpen: false
};

export {Drilldown};
