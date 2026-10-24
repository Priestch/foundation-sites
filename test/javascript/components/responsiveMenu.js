describe('Responsive Menu', function() {
	var plugin;
	var html;
	var atLeastStub;
	var template = `<ul data-responsive-menu="dropdown">
	  <li><a href="#">Item 1</a>
	    <ul class="menu">
	      <li><a href="#">Subitem 1</a></li>
	      <li><a href="#">Subitem 2</a></li>
	    </ul>
	  </li>
	  <li><a href="#">Item 2</a></li>
	</ul>`;

  afterEach(function() {
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    html.remove();
    if (atLeastStub) {
      atLeastStub.restore();
      atLeastStub = null;
    }
  });

  describe('destroy()', function() {
    it('removes its media query handler from window', function() {
      html = document.body.appendChild(fixture(template));
      plugin = new Foundation.ResponsiveMenu(html, {});

      // S13 flip: the mq consumer listens on the native event layer now.
      // MediaQuery.atLeast is what _checkMediaQueries calls: count its
      // invocations to pin that the real broadcast reaches the handler
      // before the destroy and finds nothing after it.
      atLeastStub = sinon.stub(Foundation.MediaQuery, 'atLeast').callsFake(function(query) {
        return query === 'small';
      });

      var calls = atLeastStub.callCount;
      FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
      atLeastStub.callCount.should.be.above(calls);

      plugin.destroy();

      var afterDestroy = atLeastStub.callCount;
      FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
      atLeastStub.callCount.should.equal(afterDestroy);
    });
  });

});
