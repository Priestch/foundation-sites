describe('Toggler', function() {
  var plugin;
  var html;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

  function appendTriggers() {
    var scope = fixture(`<div>
      <a data-open="toggler">Open</a>
      <a data-close="toggler">Close</a>
      <a data-toggle="toggler">Toggle</a>
    </div>`);
    document.body.appendChild(scope);
    return scope;
  }

  // Every trigger link inside the scope, like
  // `$scope.find('[data-open], [data-close], [data-toggle]')`.
  function triggersOf(scope) {
    return Array.from(scope.querySelectorAll('[data-open], [data-close], [data-toggle]'));
  }

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      (plugin.$element instanceof Element).should.be.true;
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('stores the class defined on the data-toggler attribute', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin.className.should.equal('class');
    });

    it('stores the class defined on the data-toggler attribute (with leading dot)', function() {
      html = fixture('<div id="toggler" data-toggler=".class"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin.className.should.equal('class');
    });

    it('stores defined animation classes', function() {
      html = fixture('<div id="toggler" data-toggler data-animate="fade-in fade-out"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin.animationIn.should.equal('fade-in');
      plugin.animationOut.should.equal('fade-out');
    });

    it('adds Aria attributes to click triggers', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-controls').should.equal('toggler');
      });
      scope.remove();
    });

    it('sets aria-expanded to false if the element has toggler class and no animate and toggler class not in class set', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('false');
      });
      scope.remove();
    });

    it('sets aria-expanded to true if the element has toggler class and no animate and toggler class is in class set', function() {
      html = fixture('<div id="toggler" class="class" data-toggler="class"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('true');
      });
      scope.remove();
    });

    it('sets aria-expanded to true if the element is visible and animate set', function() {
      html = fixture('<div id="toggler" data-animate="hinge-in-from-top spin-out"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('true');
      });
      scope.remove();
    });

    it('sets aria-expanded to false if the element is invisible and animate set', function() {
      var css = fixture('<style>#toggler { display: none }</style>');
      document.body.appendChild(css);
      html = fixture('<div id="toggler" data-animate="hinge-in-from-top spin-out"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('false');
      });
      scope.remove();
      css.remove();
    });
  });

  describe('toggle()', function() {
    it('calls Toggler._toggleClass() if the element toggles with a class');
    it('calls Toggler._toggleAnimate() if the element toggles with animation');
  });

  describe('toggleClass()', function() {
    it('toggles a class on the element', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      plugin = new Foundation.Toggler(html, {});

      plugin._toggleClass();
      document.getElementById('toggler').classList.contains('class').should.be.true;

      plugin._toggleClass();
      document.getElementById('toggler').classList.contains('class').should.be.false;
    });

    it('updates aria-expanded after the class is toggled', function() {
      html = fixture('<div id="toggler" data-toggler="class"></div>');
      document.body.appendChild(html);
      var scope = appendTriggers();
      plugin = new Foundation.Toggler(html, {});

      plugin._toggleClass();
      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('true');
      });

      plugin._toggleClass();
      triggersOf(scope).forEach(function(trigger) {
        trigger.getAttribute('aria-expanded').should.equal('false');
      });

      scope.remove();
    });
  });

  // [TODO] Re-enable this if you can get it working in PhantomJS
  xdescribe('toggleAnimate()', function() {
    it('animates an invisible element in', function(done) {
      var css = fixture('<style>#toggler { display: none; }</style>');
      document.body.appendChild(css);
      html = fixture('<div id="toggler" data-toggler data-animate="fade-in fade-out"></div>');
      document.body.appendChild(html);

      plugin = new Foundation.Toggler(html, {});

      FoundationNext.Events.on(html, 'on.zf.toggler', function() {
        FoundationNext.Dom.visible(document.getElementById('toggler')).should.be.true;
        css.remove();
        done();
      });

      plugin._toggleAnimate();
    });

    it('animates a visible element out', function(done) {
      html = fixture('<div id="toggler" data-toggler data-animate="fade-in fade-out"></div>');
      document.body.appendChild(html);

      plugin = new Foundation.Toggler(html, {});

      FoundationNext.Events.on(html, 'off.zf.toggler', function() {
        FoundationNext.Dom.visible(document.getElementById('toggler')).should.be.false;
        done();
      });

      plugin._toggleAnimate();
    });
  });
});
