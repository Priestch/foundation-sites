// Generates the right-hand table of contents from the <h2>s on a page.
// 7.0 chrome re-skin (unit 3): jQuery-free port of the foundation-docs
// module.

!function() {

var toc = document.querySelector('[data-docs-toc]');
if (!toc) return;

document.querySelectorAll('.docs-component h2').forEach(function(h2) {
  // Ignore <h2>s inside of a rendered code sample
  if (h2.closest('.docs-code-live')) return;

  // Get the text in the title without the nested anchor icon
  var text = '';
  Array.prototype.forEach.call(h2.childNodes, function(node) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
  });

  var anchor = h2.querySelector('a');
  if (!anchor) return;

  var link = document.createElement('a');
  link.href = anchor.getAttribute('href');
  link.textContent = text.trim();

  var item = document.createElement('li');
  item.appendChild(link);
  toc.appendChild(item);
});

}();
