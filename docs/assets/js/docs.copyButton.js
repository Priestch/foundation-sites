// Adds a header row to every code example: language label + copy button.
// 7.0 modernization pass: the copy control used to be a solid-primary
// block absolutely positioned over the top-right corner; it now lives in
// the panel header docs.code.scss styles.

!function() {

document.querySelectorAll('[data-docs-code]').forEach(function(example) {
  var code = example.querySelector('code');
  if (!code) return;

  var text = code.textContent;

  var header = document.createElement('div');
  header.className = 'docs-code-header';

  var language = document.createElement('span');
  language.className = 'docs-code-language';
  language.textContent = (code.className.split(/\s+/)[0] || 'text').toUpperCase();

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'docs-code-copy';
  button.textContent = 'Copy';

  header.appendChild(language);
  header.appendChild(button);
  example.insertBefore(header, example.firstChild);

  button.addEventListener('click', function() {
    navigator.clipboard.writeText(text).then(function() {
      button.textContent = 'Copied!';
      window.setTimeout(function() {
        button.textContent = 'Copy';
      }, 3000);
    }, function(err) {
      console.error('Copy action failed:', err);
    });
  });
});

}();
