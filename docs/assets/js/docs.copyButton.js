// Adds a copy button to every code example in the docs.
// 7.0 chrome re-skin (unit 3): jQuery-free port of the foundation-docs
// module (which already used navigator.clipboard — the clipboard.js
// library was never actually called).

!function() {

document.querySelectorAll('[data-docs-code]').forEach(function(example) {
  var code = example.querySelector('code');
  if (!code) return;

  var text = code.textContent;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'docs-code-copy';
  button.textContent = 'Copy';

  example.insertBefore(button, example.firstChild);

  button.addEventListener('click', function() {
    navigator.clipboard.writeText(text).then(function() {
      // Change the text of the copy button when it's clicked on
      button.textContent = 'Copied!';
      window.setTimeout(function() {
        button.textContent = 'Copy';
      }, 3000);
    }, function(err) {
      // Log errors on copy failure
      console.error('Copy action failed:', err);
    });
  });
});

}();
