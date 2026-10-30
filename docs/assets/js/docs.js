// Docs site bootstrap (7.0 line A: jQuery-free - the library runs without
// it, and so does the docs chrome; any hidden dependency throws here).
Foundation.init();

document.addEventListener('DOMContentLoaded', function() {
  // [TODO] Remove this when possible (equalizer debug hook)
  var counter = 0;
  var testEq = document.getElementById('test-eq');
  if (testEq) {
    // real bubbling CustomEvents - a plain DOM listener hears them
    testEq.addEventListener('postequalized', function() {
      counter++;
      console.log(counter);
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  var versionStamp = document.querySelector('[data-docs-version]');
  if (versionStamp) {
    versionStamp.textContent = 'v' + Foundation.version;
  }
});

var ACCORDION_KEY = 'docs-accordion-expandall';
var expandAllState = false;

var expandAccordion = function(link) {
  var accordion = link.closest('.accordion');
  accordion.querySelectorAll('.accordion-item, .accordion-content').forEach(function(el) {
    el.classList.add('is-active');
  });
  link.textContent = 'Collapse';
  expandAllState = false;
  if (localStorage) { localStorage.setItem(ACCORDION_KEY, 'true'); }
};

var contractAccordion = function(link) {
  var accordion = link.closest('.accordion');
  accordion.querySelectorAll('.accordion-item, .accordion-content').forEach(function(el) {
    el.classList.remove('is-active');
  });
  link.textContent = 'Expand';
  expandAllState = true;
  if (localStorage) { localStorage.setItem(ACCORDION_KEY, 'false'); }
};

document.querySelectorAll('[data-expand-all]').forEach(function(link) {
  link.addEventListener('click', function() {
    if (expandAllState === true) {
      expandAccordion(link);
    } else {
      contractAccordion(link);
    }
  });
});

document.querySelectorAll('[data-expand-all]').forEach(function(link) {
  if (localStorage.getItem(ACCORDION_KEY) === 'true') {
    expandAccordion(link);
  } else {
    link.textContent = 'Expand';
  }
});
