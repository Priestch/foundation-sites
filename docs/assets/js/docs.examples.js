// Code for specific docs examples (7.0 line A: jQuery-free).

!function() {

document.querySelectorAll('[data-docs-example-ofc]').forEach(function(el) {
  el.addEventListener('click', function() {
    var ofc = document.getElementById('offCanvasLeft');
    if (ofc) { ofc.classList.toggle('reveal-for-large'); }
    // the 6.x $('.sticky').foundation('_calc', true) dispatch is gone; the
    // Registry is the 7.0 lookup
    document.querySelectorAll('.sticky').forEach(function(stickyEl) {
      var instance = Foundation.Registry.getInstance(stickyEl);
      if (instance && typeof instance._calc === 'function') { instance._calc(true); }
    });
  });
});

document.querySelectorAll('[data-docs-example-series]').forEach(function(el) {
  el.addEventListener('click', function() {
    var demo = document.getElementById('series-example');
    if (demo) { demo.classList.add('is-animating'); }
  });
});

document.querySelectorAll('.docs-transitions').forEach(function(select) {
  select.addEventListener('change', function() {
    var value = select.value;
    var method = value.match('-in') ? 'animateIn' : 'animateOut';
    document.querySelectorAll('.docs-transition-demo').forEach(function(demo) {
      Foundation.Motion[method](demo, value, function() {
        demo.style.display = '';
      });
    });
  });
});

var stickyMag = document.getElementById('sticky-magellan');
if (stickyMag) {
  // real bubbling CustomEvents - plain DOM listeners hear them
  stickyMag.addEventListener('sticky', function(e) {
    var nav = stickyMag.querySelector('nav');
    if (!nav) { return; }
    if (e.type === 'sticky' && e.namespace === 'stuckto:top.zf') { nav.classList.add('stuck-mag'); }
    if (e.type === 'sticky' && e.namespace === 'unstuckfrom:top.zf') { nav.classList.remove('stuck-mag'); }
  });
}

}();
