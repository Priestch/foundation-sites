describe('Tooltip', function() {
  var plugin;
  var html;
  var template = `
    <span data-tooltip aria-haspopup="true" class="has-tip" tabindex="1" title="TOOLTIP_CONTENT">
      TEXT
    </span>`;
  Foundation.Tooltip.defaults.showOn = 'all';
  Foundation.Tooltip.defaults.fadeOutDuration = 0;
  Foundation.Tooltip.defaults.fadeInDuration = 0;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

  describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {

    it('has value of title attribute as content', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      plugin.template[0].textContent.should.equal('TOOLTIP_CONTENT');
    });

    it('has value of tipText option as content', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {tipText: 'TOOLTIP_CONTENT_OPTION'});

      plugin.template[0].textContent.should.equal('TOOLTIP_CONTENT_OPTION');
    });

    it('uses value of template option as template', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {template: '<div class="TEMPLATE_OPTION"></div>'});

      plugin.template[0].classList.contains('TEMPLATE_OPTION').should.be.true;
    });

    it('uses value of triggerClass option as trigger class', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {triggerClass: 'TRIGGER_CLASS_OPTION'});

      plugin.$element[0].classList.contains('TRIGGER_CLASS_OPTION').should.be.true;
    });

    it('sets ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      plugin.$element[0].getAttribute('aria-describedby').should.equal(plugin.template[0].getAttribute('id'));
      plugin.template[0].getAttribute('aria-hidden').should.equal('true');
      plugin.template[0].getAttribute('role').should.equal('tooltip');
    });

  });

  describe('buildTemplate()', function() {
    it('uses value of templateClasses option as template class', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {templateClasses: 'TOOLTIP_CLASS_OPTION'});

      plugin.template[0].classList.contains('TOOLTIP_CLASS_OPTION').should.be.true;
    });
  });

  describe('show()', function() {
    it('shows the tooltip', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      plugin.show();

      FoundationNext.Dom.visible(plugin.template[0]).should.be.true;
      plugin.template[0].getAttribute('aria-hidden').should.equal('false');
    });

    it('fires show.zf.tooltip event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      FoundationNext.Events.on(html, 'show.zf.tooltip', function() {
        FoundationNext.Dom.visible(plugin.template[0]).should.be.true;
        done();
      });

      plugin.show();
    });
  });

  describe('hide()', function() {
    it('hides the tooltip', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      // Show first
      plugin.show();

      plugin.hide();

      FoundationNext.Dom.visible(plugin.template[0]).should.be.false;
      plugin.template[0].getAttribute('aria-hidden').should.equal('true');
    });

    it('fires hide.zf.tooltip event', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      // Open it first
      plugin.show();

      FoundationNext.Events.on(html, 'hide.zf.tooltip', function() {
        FoundationNext.Dom.visible(plugin.template[0]).should.be.false;
        done();
      });

      plugin.hide();
    });
  });

  describe('toggle()', function() {
    it('shows a hidden tooltip', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      plugin.toggle();
      FoundationNext.Dom.visible(plugin.template[0]).should.be.true;
      plugin.template[0].getAttribute('aria-hidden').should.equal('false');
    });
    it('hides a visible tooltip', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tooltip(html, {});

      // Show first
      plugin.show();

      plugin.toggle();
      FoundationNext.Dom.visible(plugin.template[0]).should.be.false;
      plugin.template[0].getAttribute('aria-hidden').should.equal('true');
    });
  });

});