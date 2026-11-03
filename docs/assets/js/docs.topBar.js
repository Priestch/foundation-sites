// Sticky top bar: hides on scroll-down (mobile), and focuses the inline
// search when the mobile toggler opens it.
// 7.0 chrome re-skin (unit 3): jQuery-free port. The zf.toggler events are
// real bubbling CustomEvents now — listen for the bare type and check
// e.namespace.

!function() {

var prev = 0;
var nav = document.querySelector('.docs-sticky-top-bar');

if (nav) {
  window.addEventListener('scroll', function() {
    var scrollTop = window.pageYOffset;
    nav.classList.toggle('mobile-hidden', scrollTop > prev && scrollTop > 100);
    prev = scrollTop;
  }, { passive: true });
}

var inlineSearch = document.getElementById('inline-search');
var searchButton = document.querySelector('.search-button');

if (inlineSearch) {
  var input = inlineSearch.querySelector('input');

  inlineSearch.addEventListener('on', function(e) {
    // the Events layer joins namespaces SORTED ('zf.toggler' → 'toggler.zf')
    if (e.namespace !== 'toggler.zf') return;
    if (input) input.focus();
    if (searchButton) searchButton.classList.add('search-open');
  });
  inlineSearch.addEventListener('off', function(e) {
    if (e.namespace !== 'toggler.zf') return;
    if (input) input.blur();
    if (searchButton) searchButton.classList.remove('search-open');
  });
}

}();
