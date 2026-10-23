import $ from 'jquery';

// S13 (7.0 line A): the DOM reads/writes inside Feather and Burn moved from
// jQuery traversal to the element's own DOM API. The `menu` parameter keeps
// its historical shape - the jQuery collections the three menu plugins pass
// in - and the jQuery import stays until the wrap-up slice removes the last
// import; a plain element also works (toMenu unwraps it), because the
// collection reads inside the callers were the only jQuery-form requirement.
function toMenu(menu) {
  return menu[0] !== undefined && menu[0] !== null ? menu[0] : menu;
}

const Nest = {
  Feather(menu, type = 'zf') {
    menu = toMenu(menu);
    menu.setAttribute('role', 'menubar');
    menu.querySelectorAll('a').forEach(function(anchor) {
      anchor.setAttribute('role', 'menuitem');
    });

    const subMenuClass = `is-${type}-submenu`,
        subItemClass = `${subMenuClass}-item`,
        hasSubClass = `${subMenuClass}-parent`,
        applyAria = (type !== 'accordion'); // Accordions handle their own ARIA attriutes.

    const items = menu.querySelectorAll('li');
    items.forEach(function(item) {
      item.setAttribute('role', 'none');
      const sub = item.querySelector(':scope > ul');

      if (sub) {
        // data-submenu is tagged in this pass; the second pass below sees it

        item.classList.add(hasSubClass);
        if(applyAria) {
          const firstItem = item.querySelector(':scope > a');
          firstItem.setAttribute('aria-haspopup', 'true');
          firstItem.setAttribute('aria-label', firstItem.getAttribute('aria-label') || firstItem.textContent);
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if(type === 'drilldown') {
            item.setAttribute('aria-expanded', 'false');
          }
        }
        sub.classList.add('submenu', subMenuClass);
        sub.setAttribute('data-submenu', '');
        sub.setAttribute('role', 'menubar');
        if(type === 'drilldown') {
          sub.setAttribute('aria-hidden', 'true');
        }
      }

    });
    // Second pass over the SAME item list: each li whose parent ended up
    // tagged with [data-submenu] during the first pass gets the submenu-item
    // classes (the 6.x check read the state after the sub was tagged).
    items.forEach(function(item) {
      if (item.parentElement && item.parentElement.closest('[data-submenu]')) {
        item.classList.add('is-submenu-item', subItemClass);
      }
    });

    return;
  },

  Burn(menu, type) {
    menu = toMenu(menu);
    const subMenuClass = `is-${type}-submenu`,
        subItemClass = `${subMenuClass}-item`,
        hasSubClass = `${subMenuClass}-parent`;

    // `>li, > li > ul, .menu, .menu > li, [data-submenu] > li` from the
    // jQuery find(): the :scope-prefixed parts stay root-relative, the
    // descendant parts search the whole menu.
    const selector = [
      ':scope > li',
      ':scope > li > ul',
      '.menu',
      '.menu > li',
      '[data-submenu] > li'
    ].join(',');

    menu.querySelectorAll(selector).forEach(function(node) {
      node.classList.remove(subMenuClass, subItemClass, hasSubClass, 'is-submenu-item', 'submenu', 'is-active');
      node.removeAttribute('data-submenu');
      node.style.display = '';
    });
  }
}

export {Nest};
