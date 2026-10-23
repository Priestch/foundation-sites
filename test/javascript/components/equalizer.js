describe('Equalizer', function() {
  var plugin;
  var $html;
  var isStub;
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
    if (isStub) {
      isStub.restore();
      isStub = null;
    }
  });

  describe('destroy()', function() {
    it('removes its media query handler from window', function() {
      $html = $(template).appendTo('body');
      plugin = new Foundation.Equalizer($html, {});

      // S13 flip: the mq consumer listens on the native event layer now.
      // MediaQuery.is is what _checkMQ calls: count its invocations to pin
      // that the real broadcast reaches the handler before the destroy and
      // finds nothing after it.
      isStub = sinon.stub(Foundation.MediaQuery, 'is').callsFake(function(size) {
        return size === 'small';
      });

      var calls = isStub.callCount;
      FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
      isStub.callCount.should.be.above(calls);

      plugin.destroy();

      var afterDestroy = isStub.callCount;
      FoundationNext.Events.trigger(window, 'changed.zf.mediaquery');
      isStub.callCount.should.equal(afterDestroy);
    });
  });
});
