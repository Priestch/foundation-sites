describe('Responsive Menu', function() {
	var plugin;
	var $html;
	var template = `<ul data-responsive-menu="dropdown">
	  <li><a href="#">Item 1</a>
	    <ul class="menu">
	      <li><a href="#">Subitem 1</a></li>
	      <li><a href="#">Subitem 2</a></li>
	    </ul>
	  </li>
	  <li><a href="#">Item 2</a></li>
	</ul>`;

  describe('destroy()', function() {
    it('removes its media query handler from window', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.ResponsiveMenu($html, {});

      plugin.destroy();

      var events = $._data(window, 'events') || {};
      var menuHandlers = (events.changed || []).filter(function(ev) {
        return ev.handler === plugin._changedZfMediaQueryHandler;
      });
      menuHandlers.should.be.empty;
    });
  });

});
