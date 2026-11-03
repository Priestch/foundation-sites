// Kitchen Sink page: code examples start hidden and reveal through a
// Toggle Code link.
// 7.0 chrome re-skin (unit 3): jQuery-free port — the slideToggle(250)
// animation rides the framework's native Motion primitives.

!function() {

var ks = document.getElementById('docs-kitchen-sink');
if (!ks) return;

ks.querySelectorAll('[data-ks-codepen]').forEach(function(codepen) {
  var code = codepen.nextElementSibling;
  while (code && !code.hasAttribute('data-docs-code')) {
    code = code.nextElementSibling;
  }
  if (!code) return;

  var link = document.createElement('a');
  link.className = 'docs-code-toggle';
  link.href = '#';
  link.textContent = 'Toggle Code';

  link.addEventListener('click', function(e) {
    e.preventDefault();
    if (codepen.style.display === 'none') {
      Foundation.Motion.slideDown(codepen, 250);
      Foundation.Motion.slideDown(code, 250);
    } else {
      Foundation.Motion.slideUp(codepen, 250);
      Foundation.Motion.slideUp(code, 250);
    }
  });

  codepen.parentNode.insertBefore(link, codepen);
  codepen.classList.add('kitchen-sink');
  code.classList.add('kitchen-sink');
  codepen.style.display = 'none';
  code.style.display = 'none';
});

}();
