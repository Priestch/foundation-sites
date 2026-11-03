// Docs search: filter-as-you-type over data/search.json.
// 7.0 chrome re-skin (unit 3): replaces corejs-typeahead (and with it the
// docs bundle's last jQuery consumer) with a native implementation that
// reproduces the typeahead markup contract — the input gets wrapped in a
// span.twitter-typeahead and the dropdown is a .tt-menu of .tt-suggestion
// divs, .tt-cursor marking the keyboard selection — so the chrome scss
// (unit 2) keeps styling it without a single change.
//
// The filtering is the package's algorithm, verbatim: terms are the
// lowercase name, the name with dashes stripped, and the entry's tags; a
// term containing the query as a substring matches. 10 results max.

!function() {

var LIMIT = 10;
var DEBOUNCE = 100;

var data = null;       // search.json entries, fetched lazily on first use
var dataPromise = null;

var fetchData = function() {
  if (!dataPromise) {
    dataPromise = fetch('./data/search.json').then(function(res) {
      return res.json();
    }).then(function(json) {
      data = json;
      return json;
    }).catch(function(err) {
      console.error('Failed to load search index:', err);
      data = [];
    });
  }
  return dataPromise;
};

var filter = function(query) {
  if (!data) return [];
  var q = query.toLowerCase();
  var out = [];
  for (var i = 0; i < data.length && out.length < LIMIT; i++) {
    var item = data[i];
    var name = item.name.toLowerCase();
    var terms = [name, name.replace(/-/g, '')].concat(item.tags || []);
    for (var j = 0; j < terms.length; j++) {
      if (terms[j].indexOf(q) > -1) { out.push(item); break; }
    }
  }
  return out;
};

var attach = function(input) {
  // Reproduce typeahead's wrapper (the scss positions the icon off it)
  var wrapper = document.createElement('span');
  wrapper.className = 'twitter-typeahead';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  var menu = document.createElement('div');
  menu.className = 'tt-menu';
  menu.style.display = 'none';
  wrapper.appendChild(menu);

  var items = [];
  var cursor = -1;
  var debounceTimer = null;

  var setCursor = function(index) {
    var suggestions = menu.querySelectorAll('.tt-suggestion');
    if (!suggestions.length) return;
    cursor = (index + suggestions.length) % suggestions.length;
    for (var i = 0; i < suggestions.length; i++) {
      suggestions[i].classList.toggle('tt-cursor', i === cursor);
    }
    suggestions[cursor].scrollIntoView({ block: 'nearest' });
  };

  var open = function() {
    menu.style.display = 'block';
  };

  var close = function() {
    menu.style.display = 'none';
    cursor = -1;
  };

  var select = function(item) {
    if (item && item.link) window.location.href = item.link;
  };

  var render = function(query) {
    menu.innerHTML = '';
    items = query ? filter(query) : [];
    cursor = -1;

    if (!query) { close(); return; }

    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'tt-empty';
      empty.textContent = 'No results for "' + query + '".';
      menu.appendChild(empty);
    } else {
      items.forEach(function(item) {
        var suggestion = document.createElement('div');
        suggestion.className = 'tt-suggestion';

        var row = document.createElement('div');
        var name = document.createElement('span');
        name.className = 'name';
        name.textContent = item.name;
        var meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = item.type;
        var desc = document.createElement('span');
        desc.className = 'desc';
        desc.textContent = item.description || '';

        name.appendChild(meta);
        row.appendChild(name);
        row.appendChild(document.createTextNode(' '));
        row.appendChild(desc);
        suggestion.appendChild(row);

        // navigate on mousedown: typeahead's suggestion click beat the
        // input's blur; preventDefault keeps focus so the menu stays alive
        suggestion.addEventListener('mousedown', function(e) {
          e.preventDefault();
        });
        suggestion.addEventListener('click', function() {
          select(item);
        });

        menu.appendChild(suggestion);
      });
    }
    open();
  };

  var renderFromInput = function() {
    render(input.value.trim());
  };

  input.addEventListener('input', function() {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(function() {
      if (data) {
        renderFromInput();
      } else {
        fetchData().then(renderFromInput);
      }
    }, DEBOUNCE);
  });

  input.addEventListener('focus', function() {
    if (!data) fetchData().then(function() {
      if (input.value.trim()) renderFromInput();
    });
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (menu.style.display !== 'none') setCursor(cursor + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (menu.style.display !== 'none') setCursor(cursor - 1);
    } else if (e.key === 'Enter') {
      if (menu.style.display !== 'none' && cursor >= 0 && items[cursor]) {
        e.preventDefault();
        select(items[cursor]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  input.addEventListener('blur', function() {
    // slight delay so a pending click on a suggestion wins
    window.setTimeout(close, 150);
  });
};

var inputs = document.querySelectorAll('[data-docs-search]');
Array.prototype.forEach.call(inputs, attach);

// Auto-highlight the search box on desktop-width, non-mobile browsers —
// the package focused the first match, which was the hidden mobile input;
// focusing the visible one makes the old intent actually work
if (!navigator.userAgent.match(/(iP(hone|ad|od)|Android)/)) {
  Array.prototype.forEach.call(inputs, function(input) {
    if (input.offsetParent !== null) {
      input.focus();
      return false; // first visible input only
    }
  });
}

}();
