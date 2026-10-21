describe('Equalizer', function() {
  var plugin;
  var $html;
  var template = `<div data-equalizer data-equalize-on="small">
    <div data-equalizer-watch>One</div>
    <div data-equalizer-watch>Two</div>
  </div>`;

  afterEach(function() {
    // destroy() nulls instance properties, so skip if the test destroyed it already
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    $html.remove();
  });

  describe('destroy()', function() {
    it('removes its media query handler from window', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Equalizer($html, {});

      plugin.destroy();

      var events = $._data(window, 'events') || {};
      var mqHandlers = (events.changed || []).filter(function(ev) {
        return ev.handler === plugin._bindHandler.onCheckMQBound;
      });
      mqHandlers.should.be.empty;
    });
  });
});
