describe('Magellan', function() {
	var plugin;
	var html, content;

  var generateUl = function(count) {
  	var html = '';
  	html += '<ul class="vertical-menu">';
  	for (var c = 0; c < count; c++) {
  		html += '<li><a href="#target-' + c + '">Section ' + c + '</a></li>';
  	}
  	html += '</ul>';
  	return html;
  };
  var generateContent = function(count) {
  	var html = '';
  	html += '<div>';
  	for (var c = 0; c < count; c++) {
  		html += '<div id="target-' + c + '" style="height: 1000px";>Section ' + c + '</div>';
  	}
  	html += '</div>';
  	return html;
  };

  afterEach(function() {
    plugin.destroy();
    html.remove();
    content.remove();
  });

	// afterEach(function() {
	// 	plugin.destroy();
	// 	html.remove();
	// });

	describe('constructor()', function() {
		// it('', function() {
		// 	html = $('').appendTo('body');
		// 	plugin = new Foundation.Magellan(html, {});

		// 	plugin.$element.should.be.an('object');
		// 	plugin.options.should.be.an('object');
		// });
	});


	describe('scrollToLoc()', function() {
    it('scrolls the selected element into viewport', function(done) {
    	var count = 5, duration = 200;
      html = document.body.appendChild(fixture(generateUl(count)));
      content = document.body.appendChild(fixture(generateContent(count)));
      plugin = new Foundation.Magellan(html, {
      	animationDuration: duration
      });

      // Jump to last section
      var target = (html.querySelectorAll('a')[html.querySelectorAll('a').length -1]).getAttribute('href');
      plugin.scrollToLoc(target);

      setTimeout(function() {
        var isInViewport = false;
        // jQuery .offset().top == document-relative top; body scrollTop ==
        // window.pageYOffset; innerHeight == window.innerHeight
        var lastDiv = content.querySelectorAll('div')[content.querySelectorAll('div').length - 1];
        var lastDivTop = lastDiv.getBoundingClientRect().top + window.pageYOffset;
        var contentTop = content.getBoundingClientRect().top + window.pageYOffset;
        if (lastDivTop > window.pageYOffset && contentTop < window.pageYOffset + window.innerHeight) {
          isInViewport = true;
        }
        isInViewport.should.equal(true);
        done();
      }, duration);

    });


    it('fails gracefully when target does not exist', function() {
    	var count = 5, duration = 200;
      html = document.body.appendChild(fixture(generateUl(count)));
      content = document.body.appendChild(fixture(generateContent(count - 1)));
      plugin = new Foundation.Magellan(html, {
      	animationDuration: duration
      });

      var hasError = false;
      var targets = html.querySelectorAll('a');
      try {
        var target = (targets[targets.length -1]).getAttribute('href');
        plugin.scrollToLoc(target);
      }
      catch (err) {
        hasError = true;
      }
      hasError.should.equal(false);
    });

  });

});
