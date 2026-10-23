// S12 contract pins (7.0 line A): Interchange's resizeme consumer, the
// replaced.zf.interchange production, the state attribute writes and the
// rule matching moved to the native Events/DOM layer while the public
// contract stays byte-identical. Both M1 fixes are pinned in their kept
// shape: the one-time load listener per replace and the html-mode
// initialization of the ATTACHED nodes through Foundation.reflow. These
// tests pin that contract from the outside; the pre-existing
// interchange.js suite is untouched on purpose and stays green.
describe('Interchange (native layer contract)', function() {
  var plugin;
  var $html;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) {
      $html.remove();
      $html = null;
    }
  });

  function build(attr, options) {
    $html = $(`<div ${attr || ''}></div>`).appendTo('body');
    plugin = new Foundation.Interchange($html, options);
    return plugin;
  }

  // Spies $.get for one replace() call, hands the fake response to the
  // plugin callback and restores $.get even when the assertions fail.
  function fetchWith(path, response, run) {
    var getSpy = sinon.spy($, 'get');
    try {
      plugin.replace(path);
      sinon.assert.calledWith(getSpy, path);
      getSpy.firstCall.args[1](response);
    }
    finally {
      getSpy.restore();
    }
  }

  describe('init()', function() {
    it('writes the data-resize and id state attributes through the native layer', function() {
      build('data-interchange="[native-interchange.png, (min-width: 99999px)]"');

      var id = $html[0].getAttribute('data-resize');
      (id || '').should.have.length.of.at.least(6);
      $html[0].id.should.equal(id);
    });

    it('matches the rules from the data-interchange attribute on _reflow', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)], [native-b.png, (min-width: 99999px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      plugin._reflow();

      sinon.assert.calledOnce(replaceSpy);
      replaceSpy.firstCall.args[0].should.equal('native-a.png');
    });

    it('resolves special queries through the kept MediaQuery-driven SPECIAL_QUERIES', function() {
      build('data-interchange="[native-a.png, landscape], [native-b.png, retina]"');

      plugin.rules.length.should.equal(2);
      plugin.rules[0].query.should.equal(Foundation.Interchange.SPECIAL_QUERIES['landscape']);
      plugin.rules[1].query.should.equal(Foundation.Interchange.SPECIAL_QUERIES['retina']);
    });

    it('re-reads the data-interchange attribute after the plugin wrote its uuid attribute', function() {
      // Plugin's constructor adds the data-interchange uuid attribute after
      // _setup ran; a late _generateRules call (third-party reInit flows)
      // must still find the rule string, like the former .data() read did.
      build('data-interchange="[native-a.png, (min-width: 1px)]"');

      plugin._generateRules();

      plugin.rules.length.should.equal(1);
      plugin.rules[0].path.should.equal('native-a.png');
    });
  });

  describe('resizeme consumption (native layer)', function() {
    it('reflows through resizeme.zf.trigger fired on the native event layer', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      sinon.assert.calledOnce(replaceSpy);
      replaceSpy.firstCall.args[0].should.equal('native-a.png');
    });

    it('does not consume resizeme.zf.trigger fired on the jQuery side anymore', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      $html.trigger('resizeme.zf.trigger');

      sinon.assert.notCalled(replaceSpy);
    });
  });

  describe('replaced.zf.interchange production (native layer)', function() {
    it('fires through the native event layer with the zf.interchange namespace and reaches jQuery listeners', function() {
      // type 'src' on a div with a path the browser never loads: no real
      // load event can race the assertions below.
      build('', {type: 'src'});
      var el = $html[0];
      var nativeSpy = sinon.spy();
      var jQuerySpy = sinon.spy();
      FoundationNext.Events.on(el, 'replaced.zf.interchange', nativeSpy);
      $html.on('replaced.zf.interchange', jQuerySpy);

      plugin.replace('native-never-loaded.png');

      sinon.assert.calledOnce(nativeSpy);
      nativeSpy.firstCall.args[0].type.should.equal('replaced');
      nativeSpy.firstCall.args[0].namespace.should.equal('interchange.zf');
      sinon.assert.calledOnce(jQuerySpy);
      jQuerySpy.firstCall.args[0].type.should.equal('replaced');
    });

    it('arms a one-time load listener per replace that updates currentPath (kept M1 fix shape)', function() {
      build('', {type: 'src'});

      plugin.replace('native-first.png');
      FoundationNext.Events.trigger($html[0], 'load');
      plugin.currentPath.should.equal('native-first.png');

      // the next replace re-arms exactly one one-time listener; a second
      // load dispatch leaves the state untouched
      plugin.replace('native-second.png');
      FoundationNext.Events.trigger($html[0], 'load');
      plugin.currentPath.should.equal('native-second.png');
      FoundationNext.Events.trigger($html[0], 'load');
      plugin.currentPath.should.equal('native-second.png');
    });
  });

  describe('background mode (native layer)', function() {
    it('writes the escaped url into the inline style and fires replaced', function() {
      build('data-interchange=""', {type: 'background'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'replaced.zf.interchange', nativeSpy);

      plugin.replace('native/img(1).png');

      $html[0].style.backgroundImage.should.contain('native/img%281%29.png');
      sinon.assert.calledOnce(nativeSpy);
    });
  });

  describe('html mode (kept M1 fix)', function() {
    it('initializes the plugins of the inserted content on the attached nodes', function() {
      build('data-interchange=""', {type: 'html'});
      // A child plugin whose rule never matches: its init alone proves the
      // reflow ran on the attached nodes (a detached `$(response)` copy
      // would never receive the data-resize attribute).
      var response = '<div data-interchange="[native-inner.png, (min-width: 99999px)]"></div>';

      fetchWith('native-partial.html', response);

      // the raw response markup is in place (plus the attributes reflow's
      // init added to the child)
      $html[0].innerHTML.indexOf('<div data-interchange="[native-inner.png, (min-width: 99999px)]"').should.equal(0);
      var child = $html[0].firstElementChild;
      (child.getAttribute('data-resize') !== null).should.be.true;
      plugin.currentPath.should.equal('native-partial.html');
    });

    it('fires replaced.zf.interchange from the $.get callback', function() {
      build('data-interchange=""', {type: 'html'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on($html[0], 'replaced.zf.interchange', nativeSpy);

      fetchWith('native-partial-2.html', '<p>content</p>');

      sinon.assert.calledOnce(nativeSpy);
    });
  });

  describe('destroy', function() {
    it('drops the native resizeme listener', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');
      plugin.destroy();
      plugin = null;

      FoundationNext.Events.trigger($html[0], 'resizeme.zf.trigger');

      sinon.assert.notCalled(replaceSpy);
    });
  });
});
