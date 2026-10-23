describe('Tabs', function() {
  var plugin;
  var html;
  var template = `
    <div>
      <ul class="tabs" data-tabs id="example-tabs">
        <li class="tabs-title is-active"><a href="#panel1" aria-selected="true">Tab 1</a></li>
        <li class="tabs-title"><a href="#panel2">Tab 2</a></li>
        <li class="tabs-title"><a data-tabs-target="panel3" href="#/panel3">Tab 3</a></li>
      </ul>

      <div class="tabs-content" data-tabs-content="example-tabs">
        <div class="tabs-panel is-active" id="panel1">
          <p>one</p>
          <p>Check me out! I'm a super cool Tab panel with text content!</p>
        </div>
        <div class="tabs-panel" id="panel2">
          <p>two</p>
          <p>Check me out! I'm a super cool Tab panel with text content!</p>
        </div>
        <div class="tabs-panel" id="panel3">
          <p>three</p>
          <p>Check me out! I'm a super cool Tab panel with text content!</p>
        </div>
      </div>
    </div>`;

  afterEach(function() {
    plugin.destroy();
    html.remove();
  });

 describe('constructor()', function() {
    it('stores the element and plugin options', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.$element.should.be.an('object');
      plugin.options.should.be.an('object');
    });
  });

  describe('init()', function() {
    it('sets ARIA attributes', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      // Panels
      html.querySelector('#panel1').getAttribute('role').should.equal('tabpanel');
      html.querySelector('#panel1').getAttribute('aria-labelledby').should.equal(html.querySelector('[href="#panel1"]').getAttribute('id'));
      html.querySelector('#panel1').hasAttribute('aria-hidden').should.be.false;
      html.querySelector('#panel2').getAttribute('aria-hidden').should.equal('true');

      // Links
      html.querySelector('[href="#panel1"]').getAttribute('role').should.equal('tab');
      html.querySelector('[href="#panel1"]').getAttribute('aria-controls').should.equal(html.querySelector('#panel1').getAttribute('id'));
      html.querySelector('[href="#panel1"]').getAttribute('aria-selected').should.equal('true');
      html.querySelector('[href="#panel2"]').getAttribute('aria-selected').should.equal('false');

      // Tab list items
      html.querySelector('[href="#panel1"]').parentElement.getAttribute('role').should.equal('presentation');
    });
  });

  describe('selectTab()', function() {
    it('opens the selected tab via jQuery element', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab(html.querySelector('#panel2'));
      FoundationNext.Dom.visible(html.querySelector('#panel2')).should.be.true;
    });

    it('opens the selected tab via id string', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel2');
      FoundationNext.Dom.visible(html.querySelector('#panel2')).should.be.true;
    });

    it('opens the selected tab with data-tabs-target attribute', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#/panel3');
      FoundationNext.Dom.visible(html.querySelector('#panel3')).should.be.true;
    });

    it('opens the selected tab with data-tabs-target attribute and external href', function () {
      html = document.body.appendChild(fixture(`
      <div>
        <ul class="tabs" data-tabs id="example-tabs">
          <li class="tabs-title is-active"><a href="#panel1" aria-selected="true">Tab 1</a></li>
          <li class="tabs-title"><a href="#panel2">Tab 2</a></li>
          <li class="tabs-title"><a data-tabs-target="panel3" href="http://example.com">Tab 3</a></li>
        </ul>
  
        <div class="tabs-content" data-tabs-content="example-tabs">
          <div class="tabs-panel is-active" id="panel1">
            <p>one</p>
            <p>Check me out! I'm a super cool Tab panel with text content!</p>
          </div>
          <div class="tabs-panel" id="panel2">
            <p>two</p>
            <p>Check me out! I'm a super cool Tab panel with text content!</p>
          </div>
          <div class="tabs-panel" id="panel3">
            <p>three</p>
            <p>Check me out! I'm a super cool Tab panel with text content!</p>
          </div>
        </div>
      </div>`));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel3');
      FoundationNext.Dom.visible(html.querySelector('#panel3')).should.be.true;
    })
  });

  describe('_handleTabChange()', function() {
    it('opens the selected tab', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel2');
      FoundationNext.Dom.visible(html.querySelector('#panel2')).should.be.true;
      html.querySelector('#panel2').classList.contains('is-active').should.be.true;
    });

    it('sets ARIA attributes for open tab', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel2');
      html.querySelector('#panel2').hasAttribute('aria-hidden').should.be.false;
      html.querySelector('[href="#panel2"]').getAttribute('aria-selected').should.equal('true');
    });

    it('hides the open tab', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel2');
      FoundationNext.Dom.visible(html.querySelector('#panel1')).should.be.false;
      html.querySelector('#panel1').classList.contains('is-active').should.be.false;
    });

    it('sets ARIA attributes for closed tab', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      plugin.selectTab('#panel2');
      html.querySelector('#panel1').getAttribute('aria-hidden').should.equal('true');
      html.querySelector('[href="#panel1"]').getAttribute('aria-selected').should.equal('false');
    });

    it('fires change.zf.tabs event with target as data', function(done) {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      // jQuery instrument on purpose: the change production is the pinned
      // jQuery seam - its synthetic event never reaches a native listener
      $(html).one('change.zf.tabs', function(e, target) {
        e.stopPropagation();
        html.querySelector('[href="#panel2"]').parentElement.should.be.equal(target[0]);
        done();
      });

      plugin.selectTab('#panel2');
    });
  });

  describe('keyboard events', function() {
    it('switches to next tab on ARROW_RIGHT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      html.querySelector('[href="#panel1"]').focus();

      html.querySelector('[href="#panel1"]').dispatchEvent(window.mockKeyboardEvent('ARROW_RIGHT'));

      FoundationNext.Dom.visible(html.querySelector('#panel2')).should.be.true;
      html.querySelector('#panel2').classList.contains('is-active').should.be.true;
    });
    it('switches to next tab on ARROW_DOWN', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      html.querySelector('[href="#panel1"]').focus();

      html.querySelector('[href="#panel1"]').dispatchEvent(window.mockKeyboardEvent('ARROW_DOWN'));

      FoundationNext.Dom.visible(html.querySelector('#panel2')).should.be.true;
      html.querySelector('#panel2').classList.contains('is-active').should.be.true;
    });
    it('switches to previous tab on ARROW_LEFT', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      html.querySelector('[href="#panel2"]').focus();

      html.querySelector('[href="#panel2"]').dispatchEvent(window.mockKeyboardEvent('ARROW_LEFT'));

      FoundationNext.Dom.visible(html.querySelector('#panel1')).should.be.true;
      html.querySelector('#panel1').classList.contains('is-active').should.be.true;
    });
    it('switches to previous tab on ARROW_UP', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.Tabs(html.querySelector('[data-tabs]'), {});

      html.querySelector('[href="#panel2"]').focus();

      html.querySelector('[href="#panel2"]').dispatchEvent(window.mockKeyboardEvent('ARROW_UP'));

      FoundationNext.Dom.visible(html.querySelector('#panel1')).should.be.true;
      html.querySelector('#panel1').classList.contains('is-active').should.be.true;
    });
  });
});
