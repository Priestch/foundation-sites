// Injects the "Master {topic}" promo into the TOC ad slot.
// 7.0 chrome re-skin (unit 3): jQuery-free port of the docs.ad behavior.

!function() {

document.addEventListener('DOMContentLoaded', function() {
  var slot = document.getElementById('TOCAdUnit');
  if (!slot) return;

  // TODO: Add alternate between advanced and intro
  var title = document.querySelector('h1.docs-page-title');
  var topic = title ? title.textContent.trim() : '';
  if (topic.length < 1) { topic = 'Foundation'; }

  var unit = document.createElement('div');
  unit.className = 'ad-unit';

  var header = document.createElement('h3');
  header.className = 'ad-unit-title';
  header.textContent = 'Master ' + topic;

  var body = document.createElement('p');
  body.className = 'ad-unit-text';
  body.textContent = 'Get up to speed FAST, learn straight from the experts who built Foundation.';

  var cta = document.createElement('a');
  cta.className = 'button ad-unit-button';
  cta.href = 'https://zurb.com/university/foundation-intro?utm_source=Foundation%20Docs&utm_medium=Docs&utm_content=Struggling&utm_campaign=Docs%20To%20Intro';
  cta.textContent = 'Learn More';

  unit.appendChild(header);
  unit.appendChild(body);
  unit.appendChild(cta);
  slot.innerHTML = '';
  slot.appendChild(unit);
});

}();
